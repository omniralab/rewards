// Jednorazowe przygotowanie trybu Live /app: testowy token tUSDC (6 miejsc
// jak USDC), którego emitentem jest klucz firmy z LIVE_KEYS_DIR. Adres trafia
// do <LIVE_KEYS_DIR>/mint.txt. Klucze zakłada `solana-keygen` (AGENTS.md).
//
//   LIVE_KEYS_DIR=~/.config/solana/omnira-live node scripts/live-setup.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Connection, Keypair, SystemProgram, Transaction, TransactionInstruction, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

const dir = (process.env.LIVE_KEYS_DIR ?? "").replace(/^~/, process.env.HOME);
if (!dir) throw new Error("Ustaw LIVE_KEYS_DIR");
const plikMinta = join(dir, "mint.txt");
if (existsSync(plikMinta)) {
  console.log(`tUSDC już jest: ${readFileSync(plikMinta, "utf8").trim()}`);
  process.exit(0);
}

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const company = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(join(dir, "company.json"), "utf8"))));
const conn = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
const mint = Keypair.generate();
const MINT_LEN = 82;

const tx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: company.publicKey,
    newAccountPubkey: mint.publicKey,
    lamports: await conn.getMinimumBalanceForRentExemption(MINT_LEN),
    space: MINT_LEN,
    programId: TOKEN_PROGRAM,
  }),
  // InitializeMint2: tag 20, decimals, mint authority, brak freeze authority.
  new TransactionInstruction({
    programId: TOKEN_PROGRAM,
    keys: [{ pubkey: mint.publicKey, isSigner: false, isWritable: true }],
    data: Buffer.concat([Buffer.from([20, 6]), company.publicKey.toBuffer(), Buffer.from([0])]),
  }),
);
const sig = await sendAndConfirmTransaction(conn, tx, [company, mint]);
writeFileSync(plikMinta, mint.publicKey.toBase58() + "\n");
console.log(`tUSDC: ${mint.publicKey.toBase58()}`);
console.log(`https://explorer.solana.com/tx/${sig}?cluster=devnet`);
