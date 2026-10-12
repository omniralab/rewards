import { NextResponse } from "next/server";
import { BladLive, liveDostepny, otworzBudzet, przyjmijBounty, wyplac } from "@/lib/live/serwer";

/* Tryb Live /app: GET mówi, czy serwer ma klucze devnet, POST robi jeden
 * krok złotej ścieżki na łańcuchu. Opis i limity: src/lib/live/serwer.ts. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ dostepny: liveDostepny() });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  try {
    const body = (await req.json().catch(() => ({}))) as { krok?: string; run?: unknown; kwota?: unknown };
    if (body.krok === "budzet") return NextResponse.json(await otworzBudzet(ip));
    if (body.krok === "przyjecie") return NextResponse.json(await przyjmijBounty(body.run, body.kwota));
    if (body.krok === "wyplata") return NextResponse.json(await wyplac(body.run));
    return NextResponse.json({ blad: "Unknown step" }, { status: 400 });
  } catch (e) {
    if (e instanceof BladLive) return NextResponse.json({ blad: e.message }, { status: e.status });
    console.error("[live]", e);
    return NextResponse.json({ blad: "Devnet transaction failed" }, { status: 502 });
  }
}
