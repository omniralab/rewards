"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Bot, Building2, CalendarClock, Check, Gift, LayoutGrid, Lock, Settings, ShieldCheck, TriangleAlert, Undo2, Users, Wallet, Zap } from "lucide-react";
import { useSymulacja, type StatusEscrow, type StatusKandydata } from "@/lib/symulacja";
import { FIRMA, ZMIANA, liczba, skrot, usdc } from "@/lib/dane";
import { NaSolanie, SolanaZnak, UsdcZnak, Znak } from "../marka";

/* Panel firmy (agencja / zakład) - widok z produkcji Omniry. Ten sam stan
 * co telefon pracownika, więc wystawienie bounty tutaj od razu wpada
 * powiadomieniem na telefon. */

const NAW = [
  { etykieta: "Overview", Ikona: LayoutGrid },
  { etykieta: "Shifts", Ikona: CalendarClock },
  { etykieta: "Workforce", Ikona: Users },
  { etykieta: "Rewards", Ikona: Gift, aktywna: true },
  { etykieta: "Escrow & payouts", Ikona: Wallet },
  { etykieta: "Agent activity", Ikona: Activity },
  { etykieta: "Settings", Ikona: Settings },
];

export function PasekBoczny() {
  const escrow = useSymulacja((s) => s.escrow);
  const bonus = useSymulacja((s) => s.bonus);
  const faza = useSymulacja((s) => s.faza);
  const zarezerwowane = faza === "wykryto" ? 0 : ZMIANA.brakuje * bonus;
  const pozostalo = FIRMA.budzet - zarezerwowane;
  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-hair bg-surface px-4 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <Znak className="h-[18px] w-auto" />
        <span className="label !text-[10px]">Ops</span>
      </div>
      <div className="mt-6 rounded-[12px] border border-hair bg-bg px-3 py-2.5">
        <div className="label !text-[10px]">Workspace</div>
        <div className="mt-0.5 flex items-center gap-2 text-[13px] font-semibold"><Building2 className="h-3.5 w-3.5" /> {FIRMA.nazwa}</div>
      </div>
      <nav className="mt-5 flex flex-col gap-0.5">
        {NAW.map(({ etykieta, Ikona, aktywna }) => (
          <div key={etykieta} className={`relative flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13.5px] ${aktywna ? "font-semibold text-ink" : "text-dim"}`}>
            {aktywna ? <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-ink" /> : null}
            <Ikona className="h-4 w-4" />
            {etykieta}
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-[14px] border border-hair bg-bg p-3.5">
        <div className="flex items-center justify-between">
          <span className="label !text-[10px]">Agent wallet</span>
          <SolanaZnak className="h-3 w-auto" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <UsdcZnak className="h-4 w-4 self-center" />
          <motion.span key={pozostalo} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="num text-[22px] font-semibold">{usdc(pozostalo)}</motion.span>
        </div>
        <div className="text-[11px] text-dim">of {FIRMA.budzet} USDC shift budget</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${(pozostalo / FIRMA.budzet) * 100}%` }} />
        </div>
        <div className="mono mt-2 text-[10.5px] text-faint">{escrow.length ? `${escrow.length} txs today` : "Ag3n…t7Wq"}</div>
      </div>
    </aside>
  );
}

export function Gorny() {
  return (
    <header className="flex items-center justify-between border-b border-hair bg-surface px-7 py-3.5">
      <div>
        <div className="label !text-[10px]">{FIRMA.nazwa} / {FIRMA.obiekt}</div>
        <div className="display text-[20px]">Emergency staffing</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-bg px-3 py-1.5 text-[12px] font-semibold">
          <Bot className="h-3.5 w-3.5" /> Agent acts within budget
          <span className="ml-1 h-4 w-7 rounded-full bg-positive p-0.5"><span className="block h-3 w-3 translate-x-3 rounded-full bg-white" /></span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-bg px-3 py-1.5 text-[12px] font-semibold">
          <SolanaZnak className="h-3 w-auto" /> Mainnet
        </span>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[12px] font-bold text-[var(--on-cta)]">JK</div>
      </div>
    </header>
  );
}

/* ───────────────────────── Pasek KPI ───────────────────────── */

export function Kpi() {
  const s = useSymulacja();
  const obsadzone = s.kandydaci.filter((k) => k.status !== "matched" && k.status !== "offered").length;
  const kafle = [
    { label: "Open gaps today", wartosc: s.faza === "rozliczono" ? "0" : "1", opis: s.faza === "rozliczono" ? "All shifts covered" : "Line 3 · 14:00", alarm: s.faza !== "rozliczono" },
    { label: "Filled by bounty", wartosc: `${obsadzone}/${ZMIANA.brakuje}`, opis: "Emergency Bounty" },
    { label: "Time to fill", wartosc: s.faza === "wykryto" ? "-" : obsadzone >= ZMIANA.brakuje ? "5 min 36 s" : "live", opis: "vs. 3 h 40 min by phone" },
    { label: "Paid out today", wartosc: s.faza === "rozliczono" ? `${ZMIANA.brakuje * s.bonus}` : "0", opis: "USDC · settled on Solana" },
  ];
  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-[14px] border border-hair bg-hair">
      {kafle.map((k) => (
        <div key={k.label} className="bg-surface px-5 py-4">
          <div className="label !text-[10px]">{k.label}</div>
          <div className={`num mt-1 text-[28px] font-semibold leading-none ${k.alarm ? "text-accent" : ""}`}>{k.wartosc}</div>
          <div className="mt-1.5 text-[12px] text-dim">{k.opis}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Alert agenta + kreator bounty ───────────────────────── */

export function AlertIBounty() {
  const s = useSymulacja();
  const wystawione = s.faza !== "wykryto";
  const suma = ZMIANA.brakuje * s.bonus;
  const reguly = [
    { tekst: `Max ${FIRMA.budzet} USDC / shift`, ok: suma <= FIRMA.budzet },
    { tekst: `Max ${FIRMA.limitNaOsobe} USDC / worker`, ok: s.bonus <= FIRMA.limitNaOsobe },
    { tekst: "Verified workers only", ok: true },
    { tekst: `Required: ${ZMIANA.uprawnienie}`, ok: true },
  ];
  return (
    <div className="card overflow-hidden">
      <div className={`flex items-start gap-3 border-b border-hair px-5 py-4 ${wystawione ? "bg-surface" : "bg-accent-soft"}`}>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${wystawione ? "bg-positive-soft text-positive" : "bg-accent text-white"}`}>
          {wystawione ? <Check className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="label !text-[10px]">Omnira Agent · 11:38</span>
            {wystawione ? <span className="text-[11px] font-semibold text-positive">Action taken</span> : <span className="text-[11px] font-semibold text-accent">Needs decision</span>}
          </div>
          <div className="mt-0.5 text-[15px] font-semibold">
            {FIRMA.linia} · {ZMIANA.dzien} {ZMIANA.start}-{ZMIANA.koniec}: {ZMIANA.brakuje} {ZMIANA.stanowisko.toLowerCase()}s missing
          </div>
          <div className="mt-1 text-[13px] text-dim">
            3 sick calls since 06:00, 5 workers did not confirm. Outbound wave of 1,240 parcels at risk · est. cost of the gap <span className="font-semibold text-ink">${liczba(ZMIANA.kosztLuki)}</span>.
          </div>
        </div>
      </div>

      {/* Po wystawieniu kreator zwija się do jednego paska, żeby na nagraniu
          rejestr escrow mieścił się w kadrze bez przewijania. */}
      {wystawione ? (
        <div className="flex items-center gap-5 whitespace-nowrap px-5 py-3.5 [&>span]:shrink-0">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><Zap className="h-4 w-4" /> Emergency Bounty</span>
          <span className="inline-flex items-center gap-1.5 text-[14px]">
            <UsdcZnak className="h-4 w-4" /> <span className="num font-semibold">+{s.bonus}</span> <span className="text-dim">× {ZMIANA.brakuje} workers</span>
          </span>
          <span className="text-[13px] text-dim"><span className="num font-semibold text-ink">{suma} USDC</span> reserved in escrow</span>
          <span className="hidden items-center gap-1 text-[12px] text-dim 2xl:inline-flex"><ShieldCheck className="h-3.5 w-3.5 text-positive" /> 4 rules passed</span>
          <span className="ml-auto inline-flex h-9 items-center gap-2 rounded-full bg-positive-soft px-4 text-[13px] font-semibold text-positive">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
            </span>
            {s.faza === "rozliczono" ? "Settled" : "Bounty live"}
          </span>
        </div>
      ) : (
      <div className="grid grid-cols-[1fr_auto] gap-6 px-5 py-5">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="text-[14px] font-semibold">Emergency Bounty</span>
            <span className="text-[12px] text-dim">· agent recommendation, 23 verified workers matched</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="w-28 text-[12px] text-dim">Bonus per worker</span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={s.bonus}
              disabled={wystawione}
              onChange={(e) => s.ustawBonus(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-[var(--text)] disabled:cursor-default disabled:opacity-60"
            />
            <span className="inline-flex w-28 items-center justify-end gap-1.5">
              <UsdcZnak className="h-4 w-4" />
              <span className="num text-[22px] font-semibold">+{s.bonus}</span>
              <span className="text-[11px] font-semibold text-dim">USDC</span>
            </span>
          </div>
          <div className="mt-1 flex justify-between pl-32 pr-28 text-[10.5px] text-faint">
            <span>Normal +5</span>
            <span>Urgent 3 h +15</span>
            <span>Rare skill +50</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {reguly.map((r) => (
              <span key={r.tekst} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] ${r.ok ? "border-hair text-dim" : "border-accent text-accent"}`}>
                <ShieldCheck className={`h-3.5 w-3.5 ${r.ok ? "text-positive" : ""}`} /> {r.tekst}
              </span>
            ))}
          </div>
        </div>

        <div className="flex w-[230px] flex-col justify-between rounded-[12px] bg-bg p-4">
          <div>
            <div className="label !text-[10px]">Reserve in escrow</div>
            <div className="mt-1 flex items-center gap-1.5">
              <UsdcZnak className="h-5 w-5" />
              <span className="num text-[30px] font-semibold leading-none">{suma}</span>
            </div>
            <div className="mt-1 text-[12px] text-dim">{ZMIANA.brakuje} × {s.bonus} USDC · paid only after verified check-out</div>
          </div>
          <button onClick={s.wystaw} className="btn btn-cta mt-4 w-full">
            <Zap className="h-4 w-4" /> Launch bounty
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

/* ───────────────────────── Obsadzanie na żywo ───────────────────────── */

const STATUSY: Record<StatusKandydata, { tekst: string; klasa: string }> = {
  matched: { tekst: "Matched", klasa: "bg-surface-2 text-faint" },
  offered: { tekst: "Offer sent", klasa: "bg-info-soft text-info" },
  accepted: { tekst: "Accepted · locked", klasa: "bg-warning-soft text-warning" },
  "on-site": { tekst: "Checked in", klasa: "bg-positive-soft text-positive" },
  paid: { tekst: "Paid", klasa: "bg-positive text-white" },
};

export function Obsadzanie() {
  const s = useSymulacja();
  const obsadzone = s.kandydaci.filter((k) => k.status !== "matched" && k.status !== "offered").length;
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-hair px-5 py-3.5">
        <span className="text-[14px] font-semibold">Live fill</span>
        <span className="num text-[14px] font-semibold">{obsadzone}<span className="text-faint">/{ZMIANA.brakuje}</span></span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-hair">
        {s.kandydaci.map((k) => {
          const st = STATUSY[k.status];
          return (
            <div key={k.id} className={`flex items-center gap-3 px-4 py-2.5 ${k.bohater ? "bg-bg" : "bg-surface"}`}>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-bold">{k.imie.split(" ").map((c) => c[0]).join("")}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{k.imie}</div>
                <div className="mono text-[11px] text-faint">{k.id} · {k.poziom} · score {k.wynik}</div>
              </div>
              <motion.span key={k.status} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${st.klasa}`}>
                {st.tekst}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Rejestr escrow ───────────────────────── */

const STATUSY_ESCROW: Record<StatusEscrow, { tekst: string; klasa: string; Ikona: typeof Lock }> = {
  reserved: { tekst: "Reserved", klasa: "text-info", Ikona: Wallet },
  locked: { tekst: "Locked", klasa: "text-warning", Ikona: Lock },
  released: { tekst: "Released", klasa: "text-positive", Ikona: Check },
  returned: { tekst: "Returned", klasa: "text-dim", Ikona: Undo2 },
};

export function RejestrEscrow() {
  const escrow = useSymulacja((s) => s.escrow);
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-hair px-5 py-3.5">
        <span className="text-[14px] font-semibold">Escrow ledger</span>
        <NaSolanie />
      </div>
      {escrow.length === 0 ? (
        <div className="px-5 py-8 text-center text-[13px] text-faint">No transactions yet. Launch a bounty to reserve funds.</div>
      ) : (
        <div className="flex max-h-[260px] flex-col divide-y divide-[var(--hairline)] overflow-y-auto">
          <AnimatePresence initial={false}>
            {escrow.map((w) => {
              const st = STATUSY_ESCROW[w.status];
              return (
                <motion.div key={w.id} layout initial={{ opacity: 0, backgroundColor: "var(--surface-2)" }} animate={{ opacity: 1, backgroundColor: "var(--surface)" }} transition={{ duration: 0.8 }} className="grid grid-cols-[48px_1fr_90px_96px] items-center gap-3 px-5 py-2.5 text-[13px]">
                  <span className="mono text-[11px] text-faint">{w.czas}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{w.opis}</span>
                    <span className="mono block text-[10.5px] text-faint">{skrot(w.sig, 6, 6)}</span>
                  </span>
                  <span className="num text-right font-semibold">{usdc(w.kwota)}</span>
                  <span className={`inline-flex items-center justify-end gap-1 text-[12px] font-semibold ${st.klasa}`}>
                    <st.Ikona className="h-3.5 w-3.5" /> {st.tekst}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
