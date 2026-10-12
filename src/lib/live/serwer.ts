/* Tryb Live: prawdziwe transakcje programu escrow na Solana devnet dla
 * bohaterki pokazu (Oksana). Tylko serwer - importuje go wyłącznie
 * trasa /api/live. Pozostali kandydaci zostają symulacją.
 *
 * Klucze (firma płaci opłaty i jest właścicielem budżetu, agent
 * współpodpisuje blokadę, poświadczyciel zwalnia wypłatę) leżą w katalogu
 * LIVE_KEYS_DIR jako company.json / agent.json / attestor.json (format
 * Solana CLI) plus mint.txt z adresem testowego tUSDC. Alternatywnie
 * zmienne LIVE_COMPANY_KEY / LIVE_AGENT_KEY / LIVE_ATTESTOR_KEY (tablica
 * JSON) i LIVE_MINT. Portfel, który ma władzę nad programem, tu nie trafia.
 *
 * Instrukcje kodujemy ręcznie (dyskryminator Anchora = 8 bajtów
 * sha256("global:<nazwa>") + argumenty borsh), bo IDL dojdzie dopiero z
 * Anchorem 1.2.x. Kolejność kont 1:1 z onchain/programs/omnira-rewards. */

import { createHash, randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(process.env.LIVE_PROGRAM_ID ?? "GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

// BigInt(...) zamiast literałów 1n: tsconfig strony celuje w ES2017.
const USDC = BigInt(1_000_000);
const BUDZET = BigInt(500) * USDC; // FIRMA.budzet
const LIMIT_NA_OSOBE = BigInt(50) * USDC; // FIRMA.limitNaOsobe, suwak bonusu ma max 50
const WAZNOSC_S = 2 * 3600;
const MIN_SOL = 0.05 * LAMPORTS_PER_SOL;
const DOLADUJ_TUSDC = BigInt(100_000) * USDC;

const LIMIT_IP_NA_GODZINE = 8;
const LIMIT_RAZEM_NA_GODZINE = 60;
const ZYCIE_PRZEBIEGU_MS = 3 * 3600 * 1000;

export class BladLive extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Konfiguracja = { company: Keypair; agent: Keypair; attestor: Keypair; mint: PublicKey };

function wczytajKlucz(zmienna: string, plik: string): Keypair | null {
  const dir = process.env.LIVE_KEYS_DIR;
  const tekst = process.env[zmienna] ?? (dir ? sprobujCzytac(join(dir, plik)) : null);
  return tekst ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(tekst))) : null;
}

function sprobujCzytac(sciezka: string): string | null {
  try {
    return readFileSync(sciezka, "utf8").trim();
  } catch {
    return null;
  }
}

let konfiguracja: Konfiguracja | null | undefined;
function konfig(): Konfiguracja | null {
  if (konfiguracja !== undefined) return konfiguracja;
  const company = wczytajKlucz("LIVE_COMPANY_KEY", "company.json");
  const agent = wczytajKlucz("LIVE_AGENT_KEY", "agent.json");
  const attestor = wczytajKlucz("LIVE_ATTESTOR_KEY", "attestor.json");
  const dir = process.env.LIVE_KEYS_DIR;
  const mint = process.env.LIVE_MINT ?? (dir ? sprobujCzytac(join(dir, "mint.txt")) : null);
  konfiguracja = company && agent && attestor && mint ? { company, agent, attestor, mint: new PublicKey(mint) } : null;
  return konfiguracja;
}

export function liveDostepny(): boolean {
  return konfig() !== null;
}

const polaczenie = () => new Connection(RPC, "confirmed");

// ---------------------------------------------------------------- kodowanie

const dyskryminator = (nazwa: string) => createHash("sha256").update(`global:${nazwa}`).digest().subarray(0, 8);

function u64(n: bigint) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n);
  return b;
}

function i64(n: bigint) {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(n);
  return b;
}

const pda = (seeds: Buffer[]) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const adresBudzetu = (company: PublicKey, shiftId: bigint) => pda([Buffer.from("budget"), company.toBuffer(), u64(shiftId)]);
const adresSejfu = (budzet: PublicKey) => pda([Buffer.from("vault"), budzet.toBuffer()]);
const adresBounty = (budzet: PublicKey, worker: PublicKey) => pda([Buffer.from("bounty"), budzet.toBuffer(), worker.toBuffer()]);
const ata = (owner: PublicKey, mint: PublicKey) =>
  PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.toBuffer()], ATA_PROGRAM)[0];

type Konto = { pubkey: PublicKey; isSigner?: boolean; isWritable?: boolean };
const konta = (k: Konto[]) => k.map(({ pubkey, isSigner = false, isWritable = false }) => ({ pubkey, isSigner, isWritable }));

const ix = (keys: Konto[], data: Buffer, programId = PROGRAM_ID) => new TransactionInstruction({ programId, keys: konta(keys), data });

// ---------------------------------------------------------------- przebiegi

/* Klucz pracownika żyje w pamięci serwera przez czas przebiegu - w
 * produkcji to portfel embedded na telefonie. Jeden kontener, więc mapa
 * w pamięci wystarcza; restart = przebieg przepada, UI wraca do symulacji. */
type Przebieg = { shiftId: bigint; worker: Keypair; utworzono: number };
type Pamiec = { przebiegi: Map<string, Przebieg>; ip: Map<string, number[]>; razem: number[] };
const g = globalThis as unknown as { __omniraLive?: Pamiec };
const pamiec: Pamiec = (g.__omniraLive ??= { przebiegi: new Map(), ip: new Map(), razem: [] });

function sprzataj(teraz: number) {
  for (const [id, p] of pamiec.przebiegi) if (teraz - p.utworzono > ZYCIE_PRZEBIEGU_MS) pamiec.przebiegi.delete(id);
  const godzinaTemu = teraz - 3600_000;
  pamiec.razem = pamiec.razem.filter((t) => t > godzinaTemu);
  for (const [ip, t] of pamiec.ip) {
    const swieze = t.filter((x) => x > godzinaTemu);
    if (swieze.length) pamiec.ip.set(ip, swieze);
    else pamiec.ip.delete(ip);
  }
}

function przebieg(run: unknown): Przebieg {
  const p = typeof run === "string" ? pamiec.przebiegi.get(run) : undefined;
  if (!p) throw new BladLive("Unknown or expired run", 404);
  return p;
}

async function wyslij(ixs: TransactionInstruction[], podpisujacy: Keypair[]) {
  return sendAndConfirmTransaction(polaczenie(), new Transaction().add(...ixs), podpisujacy, { commitment: "confirmed" });
}

/* Krok 1: firma otwiera budżet na zmianę i zasila sejf (jedna transakcja). */
export async function otworzBudzet(ip: string) {
  const k = konfig();
  if (!k) throw new BladLive("Live mode is not configured", 503);

  const teraz = Date.now();
  sprzataj(teraz);
  const zIp = pamiec.ip.get(ip) ?? [];
  if (zIp.length >= LIMIT_IP_NA_GODZINE || pamiec.razem.length >= LIMIT_RAZEM_NA_GODZINE) {
    throw new BladLive("Live runs limit reached, try again later", 429);
  }

  const conn = polaczenie();
  if ((await conn.getBalance(k.company.publicKey)) < MIN_SOL) throw new BladLive("Demo wallet is out of devnet SOL", 503);

  const shiftId = BigInt(teraz) * BigInt(1000) + BigInt(randomInt(1000));
  const budzet = adresBudzetu(k.company.publicKey, shiftId);
  const sejf = adresSejfu(budzet);
  const kontoFirmy = ata(k.company.publicKey, k.mint);

  const ixs: TransactionInstruction[] = [];
  const saldo = await conn
    .getTokenAccountBalance(kontoFirmy)
    .then((r) => BigInt(r.value.amount))
    .catch(() => BigInt(0));
  if (saldo < BUDZET) {
    // Testowy tUSDC: firma jest jego emitentem, więc dolewa sobie sama.
    ixs.push(
      ix(
        [
          { pubkey: k.company.publicKey, isSigner: true, isWritable: true },
          { pubkey: kontoFirmy, isWritable: true },
          { pubkey: k.company.publicKey },
          { pubkey: k.mint },
          { pubkey: SystemProgram.programId },
          { pubkey: TOKEN_PROGRAM },
        ],
        Buffer.from([1]), // CreateIdempotent
        ATA_PROGRAM,
      ),
      ix(
        [
          { pubkey: k.mint, isWritable: true },
          { pubkey: kontoFirmy, isWritable: true },
          { pubkey: k.company.publicKey, isSigner: true },
        ],
        Buffer.concat([Buffer.from([7]), u64(DOLADUJ_TUSDC)]), // MintTo
        TOKEN_PROGRAM,
      ),
    );
  }

  const wygasa = BigInt(Math.floor(teraz / 1000) + WAZNOSC_S);
  ixs.push(
    ix(
      [
        { pubkey: k.company.publicKey, isSigner: true, isWritable: true },
        { pubkey: k.mint },
        { pubkey: budzet, isWritable: true },
        { pubkey: sejf, isWritable: true },
        { pubkey: TOKEN_PROGRAM },
        { pubkey: SystemProgram.programId },
      ],
      Buffer.concat([dyskryminator("create_budget"), u64(shiftId), u64(LIMIT_NA_OSOBE), i64(wygasa), k.agent.publicKey.toBuffer(), k.attestor.publicKey.toBuffer()]),
    ),
    ix(
      [
        { pubkey: k.company.publicKey, isSigner: true },
        { pubkey: budzet },
        { pubkey: k.mint },
        { pubkey: kontoFirmy, isWritable: true },
        { pubkey: sejf, isWritable: true },
        { pubkey: TOKEN_PROGRAM },
      ],
      Buffer.concat([dyskryminator("fund"), u64(BUDZET)]),
    ),
  );

  const sig = await wyslij(ixs, [k.company]);

  pamiec.ip.set(ip, [...zIp, teraz]);
  pamiec.razem.push(teraz);
  const run = shiftId.toString();
  pamiec.przebiegi.set(run, { shiftId, worker: Keypair.generate(), utworzono: teraz });
  return { run, sig, budzet: budzet.toBase58() };
}

/* Krok 2: pracownik przyjmuje bounty, agent współpodpisuje - blokada. */
export async function przyjmijBounty(run: unknown, kwota: unknown) {
  const k = konfig();
  if (!k) throw new BladLive("Live mode is not configured", 503);
  const p = przebieg(run);
  if (typeof kwota !== "number" || !Number.isInteger(kwota) || kwota < 1 || BigInt(kwota) * USDC > LIMIT_NA_OSOBE) {
    throw new BladLive("Invalid amount", 400);
  }

  const budzet = adresBudzetu(k.company.publicKey, p.shiftId);
  const sig = await wyslij(
    [
      ix(
        [
          { pubkey: k.company.publicKey, isSigner: true, isWritable: true },
          { pubkey: k.agent.publicKey, isSigner: true },
          { pubkey: p.worker.publicKey, isSigner: true },
          { pubkey: budzet, isWritable: true },
          { pubkey: adresSejfu(budzet) },
          { pubkey: adresBounty(budzet, p.worker.publicKey), isWritable: true },
          { pubkey: SystemProgram.programId },
        ],
        Buffer.concat([dyskryminator("accept_bounty"), u64(BigInt(kwota) * USDC)]),
      ),
    ],
    [k.company, k.agent, p.worker],
  );
  return { sig, worker: p.worker.publicKey.toBase58() };
}

/* Krok 3: poświadczyciel potwierdza zmianę - sejf wypłaca pracownikowi. */
export async function wyplac(run: unknown) {
  const k = konfig();
  if (!k) throw new BladLive("Live mode is not configured", 503);
  const p = przebieg(run);

  const budzet = adresBudzetu(k.company.publicKey, p.shiftId);
  const sig = await wyslij(
    [
      ix(
        [
          { pubkey: k.company.publicKey, isSigner: true, isWritable: true },
          { pubkey: k.attestor.publicKey, isSigner: true },
          { pubkey: budzet, isWritable: true },
          { pubkey: k.mint },
          { pubkey: adresSejfu(budzet), isWritable: true },
          { pubkey: adresBounty(budzet, p.worker.publicKey), isWritable: true },
          { pubkey: p.worker.publicKey },
          { pubkey: ata(p.worker.publicKey, k.mint), isWritable: true },
          { pubkey: TOKEN_PROGRAM },
          { pubkey: ATA_PROGRAM },
          { pubkey: SystemProgram.programId },
        ],
        dyskryminator("release"),
      ),
    ],
    [k.company, k.attestor],
  );
  pamiec.przebiegi.delete(String(run));
  return { sig };
}
