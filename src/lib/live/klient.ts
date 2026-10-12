/* Tryb Live po stronie przeglądarki: wywołania /api/live i linki do
 * eksploratora. Kolejkowanie i unieważnianie po resecie żyje w store
 * (symulacja.ts), bo tam jest licznik pokoleń timerów. */

export const PROGRAM_LIVE = "GPdXwqT253UXiN1j4k115NXrvLf2V7FP4TiaiE8kKeYc";

export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAdres = (adres: string) => `https://explorer.solana.com/address/${adres}?cluster=devnet`;

export type KrokLive =
  | { krok: "budzet" }
  | { krok: "przyjecie"; run: string; kwota: number }
  | { krok: "wyplata"; run: string };

export async function wywolajLive<T = { sig: string }>(body: KrokLive): Promise<T> {
  const r = await fetch("/api/live", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.blad ?? "Devnet transaction failed");
  return j as T;
}

export async function liveNaSerwerze(): Promise<boolean> {
  try {
    const r = await fetch("/api/live");
    return r.ok && (await r.json()).dostepny === true;
  } catch {
    return false;
  }
}
