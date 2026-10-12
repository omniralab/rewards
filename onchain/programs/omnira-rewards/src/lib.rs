//! Omnira Rewards - escrow bonusów USDC za zmiany.
//!
//! Firma zakłada budżet na zmianę (sejf USDC), agent Omniry razem z
//! pracownikiem blokuje bounty przy akceptacji oferty, a poświadczyciel
//! Omniry zwalnia je dopiero po potwierdzonej obecności. Niewykorzystane
//! środki wracają do puli firmy, firma wypłaca tylko to, co nie jest
//! zablokowane. Omnira nigdy nie jest właścicielem środków: sejfem
//! zarządza program, a klucze Omniry mają wyłącznie prawo do blokady
//! (agent) i do decyzji „zmiana wykonana / niewykonana" (poświadczyciel).

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked},
};

declare_id!("GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc");

pub const BUDGET_SEED: &[u8] = b"budget";
pub const VAULT_SEED: &[u8] = b"vault";
pub const BOUNTY_SEED: &[u8] = b"bounty";

/// Ile po terminie budżetu zwrot bez poświadczyciela staje się możliwy.
/// Wcześniej obcy mógłby cofnąć blokadę za odbytą zmianę, zanim
/// poświadczyciel zdąży wypłacić - pracownik straciłby zarobione pieniądze.
pub const REFUND_GRACE_SECS: i64 = 3 * 24 * 3600;

#[program]
pub mod omnira_rewards {
    use super::*;

    /// Firma otwiera budżet na jedną zmianę. Limit na osobę i termin są
    /// stałe przez cały czas życia budżetu, żeby agent nie mógł ich obejść.
    pub fn create_budget(
        ctx: Context<CreateBudget>,
        shift_id: u64,
        cap_per_worker: u64,
        expires_at: i64,
        agent: Pubkey,
        attestor: Pubkey,
    ) -> Result<()> {
        require!(cap_per_worker > 0, RewardsError::ZeroAmount);
        require!(
            expires_at > Clock::get()?.unix_timestamp,
            RewardsError::InvalidExpiry
        );

        let budget = &mut ctx.accounts.budget;
        budget.company = ctx.accounts.company.key();
        budget.mint = ctx.accounts.mint.key();
        budget.agent = agent;
        budget.attestor = attestor;
        budget.shift_id = shift_id;
        budget.cap_per_worker = cap_per_worker;
        budget.expires_at = expires_at;
        budget.locked = 0;
        budget.released = 0;
        budget.bump = ctx.bumps.budget;
        budget.vault_bump = ctx.bumps.vault;

        emit!(BudgetCreated {
            budget: budget.key(),
            company: budget.company,
            shift_id,
            cap_per_worker,
            expires_at,
        });
        Ok(())
    }

    /// Firma zasila sejf ze swojego konta tokenów.
    pub fn fund(ctx: Context<Fund>, amount: u64) -> Result<()> {
        require!(amount > 0, RewardsError::ZeroAmount);

        let cpi = CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.company_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.company.to_account_info(),
            },
        );
        token_interface::transfer_checked(cpi, amount, ctx.accounts.mint.decimals)?;

        emit!(BudgetFunded {
            budget: ctx.accounts.budget.key(),
            amount,
        });
        Ok(())
    }

    /// Pracownik przyjmuje ofertę. Podpisuje on i agent Omniry, więc nikt
    /// nie zablokuje środków bez oferty ani nie przyjmie oferty za kogoś.
    /// Jedna osoba ma najwyżej jedno bounty na budżet (PDA z kluczem
    /// pracownika).
    pub fn accept_bounty(ctx: Context<AcceptBounty>, amount: u64) -> Result<()> {
        let budget = &mut ctx.accounts.budget;
        let now = Clock::get()?.unix_timestamp;

        require!(amount > 0, RewardsError::ZeroAmount);
        require!(now < budget.expires_at, RewardsError::BudgetExpired);
        require!(amount <= budget.cap_per_worker, RewardsError::AmountExceedsCap);

        let available = ctx
            .accounts
            .vault
            .amount
            .checked_sub(budget.locked)
            .ok_or(RewardsError::MathOverflow)?;
        require!(amount <= available, RewardsError::InsufficientBudget);

        budget.locked = budget
            .locked
            .checked_add(amount)
            .ok_or(RewardsError::MathOverflow)?;

        let bounty = &mut ctx.accounts.bounty;
        bounty.budget = budget.key();
        bounty.worker = ctx.accounts.worker.key();
        bounty.amount = amount;
        bounty.state = BountyState::Accepted;
        bounty.accepted_at = now;
        bounty.settled_at = 0;
        bounty.bump = ctx.bumps.bounty;

        emit!(BountyAccepted {
            budget: bounty.budget,
            worker: bounty.worker,
            amount,
        });
        Ok(())
    }

    /// Poświadczyciel potwierdza odbytą zmianę: USDC idzie z sejfu na konto
    /// pracownika (zakładane w razie potrzeby na koszt płacącego opłaty).
    pub fn release(ctx: Context<Release>) -> Result<()> {
        let amount = ctx.accounts.bounty.amount;
        let budget = &ctx.accounts.budget;
        let company = budget.company;
        let shift_id = budget.shift_id.to_le_bytes();
        let seeds: &[&[&[u8]]] = &[&[BUDGET_SEED, company.as_ref(), &shift_id, &[budget.bump]]];

        let cpi = CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.worker_token.to_account_info(),
                authority: ctx.accounts.budget.to_account_info(),
            },
        )
        .with_signer(seeds);
        token_interface::transfer_checked(cpi, amount, ctx.accounts.mint.decimals)?;

        let budget = &mut ctx.accounts.budget;
        budget.locked = budget
            .locked
            .checked_sub(amount)
            .ok_or(RewardsError::MathOverflow)?;
        budget.released = budget
            .released
            .checked_add(amount)
            .ok_or(RewardsError::MathOverflow)?;

        let bounty = &mut ctx.accounts.bounty;
        bounty.state = BountyState::Released;
        bounty.settled_at = Clock::get()?.unix_timestamp;

        emit!(BountyReleased {
            budget: bounty.budget,
            worker: bounty.worker,
            amount,
        });
        Ok(())
    }

    /// Zmiana się nie odbyła: blokada wraca do puli firmy. Poświadczyciel
    /// może to zrobić zawsze, każdy inny dopiero po terminie i karencji - żeby
    /// środki nie utknęły, gdy Omnira przestanie działać, ale też żeby nikt
    /// nie wyprzedził spóźnionej wypłaty za odbytą zmianę.
    pub fn refund_bounty(ctx: Context<RefundBounty>) -> Result<()> {
        let budget = &mut ctx.accounts.budget;
        let now = Clock::get()?.unix_timestamp;

        if ctx.accounts.caller.key() != budget.attestor {
            let otwarte_od = budget
                .expires_at
                .checked_add(REFUND_GRACE_SECS)
                .ok_or(RewardsError::MathOverflow)?;
            require!(now >= otwarte_od, RewardsError::NotExpired);
        }

        let bounty = &mut ctx.accounts.bounty;
        budget.locked = budget
            .locked
            .checked_sub(bounty.amount)
            .ok_or(RewardsError::MathOverflow)?;
        bounty.state = BountyState::Refunded;
        bounty.settled_at = now;

        emit!(BountyRefunded {
            budget: bounty.budget,
            worker: bounty.worker,
            amount: bounty.amount,
        });
        Ok(())
    }

    /// Firma wypłaca z sejfu wyłącznie środki niezablokowane.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, RewardsError::ZeroAmount);

        let budget = &ctx.accounts.budget;
        let available = ctx
            .accounts
            .vault
            .amount
            .checked_sub(budget.locked)
            .ok_or(RewardsError::MathOverflow)?;
        require!(amount <= available, RewardsError::InsufficientBudget);

        let company = budget.company;
        let shift_id = budget.shift_id.to_le_bytes();
        let seeds: &[&[&[u8]]] = &[&[BUDGET_SEED, company.as_ref(), &shift_id, &[budget.bump]]];

        let cpi = CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.company_token.to_account_info(),
                authority: ctx.accounts.budget.to_account_info(),
            },
        )
        .with_signer(seeds);
        token_interface::transfer_checked(cpi, amount, ctx.accounts.mint.decimals)?;

        emit!(BudgetWithdrawn {
            budget: ctx.accounts.budget.key(),
            amount,
        });
        Ok(())
    }
}

// ---------------------------------------------------------------- konta

#[derive(Accounts)]
#[instruction(shift_id: u64)]
pub struct CreateBudget<'info> {
    #[account(mut)]
    pub company: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = company,
        space = 8 + Budget::INIT_SPACE,
        seeds = [BUDGET_SEED, company.key().as_ref(), &shift_id.to_le_bytes()],
        bump,
    )]
    pub budget: Account<'info, Budget>,
    #[account(
        init,
        payer = company,
        token::mint = mint,
        token::authority = budget,
        token::token_program = token_program,
        seeds = [VAULT_SEED, budget.key().as_ref()],
        bump,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Fund<'info> {
    pub company: Signer<'info>,
    #[account(has_one = company, has_one = mint)]
    pub budget: Account<'info, Budget>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = company,
        token::token_program = token_program,
    )]
    pub company_token: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, seeds = [VAULT_SEED, budget.key().as_ref()], bump = budget.vault_bump)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct AcceptBounty<'info> {
    /// Płaci opłaty i czynsz konta bounty (w praktyce Omnira, nie pracownik).
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(address = budget.agent @ RewardsError::WrongAgent)]
    pub agent: Signer<'info>,
    pub worker: Signer<'info>,
    #[account(mut)]
    pub budget: Account<'info, Budget>,
    #[account(seeds = [VAULT_SEED, budget.key().as_ref()], bump = budget.vault_bump)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = payer,
        space = 8 + Bounty::INIT_SPACE,
        seeds = [BOUNTY_SEED, budget.key().as_ref(), worker.key().as_ref()],
        bump,
    )]
    pub bounty: Account<'info, Bounty>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(address = budget.attestor @ RewardsError::WrongAttestor)]
    pub attestor: Signer<'info>,
    #[account(mut, has_one = mint)]
    pub budget: Account<'info, Budget>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, budget.key().as_ref()], bump = budget.vault_bump)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        has_one = budget,
        has_one = worker,
        seeds = [BOUNTY_SEED, budget.key().as_ref(), worker.key().as_ref()],
        bump = bounty.bump,
        constraint = bounty.state == BountyState::Accepted @ RewardsError::InvalidState,
    )]
    pub bounty: Account<'info, Bounty>,
    pub worker: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = worker,
        associated_token::token_program = token_program,
    )]
    pub worker_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundBounty<'info> {
    pub caller: Signer<'info>,
    #[account(mut)]
    pub budget: Account<'info, Budget>,
    #[account(
        mut,
        has_one = budget,
        seeds = [BOUNTY_SEED, budget.key().as_ref(), bounty.worker.as_ref()],
        bump = bounty.bump,
        constraint = bounty.state == BountyState::Accepted @ RewardsError::InvalidState,
    )]
    pub bounty: Account<'info, Bounty>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub company: Signer<'info>,
    #[account(has_one = company, has_one = mint)]
    pub budget: Account<'info, Budget>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, budget.key().as_ref()], bump = budget.vault_bump)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = company,
        token::token_program = token_program,
    )]
    pub company_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

// ---------------------------------------------------------------- stan

#[account]
#[derive(InitSpace)]
pub struct Budget {
    pub company: Pubkey,
    pub mint: Pubkey,
    /// Klucz agenta Omniry - współpodpisuje akceptację bounty.
    pub agent: Pubkey,
    /// Klucz poświadczyciela Omniry - zwalnia albo zwraca bounty.
    pub attestor: Pubkey,
    pub shift_id: u64,
    pub cap_per_worker: u64,
    pub expires_at: i64,
    /// Suma bounty przyjętych, a jeszcze nierozliczonych.
    pub locked: u64,
    /// Suma wypłacona pracownikom.
    pub released: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Bounty {
    pub budget: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
    pub state: BountyState,
    pub accepted_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum BountyState {
    Accepted,
    Released,
    Refunded,
}

// ---------------------------------------------------------------- zdarzenia

#[event]
pub struct BudgetCreated {
    pub budget: Pubkey,
    pub company: Pubkey,
    pub shift_id: u64,
    pub cap_per_worker: u64,
    pub expires_at: i64,
}

#[event]
pub struct BudgetFunded {
    pub budget: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BountyAccepted {
    pub budget: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BountyReleased {
    pub budget: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BountyRefunded {
    pub budget: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BudgetWithdrawn {
    pub budget: Pubkey,
    pub amount: u64,
}

// ---------------------------------------------------------------- błędy

#[error_code]
pub enum RewardsError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Expiry must be in the future")]
    InvalidExpiry,
    #[msg("Budget has expired")]
    BudgetExpired,
    #[msg("Amount exceeds the per-worker cap")]
    AmountExceedsCap,
    #[msg("Not enough unlocked funds in the budget")]
    InsufficientBudget,
    #[msg("Signer is not the budget's agent")]
    WrongAgent,
    #[msg("Signer is not the budget's attestor")]
    WrongAttestor,
    #[msg("Bounty is not in the accepted state")]
    InvalidState,
    #[msg("Only the attestor can refund before expiry plus the grace period")]
    NotExpired,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
