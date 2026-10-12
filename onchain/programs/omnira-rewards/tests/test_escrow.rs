//! Testy escrow na LiteSVM: złota ścieżka z filmu (bounty 20 USDC za
//! zmianę) i każdy sposób, w jaki ktoś mógłby wyciągnąć pieniądze, których
//! nie powinien. Błędy sprawdzamy po nazwie w logach programu, żeby test nie
//! przechodził, gdy transakcja padnie z innego powodu.

use anchor_lang::{
    prelude::{Clock, Pubkey},
    solana_program::{instruction::Instruction, system_program},
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use litesvm::LiteSVM;
use litesvm_token::{CreateAssociatedTokenAccount, CreateMint, MintTo};
use omnira_rewards::{
    accounts, instruction, Bounty, BountyState, Budget, BOUNTY_SEED, BUDGET_SEED, VAULT_SEED,
};
use solana_keypair::Keypair;
use solana_message::{Message, VersionedMessage};
use solana_signer::Signer;
use solana_transaction::versioned::VersionedTransaction;

const USDC: u64 = 1_000_000;
const SHIFT_ID: u64 = 30_518;
const GODZINA: i64 = 3_600;
const TOKEN_PROGRAM: Pubkey = anchor_spl::token::ID;
const ATA_PROGRAM: Pubkey = anchor_spl::associated_token::ID;

struct Swiat {
    svm: LiteSVM,
    company: Keypair,
    agent: Keypair,
    attestor: Keypair,
    mint: Pubkey,
    company_token: Pubkey,
    budget: Pubkey,
    vault: Pubkey,
}

/// Firma z 1000 USDC, budżet na zmianę z limitem `cap` na osobę, ważny
/// godzinę, zasilony kwotą `fund`.
fn swiat(cap: u64, fund: u64) -> Swiat {
    let mut svm = LiteSVM::new();
    // Build testowy w SBPFv0 (./test.sh): LiteSVM 0.10 nie wczytuje v3.
    // Ten sam kod idzie na devnet w v3 (./build.sh).
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy-test/omnira_rewards.so"
    ));
    svm.add_program(omnira_rewards::id(), bytes).unwrap();

    let company = Keypair::new();
    let agent = Keypair::new();
    let attestor = Keypair::new();
    for k in [&company, &agent, &attestor] {
        svm.airdrop(&k.pubkey(), 10_000_000_000).unwrap();
    }

    let mint = CreateMint::new(&mut svm, &company).decimals(6).send().unwrap();
    let company_token = CreateAssociatedTokenAccount::new(&mut svm, &company, &mint)
        .send()
        .unwrap();
    MintTo::new(&mut svm, &company, &mint, &company_token, 1_000 * USDC)
        .send()
        .unwrap();

    let program_id = omnira_rewards::id();
    let budget = Pubkey::find_program_address(
        &[BUDGET_SEED, company.pubkey().as_ref(), &SHIFT_ID.to_le_bytes()],
        &program_id,
    )
    .0;
    let vault = Pubkey::find_program_address(&[VAULT_SEED, budget.as_ref()], &program_id).0;

    let mut w = Swiat {
        svm,
        company,
        agent,
        attestor,
        mint,
        company_token,
        budget,
        vault,
    };

    let expires_at = w.svm.get_sysvar::<Clock>().unix_timestamp + GODZINA;
    let ix = Instruction::new_with_bytes(
        program_id,
        &instruction::CreateBudget {
            shift_id: SHIFT_ID,
            cap_per_worker: cap,
            expires_at,
            agent: w.agent.pubkey(),
            attestor: w.attestor.pubkey(),
        }
        .data(),
        accounts::CreateBudget {
            company: w.company.pubkey(),
            mint: w.mint,
            budget: w.budget,
            vault: w.vault,
            token_program: TOKEN_PROGRAM,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    let company = w.company.insecure_clone();
    send(&mut w.svm, ix, &[&company]).unwrap();

    if fund > 0 {
        let ix = fund_ix(&w, fund);
        send(&mut w.svm, ix, &[&company]).unwrap();
    }
    w
}

/// Wysyła transakcję; pierwszy podpisujący płaci opłaty. Przy błędzie
/// zwraca logi programu, żeby test mógł sprawdzić nazwę błędu.
fn send(svm: &mut LiteSVM, ix: Instruction, signers: &[&Keypair]) -> Result<(), String> {
    svm.expire_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&signers[0].pubkey()), &svm.latest_blockhash());
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers)
        .map_err(|e| e.to_string())?;
    svm.send_transaction(tx)
        .map(|_| ())
        .map_err(|e| format!("{:?}\n{}", e.err, e.meta.logs.join("\n")))
}

fn assert_err(res: Result<(), String>, oczekiwany: &str) {
    match res {
        Ok(()) => panic!("transakcja przeszła, a miała paść z {oczekiwany}"),
        Err(log) => assert!(
            log.contains(oczekiwany),
            "oczekiwany błąd {oczekiwany}, a jest:\n{log}"
        ),
    }
}

fn ata(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[owner.as_ref(), TOKEN_PROGRAM.as_ref(), mint.as_ref()],
        &ATA_PROGRAM,
    )
    .0
}

fn bounty_pda(w: &Swiat, worker: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[BOUNTY_SEED, w.budget.as_ref(), worker.as_ref()],
        &omnira_rewards::id(),
    )
    .0
}

/// Saldo konta tokenów: pole `amount` leży w bajtach 64..72 (układ SPL Token).
fn saldo(svm: &LiteSVM, konto: &Pubkey) -> u64 {
    svm.get_account(konto)
        .map(|a| u64::from_le_bytes(a.data[64..72].try_into().unwrap()))
        .unwrap_or(0)
}

fn budzet(w: &Swiat) -> Budget {
    let acc = w.svm.get_account(&w.budget).unwrap();
    Budget::try_deserialize(&mut acc.data.as_slice()).unwrap()
}

fn bounty(w: &Swiat, worker: &Pubkey) -> Bounty {
    let acc = w.svm.get_account(&bounty_pda(w, worker)).unwrap();
    Bounty::try_deserialize(&mut acc.data.as_slice()).unwrap()
}

fn przewin_po_terminie(w: &mut Swiat) {
    let mut clock = w.svm.get_sysvar::<Clock>();
    clock.unix_timestamp += 2 * GODZINA;
    w.svm.set_sysvar::<Clock>(&clock);
}

// ---------------------------------------------------------------- instrukcje

fn fund_ix(w: &Swiat, amount: u64) -> Instruction {
    Instruction::new_with_bytes(
        omnira_rewards::id(),
        &instruction::Fund { amount }.data(),
        accounts::Fund {
            company: w.company.pubkey(),
            budget: w.budget,
            mint: w.mint,
            company_token: w.company_token,
            vault: w.vault,
            token_program: TOKEN_PROGRAM,
        }
        .to_account_metas(None),
    )
}

fn accept_ix(w: &Swiat, agent: &Pubkey, worker: &Pubkey, amount: u64) -> Instruction {
    Instruction::new_with_bytes(
        omnira_rewards::id(),
        &instruction::AcceptBounty { amount }.data(),
        accounts::AcceptBounty {
            payer: *agent,
            agent: *agent,
            worker: *worker,
            budget: w.budget,
            vault: w.vault,
            bounty: bounty_pda(w, worker),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}

fn release_ix(w: &Swiat, attestor: &Pubkey, worker: &Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        omnira_rewards::id(),
        &instruction::Release {}.data(),
        accounts::Release {
            payer: *attestor,
            attestor: *attestor,
            budget: w.budget,
            mint: w.mint,
            vault: w.vault,
            bounty: bounty_pda(w, worker),
            worker: *worker,
            worker_token: ata(worker, &w.mint),
            token_program: TOKEN_PROGRAM,
            associated_token_program: ATA_PROGRAM,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}

fn refund_ix(w: &Swiat, caller: &Pubkey, worker: &Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        omnira_rewards::id(),
        &instruction::RefundBounty {}.data(),
        accounts::RefundBounty {
            caller: *caller,
            budget: w.budget,
            bounty: bounty_pda(w, worker),
        }
        .to_account_metas(None),
    )
}

fn withdraw_ix(w: &Swiat, amount: u64) -> Instruction {
    Instruction::new_with_bytes(
        omnira_rewards::id(),
        &instruction::Withdraw { amount }.data(),
        accounts::Withdraw {
            company: w.company.pubkey(),
            budget: w.budget,
            mint: w.mint,
            vault: w.vault,
            company_token: w.company_token,
            token_program: TOKEN_PROGRAM,
        }
        .to_account_metas(None),
    )
}

fn przyjmij(w: &mut Swiat, worker: &Keypair, amount: u64) -> Result<(), String> {
    let ix = accept_ix(w, &w.agent.pubkey(), &worker.pubkey(), amount);
    let agent = w.agent.insecure_clone();
    send(&mut w.svm, ix, &[&agent, worker])
}

fn zwolnij(w: &mut Swiat, worker: &Pubkey) -> Result<(), String> {
    let ix = release_ix(w, &w.attestor.pubkey(), worker);
    let attestor = w.attestor.insecure_clone();
    send(&mut w.svm, ix, &[&attestor])
}

// ---------------------------------------------------------------- testy

#[test]
fn zlota_sciezka_bounty_20_usdc_po_zmianie() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let oksana = Keypair::new();

    przyjmij(&mut w, &oksana, 20 * USDC).unwrap();
    assert_eq!(budzet(&w).locked, 20 * USDC);
    assert_eq!(bounty(&w, &oksana.pubkey()).state, BountyState::Accepted);

    zwolnij(&mut w, &oksana.pubkey()).unwrap();
    assert_eq!(saldo(&w.svm, &ata(&oksana.pubkey(), &w.mint)), 20 * USDC);
    assert_eq!(saldo(&w.svm, &w.vault), 480 * USDC);
    let b = budzet(&w);
    assert_eq!((b.locked, b.released), (0, 20 * USDC));
    assert_eq!(bounty(&w, &oksana.pubkey()).state, BountyState::Released);
}

#[test]
fn osiem_osob_z_jednego_budzetu() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let ludzie: Vec<Keypair> = (0..8).map(|_| Keypair::new()).collect();
    for k in &ludzie {
        przyjmij(&mut w, k, 20 * USDC).unwrap();
    }
    assert_eq!(budzet(&w).locked, 160 * USDC);
    for k in &ludzie {
        zwolnij(&mut w, &k.pubkey()).unwrap();
    }
    assert_eq!(saldo(&w.svm, &w.vault), 340 * USDC);
    assert_eq!(budzet(&w).released, 160 * USDC);
}

#[test]
fn limit_na_osobe() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    assert_err(przyjmij(&mut w, &Keypair::new(), 51 * USDC), "AmountExceedsCap");
}

#[test]
fn nie_da_sie_zablokowac_wiecej_niz_jest_w_sejfie() {
    let mut w = swiat(50 * USDC, 30 * USDC);
    przyjmij(&mut w, &Keypair::new(), 20 * USDC).unwrap();
    assert_err(przyjmij(&mut w, &Keypair::new(), 20 * USDC), "InsufficientBudget");
}

#[test]
fn bez_podpisu_agenta_budzetu_nie_ma_blokady() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let obcy = Keypair::new();
    w.svm.airdrop(&obcy.pubkey(), 1_000_000_000).unwrap();
    let worker = Keypair::new();
    let ix = accept_ix(&w, &obcy.pubkey(), &worker.pubkey(), 20 * USDC);
    assert_err(send(&mut w.svm, ix, &[&obcy, &worker]), "WrongAgent");
}

#[test]
fn jedno_bounty_na_osobe_na_zmiane() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let oksana = Keypair::new();
    przyjmij(&mut w, &oksana, 20 * USDC).unwrap();
    assert_err(przyjmij(&mut w, &oksana, 20 * USDC), "already in use");
}

#[test]
fn tylko_poswiadczyciel_zwalnia_srodki() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let oksana = Keypair::new();
    przyjmij(&mut w, &oksana, 20 * USDC).unwrap();

    // Pracownik próbuje sam sobie wypłacić.
    w.svm.airdrop(&oksana.pubkey(), 1_000_000_000).unwrap();
    let ix = release_ix(&w, &oksana.pubkey(), &oksana.pubkey());
    assert_err(send(&mut w.svm, ix, &[&oksana]), "WrongAttestor");
    assert_eq!(saldo(&w.svm, &w.vault), 500 * USDC);
}

#[test]
fn nie_da_sie_wyplacic_dwa_razy() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let oksana = Keypair::new();
    przyjmij(&mut w, &oksana, 20 * USDC).unwrap();
    zwolnij(&mut w, &oksana.pubkey()).unwrap();
    assert_err(zwolnij(&mut w, &oksana.pubkey()), "InvalidState");
    assert_eq!(saldo(&w.svm, &ata(&oksana.pubkey(), &w.mint)), 20 * USDC);
}

#[test]
fn zwrot_przed_terminem_tylko_przez_poswiadczyciela() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let oksana = Keypair::new();
    przyjmij(&mut w, &oksana, 20 * USDC).unwrap();

    let obcy = Keypair::new();
    w.svm.airdrop(&obcy.pubkey(), 1_000_000_000).unwrap();
    let ix = refund_ix(&w, &obcy.pubkey(), &oksana.pubkey());
    assert_err(send(&mut w.svm, ix, &[&obcy]), "NotExpired");

    let ix = refund_ix(&w, &w.attestor.pubkey(), &oksana.pubkey());
    let attestor = w.attestor.insecure_clone();
    send(&mut w.svm, ix, &[&attestor]).unwrap();
    assert_eq!(budzet(&w).locked, 0);
    assert_eq!(bounty(&w, &oksana.pubkey()).state, BountyState::Refunded);

    // Po zwrocie wypłata jest już niemożliwa.
    assert_err(zwolnij(&mut w, &oksana.pubkey()), "InvalidState");
}

#[test]
fn po_terminie_kazdy_odblokowuje_srodki_i_nikt_nie_przyjmuje_ofert() {
    let mut w = swiat(50 * USDC, 500 * USDC);
    let oksana = Keypair::new();
    przyjmij(&mut w, &oksana, 20 * USDC).unwrap();

    przewin_po_terminie(&mut w);
    assert_err(przyjmij(&mut w, &Keypair::new(), 20 * USDC), "BudgetExpired");

    let obcy = Keypair::new();
    w.svm.airdrop(&obcy.pubkey(), 1_000_000_000).unwrap();
    let ix = refund_ix(&w, &obcy.pubkey(), &oksana.pubkey());
    send(&mut w.svm, ix, &[&obcy]).unwrap();
    assert_eq!(budzet(&w).locked, 0);
}

#[test]
fn firma_wyplaca_tylko_niezablokowane_srodki() {
    let mut w = swiat(50 * USDC, 100 * USDC);
    przyjmij(&mut w, &Keypair::new(), 20 * USDC).unwrap();
    let company = w.company.insecure_clone();

    let ix = withdraw_ix(&w, 90 * USDC);
    assert_err(send(&mut w.svm, ix, &[&company]), "InsufficientBudget");

    let ix = withdraw_ix(&w, 80 * USDC);
    send(&mut w.svm, ix, &[&company]).unwrap();
    assert_eq!(saldo(&w.svm, &w.vault), 20 * USDC);
    assert_eq!(saldo(&w.svm, &w.company_token), 980 * USDC);
}
