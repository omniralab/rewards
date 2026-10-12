//! Złota ścieżka z filmu na prawdziwym devnecie: testowy token tUSDC (6 miejsc
//! jak USDC), budżet firmy na zmianę, bounty 20 tUSDC przyjęte przez pracownika
//! z podpisem agenta, zwolnione przez poświadczyciela. Na końcu linki do
//! Solana Explorer.
//!
//!   cd onchain/programs/omnira-rewards && cargo run --example devnet
//!
//! Opłaty płaci portfel z ~/.config/solana/omnira-devnet.json (w roli firmy i
//! Omniry). Agent, poświadczyciel i pracownik to świeże klucze - nie potrzebują
//! SOL, bo tylko podpisują. Program musi być wdrożony (../../deploy-devnet.sh).

use anchor_lang::{
    prelude::Pubkey,
    solana_program::{instruction::Instruction, system_instruction, system_program},
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use omnira_rewards::{accounts, instruction, Budget, BOUNTY_SEED, BUDGET_SEED, VAULT_SEED};
use solana_commitment_config::CommitmentConfig;
use solana_keypair::Keypair;
use solana_rpc_client::rpc_client::RpcClient;
use solana_signer::Signer;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::{
    address::get_associated_token_address, instruction::create_associated_token_account_idempotent,
};

const RPC: &str = "https://api.devnet.solana.com";
const USDC: u64 = 1_000_000;
const MINT_LEN: usize = 82;

fn main() {
    let rpc = RpcClient::new_with_commitment(RPC.to_string(), CommitmentConfig::confirmed());
    let payer = wczytaj_klucz("~/.config/solana/omnira-devnet.json");
    let agent = Keypair::new();
    let attestor = Keypair::new();
    let worker = Keypair::new();
    let mint = Keypair::new();
    let token_program = spl_token_interface::ID;
    let program_id = omnira_rewards::id();

    println!("Program:      {program_id}");
    println!("Firma/opłaty: {}", payer.pubkey());
    println!("Pracownik:    {}\n", worker.pubkey());

    // 1. Testowy tUSDC i 500 tUSDC na koncie firmy.
    let rent = rpc.get_minimum_balance_for_rent_exemption(MINT_LEN).unwrap();
    let company_token = get_associated_token_address(&payer.pubkey(), &mint.pubkey());
    let ixs = vec![
        system_instruction::create_account(
            &payer.pubkey(),
            &mint.pubkey(),
            rent,
            MINT_LEN as u64,
            &token_program,
        ),
        spl_token_interface::instruction::initialize_mint2(
            &token_program,
            &mint.pubkey(),
            &payer.pubkey(),
            None,
            6,
        )
        .unwrap(),
        create_associated_token_account_idempotent(
            &payer.pubkey(),
            &payer.pubkey(),
            &mint.pubkey(),
            &token_program,
        ),
        spl_token_interface::instruction::mint_to(
            &token_program,
            &mint.pubkey(),
            &company_token,
            &payer.pubkey(),
            &[],
            500 * USDC,
        )
        .unwrap(),
    ];
    wyslij(&rpc, "tUSDC i 500 na koncie firmy", ixs, &payer, &[&mint]);

    // 2. Budżet na zmianę: limit 50 na osobę, ważny godzinę.
    let shift_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let budget = Pubkey::find_program_address(
        &[BUDGET_SEED, payer.pubkey().as_ref(), &shift_id.to_le_bytes()],
        &program_id,
    )
    .0;
    let vault = Pubkey::find_program_address(&[VAULT_SEED, budget.as_ref()], &program_id).0;
    let expires_at = shift_id as i64 + 3_600;

    let ix = Instruction::new_with_bytes(
        program_id,
        &instruction::CreateBudget {
            shift_id,
            cap_per_worker: 50 * USDC,
            expires_at,
            agent: agent.pubkey(),
            attestor: attestor.pubkey(),
        }
        .data(),
        accounts::CreateBudget {
            company: payer.pubkey(),
            mint: mint.pubkey(),
            budget,
            vault,
            token_program,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    wyslij(&rpc, "budżet na zmianę", vec![ix], &payer, &[]);

    // 3. Firma zasila sejf.
    let ix = Instruction::new_with_bytes(
        program_id,
        &instruction::Fund { amount: 500 * USDC }.data(),
        accounts::Fund {
            company: payer.pubkey(),
            budget,
            mint: mint.pubkey(),
            company_token,
            vault,
            token_program,
        }
        .to_account_metas(None),
    );
    wyslij(&rpc, "500 tUSDC do sejfu", vec![ix], &payer, &[]);

    // 4. Pracownik przyjmuje Emergency Bounty, agent współpodpisuje.
    let bounty = Pubkey::find_program_address(
        &[BOUNTY_SEED, budget.as_ref(), worker.pubkey().as_ref()],
        &program_id,
    )
    .0;
    let ix = Instruction::new_with_bytes(
        program_id,
        &instruction::AcceptBounty { amount: 20 * USDC }.data(),
        accounts::AcceptBounty {
            payer: payer.pubkey(),
            agent: agent.pubkey(),
            worker: worker.pubkey(),
            budget,
            vault,
            bounty,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    wyslij(&rpc, "bounty 20 tUSDC przyjęte (blokada)", vec![ix], &payer, &[&agent, &worker]);

    // 5. Check-out potwierdzony: poświadczyciel zwalnia środki.
    let worker_token = get_associated_token_address(&worker.pubkey(), &mint.pubkey());
    let ix = Instruction::new_with_bytes(
        program_id,
        &instruction::Release {}.data(),
        accounts::Release {
            payer: payer.pubkey(),
            attestor: attestor.pubkey(),
            budget,
            mint: mint.pubkey(),
            vault,
            bounty,
            worker: worker.pubkey(),
            worker_token,
            token_program,
            associated_token_program: spl_associated_token_account_interface::program::ID,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    wyslij(&rpc, "zmiana potwierdzona, wypłata", vec![ix], &payer, &[&attestor]);

    // Stan końcowy prosto z łańcucha.
    let saldo = rpc.get_token_account_balance(&worker_token).unwrap();
    let dane = rpc.get_account_data(&budget).unwrap();
    let b = Budget::try_deserialize(&mut dane.as_slice()).unwrap();
    println!("\nPortfel pracownika: {} tUSDC", saldo.ui_amount_string);
    println!(
        "Budżet: zablokowane {} / wypłacone {} tUSDC",
        b.locked / USDC,
        b.released / USDC
    );
    println!("Konto budżetu: https://explorer.solana.com/address/{budget}?cluster=devnet");
}

fn wyslij(rpc: &RpcClient, opis: &str, ixs: Vec<Instruction>, payer: &Keypair, inni: &[&Keypair]) {
    let mut signers: Vec<&Keypair> = vec![payer];
    signers.extend_from_slice(inni);
    let blockhash = rpc.get_latest_blockhash().unwrap();
    let tx = Transaction::new_signed_with_payer(&ixs, Some(&payer.pubkey()), &signers, blockhash);
    match rpc.send_and_confirm_transaction(&tx) {
        Ok(sig) => println!("✓ {opis}\n  https://explorer.solana.com/tx/{sig}?cluster=devnet"),
        Err(e) => panic!("✗ {opis}: {e}"),
    }
}

/// Plik klucza Solana CLI to tablica JSON 64 bajtów.
fn wczytaj_klucz(sciezka: &str) -> Keypair {
    let sciezka = sciezka.replacen('~', &std::env::var("HOME").unwrap(), 1);
    let tekst = std::fs::read_to_string(&sciezka).expect("brak pliku klucza");
    let bajty: Vec<u8> = tekst
        .trim()
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split(',')
        .map(|b| b.trim().parse().unwrap())
        .collect();
    Keypair::try_from(bajty.as_slice()).expect("zły plik klucza")
}
