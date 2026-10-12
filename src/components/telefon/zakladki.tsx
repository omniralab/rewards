"use client";

import { ArrowDownLeft, Check, ChevronRight, Copy, Crown, Flame, Fuel, Gift, Lock, Rocket, Sparkles, TramFront, Zap } from "lucide-react";
import { useSymulacja } from "@/lib/symulacja";
import { FIRMA, KATALOG, POZIOMY, PRACOWNIK, SKLADOWE_WYNIKU, ZMIANA, liczba, poziom, skrot, usdc } from "@/lib/dane";
import { NaSolanie, Sygnet, UsdcZnak } from "../marka";
import { Karta, KwotaUsdc, Label, Naglowek, Om, Pasek, Pierscien } from "./wspolne";

/* ───────────────────────── Home ───────────────────────── */

export function EkranHome() {
  const s = useSymulacja();
  const lvl = poziom(s.om);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Mon, 5 Oct</Label>
          <div className="display mt-1 text-[26px] leading-tight">Hi, {PRACOWNIK.imie}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[var(--on-cta)]">
          <span className="text-[13px] font-bold">OM</span>
        </div>
      </div>

      {s.faza === "wystawiono" ? <KartaBounty /> : null}
      {s.faza === "przyjeto" || s.faza === "na-miejscu" || s.faza === "rozliczanie" ? <KartaNastepnej /> : null}

      {/* Karta lojalności na pasie negatywowym - jedyne miejsce w apce. */}
      <button onClick={() => s.pokaz("rewards")} data-invert className="rounded-[18px] p-5 text-left transition active:scale-[0.99]">
        <div className="flex items-center justify-between">
          <span className="label">Omnira Rewards</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f5a52422] px-2 py-0.5 text-[11px] font-semibold text-warning">
            <Crown className="h-3 w-3" /> {lvl.obecny.nazwa}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="num text-[44px] font-semibold leading-none">{liczba(s.om)}</span>
          <span className="text-[15px] font-semibold text-dim">OM</span>
        </div>
        <Pasek wartosc={lvl.postep} className="mt-4 bg-[#ffffff1a]" kolor="var(--warning)" />
        <div className="mt-2 flex justify-between text-[12px] text-dim">
          <span>{lvl.nastepny ? `${liczba(lvl.brakuje)} OM to ${lvl.nastepny.nazwa}` : "Top level"}</span>
          <span className="mono">{lvl.nastepny ? liczba(lvl.nastepny.od) : ""}</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <Karta className="!p-3.5">
          <Label>Reliability</Label>
          <div className="mt-2 flex items-center gap-3">
            <Pierscien wartosc={s.niezawodnosc} rozmiar={52} grubosc={5} />
            <div className="text-[12px] leading-tight text-dim">Highly<br />reliable</div>
          </div>
        </Karta>
        <Karta className="!p-3.5">
          <Label>Streak</Label>
          <div className="mt-2 flex items-center gap-2">
            <Flame className="h-7 w-7 text-accent" />
            <div>
              <div className="num text-[24px] font-semibold leading-none">{s.seria}</div>
              <div className="mt-1 text-[12px] leading-tight text-dim">shifts on time</div>
            </div>
          </div>
        </Karta>
      </div>

      <Karta onClick={() => s.pokaz("wallet")}>
        <div className="flex items-center justify-between">
          <Label>Wallet</Label>
          <NaSolanie />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <KwotaUsdc kwota={usdc(s.usdc)} className="text-[26px] font-semibold" />
          <ChevronRight className="h-5 w-5 text-faint" />
        </div>
      </Karta>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Missions</Label>
          <button onClick={() => s.pokaz("rewards")} className="text-[12px] font-semibold text-dim">See all</button>
        </div>
        <ListaMisji ile={2} />
      </div>
    </div>
  );
}

function KartaBounty() {
  const otworz = useSymulacja((s) => s.otworzOferte);
  const bonus = useSymulacja((s) => s.bonus);
  const wolne = useSymulacja((s) => s.kandydaci.filter((k) => k.status === "offered").length);
  return (
    <button onClick={otworz} className="relative overflow-hidden rounded-[18px] border border-accent/30 bg-surface p-4 text-left shadow-[var(--shadow-lift)] transition active:scale-[0.99]">
      <div className="absolute inset-y-0 left-0 w-1 bg-accent" />
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Emergency Bounty
        </span>
        <span className="mono text-[11px] text-faint">{wolne} of {ZMIANA.brakuje} spots left</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="display text-[19px] leading-tight">{ZMIANA.dzien} · {ZMIANA.start}</div>
          <div className="mt-0.5 text-[13px] text-dim">{FIRMA.obiekt} · {ZMIANA.stanowisko}</div>
        </div>
        <KwotaUsdc kwota={`+${bonus}`} className="text-[24px] font-semibold" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hair pt-3 text-[13px] font-semibold">
        <span className="inline-flex items-center gap-1 text-dim"><Om /> +50 OM bonus</span>
        <span className="inline-flex items-center gap-1">View offer <ChevronRight className="h-4 w-4" /></span>
      </div>
    </button>
  );
}

function KartaNastepnej() {
  const s = useSymulacja();
  const etykieta = s.faza === "przyjeto" ? "Accepted · starts 14:00" : s.faza === "na-miejscu" ? "On shift now" : "Verifying check-out";
  return (
    <Karta onClick={() => s.pokazEkran("shift")} className="!border-positive/30">
      <div className="flex items-center justify-between">
        <Label>Next shift</Label>
        <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-semibold text-positive">
          <Lock className="h-3 w-3" /> {s.bonus} USDC in escrow
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-[28px] font-semibold">{ZMIANA.start}</span>
        <span className="mono text-[13px] text-dim">- {ZMIANA.koniec}</span>
      </div>
      <div className="display text-[16px]">{FIRMA.obiekt}</div>
      <div className="mt-1 flex items-center justify-between text-[13px] text-dim">
        <span>{etykieta}</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </Karta>
  );
}

/* ───────────────────────── Shifts ───────────────────────── */

const ZAPLANOWANE = [
  { dzien: "Wed, 7 Oct", start: "06:00", koniec: "14:00", obiekt: "Hub Łódź South", rola: "Forklift operator" },
  { dzien: "Thu, 8 Oct", start: "06:00", koniec: "14:00", obiekt: "Hub Łódź South", rola: "Forklift operator" },
  { dzien: "Sat, 10 Oct", start: "14:00", koniec: "22:00", obiekt: "Stryków DC2", rola: "Picker" },
];

export function EkranZmiany() {
  const s = useSymulacja();
  const przyjeta = s.faza !== "wykryto" && s.faza !== "wystawiono";
  return (
    <div className="flex flex-col gap-4">
      <Naglowek tytul="Shifts" podtytul="This week" />
      {s.faza === "wystawiono" ? (
        <>
          <Label>Open bounties</Label>
          <KartaBounty />
        </>
      ) : null}
      <Label>Upcoming</Label>
      {przyjeta ? <KartaNastepnej /> : null}
      {ZAPLANOWANE.map((z) => (
        <Karta key={z.dzien}>
          <div className="flex items-center justify-between">
            <Label>{z.dzien}</Label>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-positive"><Check className="h-3 w-3" /> Confirmed</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-[22px] font-semibold">{z.start}</span>
            <span className="mono text-[13px] text-dim">- {z.koniec}</span>
          </div>
          <div className="text-[14px] font-semibold">{z.obiekt}</div>
          <div className="text-[13px] text-dim">{z.rola}</div>
        </Karta>
      ))}
      <Karta className="!bg-surface-2 !shadow-none">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5" />
          <div className="text-[13px] leading-snug text-dim">Gold members get urgent shifts first and higher Emergency Bounties.</div>
        </div>
      </Karta>
    </div>
  );
}

/* ───────────────────────── Rewards ───────────────────────── */

export function ListaMisji({ ile }: { ile?: number }) {
  const misje = useSymulacja((s) => s.misje);
  const odbierz = useSymulacja((s) => s.odbierzMisje);
  const lista = ile ? [...misje].sort((a, b) => Number(a.odebrana) - Number(b.odebrana)).slice(0, ile) : misje;
  return (
    <div className="flex flex-col gap-2">
      {lista.map((m) => {
        const gotowa = m.postep >= m.cel;
        return (
          <div key={m.id} className="flex items-center gap-3 rounded-[12px] border border-hair bg-surface p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{m.tytul}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <Pasek wartosc={m.postep / m.cel} className="flex-1" kolor={gotowa ? "var(--positive)" : "var(--text)"} />
                <span className="mono text-[11px] text-faint">{m.postep}/{m.cel}</span>
              </div>
            </div>
            {m.odebrana ? (
              <span className="inline-flex h-8 items-center gap-1 px-2 text-[12px] font-semibold text-faint"><Check className="h-3.5 w-3.5" /> Claimed</span>
            ) : gotowa ? (
              <button onClick={() => odbierz(m.id)} className="h-8 rounded-full bg-cta px-3 text-[12px] font-bold text-on-cta transition active:scale-95">
                Claim +{m.om}
              </button>
            ) : (
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-2 px-2.5 text-[12px] font-semibold text-dim">+{m.om} <Om /></span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const IKONY: Record<string, typeof Gift> = { usdc5: Gift, transport: TramFront, paliwo: Fuel, boost: Rocket, pierwszenstwo: Sparkles };

export function EkranNagrody() {
  const s = useSymulacja();
  const lvl = poziom(s.om);
  return (
    <div className="flex flex-col gap-4">
      <Naglowek tytul="Rewards" podtytul="Omnira Rewards" />

      <Karta>
        <div className="flex items-center justify-between">
          <div>
            <Label>OM balance</Label>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="num text-[32px] font-semibold leading-none">{liczba(s.om)}</span>
              <span className="text-[13px] font-semibold text-dim">OM</span>
            </div>
          </div>
          <div className="text-right">
            <Label>Level</Label>
            <div className="mt-1 inline-flex items-center gap-1 text-[16px] font-bold text-warning"><Crown className="h-4 w-4" /> {lvl.obecny.nazwa}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-1">
          {POZIOMY.map((p) => (
            <div key={p.nazwa} className="flex-1">
              <div className={`h-1.5 rounded-full ${s.om >= p.od ? "bg-ink" : "bg-surface-2"}`} />
              <div className={`mt-1.5 text-[10px] font-semibold ${p.nazwa === lvl.obecny.nazwa ? "text-ink" : "text-faint"}`}>{p.nazwa}</div>
            </div>
          ))}
        </div>
      </Karta>

      <div>
        <Label className="mb-2">Missions</Label>
        <ListaMisji />
      </div>

      <div>
        <Label className="mb-2">Redeem OM</Label>
        <div className="flex flex-col gap-2">
          {KATALOG.map((n) => {
            const Ikona = IKONY[n.id] ?? Gift;
            const zablokowana = n.poziom ? lvl.obecny.nazwa !== n.poziom : s.om < n.koszt;
            const wymieniona = s.wymienione.includes(n.id) && !n.usdc;
            return (
              <div key={n.id} className="flex items-center gap-3 rounded-[12px] border border-hair bg-surface p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-surface-2">
                  {n.usdc ? <UsdcZnak className="h-5 w-5" /> : <Ikona className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{n.tytul}</div>
                  <div className="truncate text-[12px] text-dim">{n.opis}</div>
                </div>
                {wymieniona ? (
                  <span className="text-[12px] font-semibold text-positive">Redeemed</span>
                ) : n.poziom ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-dim"><Lock className="h-3 w-3" /> {n.poziom}</span>
                ) : (
                  <button
                    disabled={zablokowana}
                    onClick={() => s.wymien(n.id, n.koszt, n.usdc, n.tytul)}
                    className="h-8 rounded-full bg-cta px-3 text-[12px] font-bold text-on-cta transition active:scale-95 disabled:bg-surface-2 disabled:text-faint"
                  >
                    {liczba(n.koszt)} OM
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Karta>
        <div className="flex items-center gap-4">
          <Pierscien wartosc={s.niezawodnosc} rozmiar={72} grubosc={6} />
          <div>
            <Label>Reliability Score</Label>
            <div className="display mt-1 text-[18px]">Highly Reliable</div>
            <div className="text-[12px] text-dim">Used to prioritise offers and bonus levels</div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {SKLADOWE_WYNIKU.map((sk) => (
            <div key={sk.nazwa}>
              <div className="flex justify-between text-[12px]">
                <span className="text-dim">{sk.nazwa}</span>
                <span className="mono">{sk.wartosc}</span>
              </div>
              <Pasek wartosc={sk.wartosc / 100} className="mt-1" kolor="var(--positive)" />
            </div>
          ))}
        </div>
      </Karta>
    </div>
  );
}

/* ───────────────────────── Wallet ───────────────────────── */

export function EkranPortfel() {
  const s = useSymulacja();
  return (
    <div className="flex flex-col gap-4">
      <Naglowek tytul="Wallet" podtytul="USDC rewards" prawa={<NaSolanie />} />
      <Karta>
        <Label>Balance</Label>
        <div className="mt-2">
          <KwotaUsdc kwota={usdc(s.usdc)} className="text-[36px] font-semibold" />
        </div>
        <div className="mt-1 text-[13px] text-dim">≈ {(s.usdc * 3.63).toLocaleString("en-US", { maximumFractionDigits: 0 })} PLN</div>
        <div className="mt-4 flex items-center justify-between rounded-[10px] bg-surface-2 px-3 py-2.5">
          <div>
            <div className="label !text-[10px]">Your Solana address</div>
            <div className="mono mt-0.5 text-[13px]">{skrot(PRACOWNIK.portfel, 6, 6)}</div>
          </div>
          <Copy className="h-4 w-4 text-dim" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="h-10 rounded-[10px] bg-cta text-[13px] font-semibold text-on-cta">Withdraw to bank</button>
          <button className="h-10 rounded-[10px] border border-line text-[13px] font-semibold">Send</button>
        </div>
      </Karta>

      <div>
        <Label className="mb-2">Activity</Label>
        <div className="flex flex-col divide-y divide-[var(--hairline)] rounded-[12px] border border-hair bg-surface">
          {s.historia.map((t) => (
            <button key={t.id} onClick={() => s.pokazEkran("settled")} disabled={t.id !== "nowa"} className="flex items-center gap-3 p-3 text-left">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-positive-soft text-positive">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold">{t.opis}</div>
                <div className="mono text-[11px] text-faint">{t.kiedy} · {t.sig}…</div>
              </div>
              <span className="num text-[15px] font-semibold text-positive">+{usdc(t.kwota)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-2 text-[11px] text-faint">
        <Sygnet className="h-3 w-3" /> Payouts settled on Solana · {FIRMA.nazwa}
      </div>
    </div>
  );
}
