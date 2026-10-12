"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Building2, Check, Clock, Coins, Crown, Eye, FileSpreadsheet, Lock, ShieldCheck, Undo2, Wallet, Zap } from "lucide-react";
import { SKLADOWE_WYNIKU } from "@/lib/dane";
import { SolanaLogo, SolanaZnak, UsdcLogo, UsdcZnak, Znak } from "../marka";
import { Naglowek, Sekcja, Wejscie } from "./wspolne";

/* ───────────────────────── Problem ───────────────────────── */

const PROBLEMY = [
  { Ikona: FileSpreadsheet, tytul: "Spreadsheets and phone calls", opis: "Coordinators find out about a gap when the shift has already started, then spend hours calling a list." },
  { Ikona: Clock, tytul: "One missing person, real cost", opis: "In logistics, production and security a single no-show stops a line, delays a wave or breaks a contract SLA." },
  { Ikona: Coins, tytul: "Incentives that don't scale", opis: "Bonuses are promised by phone, paid weeks later by hand, and nobody can audit who got what for which shift." },
];

export function Problem() {
  return (
    <Sekcja>
      <Naglowek
        brow="The problem"
        tytul="Large workforces still run on spreadsheets, phone calls and hope."
        lead="Omnira is an AI operating layer for companies managing large workforces. It monitors availability, detects risks early and helps coordinators resolve them. For this hackathon we added the missing piece: a real economic incentive to solve the problem."
      />
      <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--r-lg)] border border-hair bg-hair md:grid-cols-3">
        {PROBLEMY.map(({ Ikona, tytul, opis }, i) => (
          <Wejscie key={tytul} opoznienie={i * 0.08} className="bg-surface p-7">
            <Ikona className="h-6 w-6" strokeWidth={1.6} />
            <div className="display mt-6 text-[20px]">{tytul}</div>
            <p className="mt-2 text-[15px] leading-relaxed text-dim">{opis}</p>
          </Wejscie>
        ))}
      </div>
    </Sekcja>
  );
}

/* ───────────────────────── Jak to działa ───────────────────────── */

const KROKI = [
  { nr: "01", tytul: "Urgent shift", opis: "The AI agent detects 8 missing forklift operators for today's 14:00 shift.", Ikona: Zap },
  { nr: "02", tytul: "USDC bonus", opis: "The company attaches +20 USDC per worker. 160 USDC is reserved from the shift budget.", Ikona: Coins },
  { nr: "03", tytul: "Accept", opis: "Verified workers get an Emergency Bounty on their phone and accept with one tap.", Ikona: Check },
  { nr: "04", tytul: "Complete", opis: "The bonus is locked in escrow on Solana while the worker checks in and works the shift.", Ikona: Lock },
  { nr: "05", tytul: "Settlement", opis: "Verified check-out releases USDC to the worker's wallet. Unused budget goes back to the company.", Ikona: Wallet },
];

export function JakToDziala() {
  const [aktywny, ustawAktywny] = useState(0);
  const [pauza, ustawPauze] = useState(false);
  useEffect(() => {
    if (pauza) return;
    const t = setInterval(() => ustawAktywny((a) => (a + 1) % KROKI.length), 2600);
    return () => clearInterval(t);
  }, [pauza]);

  return (
    <Sekcja id="how" className="bg-surface">
      <Naglowek
        brow="How it works"
        tytul={<>From a gap to a paid shift in five steps.</>}
        lead="The most important moment in Omnira Rewards: urgent shift, USDC bonus, acceptance, completion, settlement. No phone calls, no manual payouts, no trust required."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16" onMouseEnter={() => ustawPauze(true)} onMouseLeave={() => ustawPauze(false)}>
        <ol className="flex flex-col">
          {KROKI.map((k, i) => (
            <li key={k.nr}>
              <button onClick={() => ustawAktywny(i)} className="group relative flex w-full gap-5 border-t border-hair py-5 text-left">
                {/* Stan aktywny niesie włos 2px na górze - reguła brandu. */}
                <span className={`absolute left-0 top-[-1px] h-[2px] bg-ink transition-all duration-500 ${aktywny === i ? "w-full" : "w-0"}`} />
                <span className={`mono pt-1 text-[12px] ${aktywny === i ? "text-ink" : "text-faint"}`}>{k.nr}</span>
                <span className="flex-1">
                  <span className={`display block text-[22px] transition-colors ${aktywny === i ? "text-ink" : "text-faint group-hover:text-dim"}`}>{k.tytul}</span>
                  <AnimatePresence initial={false}>
                    {aktywny === i ? (
                      <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden">
                        <span className="block pt-2 text-[15px] leading-relaxed text-dim">{k.opis}</span>
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <Wejscie>
          <Schemat krok={aktywny} />
        </Wejscie>
      </div>
    </Sekcja>
  );
}

/* Schemat przepływu środków: budżet firmy → escrow na Solanie → portfel
 * pracownika, z gałęzią zwrotu. Krok sterowany z listy obok. */
function Schemat({ krok }: { krok: number }) {
  const wezly = [
    { id: "firma", tytul: "Company budget", podtytul: "500 USDC · agent wallet", Ikona: Building2, aktywny: krok <= 1 },
    { id: "escrow", tytul: "Escrow on Solana", podtytul: "160 USDC locked · 8 workers", Ikona: Lock, aktywny: krok === 2 || krok === 3 },
    { id: "pracownik", tytul: "Worker wallet", podtytul: "+20 USDC · +430 OM", Ikona: Wallet, aktywny: krok === 4 },
  ];
  const statusy = ["Gap detected", "160 USDC reserved", "8/8 accepted · locked", "Checked in · on shift", "Released in 0.4 s"];
  return (
    <div className="rounded-[var(--r-xl)] border border-hair bg-bg p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="label">Funds flow</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface px-2.5 py-1 text-[12px] font-semibold">
          <SolanaZnak className="h-3 w-auto" /> {statusy[krok]}
        </span>
      </div>
      <div className="relative mt-8 flex flex-col gap-4">
        {wezly.map((w, i) => (
          <div key={w.id}>
            <motion.div animate={{ scale: w.aktywny ? 1 : 0.98, opacity: w.aktywny ? 1 : 0.55 }} transition={{ duration: 0.4 }} className={`flex items-center gap-4 rounded-[var(--r-lg)] border bg-surface p-4 ${w.aktywny ? "border-ink shadow-[var(--shadow-lift)]" : "border-hair"}`}>
              <div className={`grid h-11 w-11 place-items-center rounded-[12px] ${w.aktywny ? "bg-ink text-[var(--on-cta)]" : "bg-surface-2"}`}>
                <w.Ikona className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold">{w.tytul}</div>
                <div className="mono text-[12px] text-dim">{w.podtytul}</div>
              </div>
              {i === 1 ? <SolanaZnak className="h-4 w-auto" /> : i === 2 ? <UsdcZnak className="h-5 w-5" /> : null}
            </motion.div>
            {i < wezly.length - 1 ? (
              <div className="relative ml-[37px] h-8 w-px bg-line">
                <motion.span
                  animate={{ top: (i === 0 && krok >= 1 && krok <= 2) || (i === 1 && krok === 4) ? ["0%", "100%"] : "0%", opacity: (i === 0 && krok >= 1 && krok <= 2) || (i === 1 && krok === 4) ? 1 : 0 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-[5px] grid h-[11px] w-[11px] place-items-center rounded-full bg-usdc"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className={`mt-5 flex items-center gap-2 rounded-[12px] border border-dashed px-4 py-3 text-[13px] transition-colors ${krok === 4 ? "border-ink text-ink" : "border-line text-dim"}`}>
        <Undo2 className="h-4 w-4 shrink-0" />
        Condition not met, or budget unused? Funds return to the company pool automatically. 340 USDC back.
      </div>
    </div>
  );
}

/* ───────────────────────── Dwie warstwy (pas negatywowy 1/2) ───────────────────────── */

const OM_ZA = [
  ["Completed shift", "+100"],
  ["On time", "+30"],
  ["Shift confirmed early", "+20"],
  ["Emergency shift accepted", "+50"],
  ["Full week, no absence", "+50"],
  ["10 shifts on time (streak)", "+250"],
];

const BONUSY = [
  ["Normal shift", "+5"],
  ["Urgent cover, 3 h ahead", "+15"],
  ["Urgent cover, 45 min ahead", "+30"],
  ["Rare certification missing", "+40-50"],
  ["Night, holiday, remote site", "dynamic"],
];

export function DwieWarstwy() {
  return (
    <Sekcja id="loyalty" invert>
      <Wejscie className="max-w-[860px]">
        <div className="label eyebrow">Two layers, one goal</div>
        <h2 className="display mt-4 text-[length:var(--t-h2)] leading-[1.05]">
          OM builds long-term loyalty.<br />
          <span className="text-dim">USDC solves urgent problems instantly.</span>
        </h2>
      </Wejscie>

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Wejscie className="rounded-[var(--r-xl)] border border-hair bg-surface p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--text)] text-[11px] font-bold text-[var(--panel)]">OM</span>
              OM Loyalty Points
            </span>
            <span className="label">In-app · not a token</span>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-dim">
            Workers earn OM for what companies actually care about. OM unlocks levels, priority for the best shifts and a
            rewards catalogue. No speculation, no tokenomics.
          </p>
          <div className="mt-6 flex flex-col divide-y divide-[var(--hairline)] border-y border-hair">
            {OM_ZA.map(([a, b]) => (
              <div key={a} className="flex items-center justify-between py-3 text-[15px]">
                <span className="text-dim">{a}</span>
                <span className="mono font-semibold">{b} OM</span>
              </div>
            ))}
          </div>
        </Wejscie>

        <Wejscie opoznienie={0.08} className="rounded-[var(--r-xl)] border border-hair bg-surface p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
              <UsdcZnak className="h-8 w-8" /> USDC Rewards
            </span>
            <span className="inline-flex items-center gap-1.5 label"><SolanaZnak className="h-2.5 w-auto" /> Settled on Solana</span>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-dim">
            Shift Bonus and Emergency Bounty: real money, sized to how hard the problem is, always inside the budget and
            rules the company set.
          </p>
          <div className="mt-6 flex flex-col divide-y divide-[var(--hairline)] border-y border-hair">
            {BONUSY.map(([a, b]) => (
              <div key={a} className="flex items-center justify-between py-3 text-[15px]">
                <span className="text-dim">{a}</span>
                <span className="mono font-semibold">{b}{b !== "dynamic" ? " USDC" : ""}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["max 500 USDC / shift", "max 50 USDC / worker", "verified workers only", "required skills only"].map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5 rounded-full border border-hair px-3 py-1 text-[12px] text-dim">
                <ShieldCheck className="h-3.5 w-3.5 text-positive" /> {r}
              </span>
            ))}
          </div>
        </Wejscie>
      </div>
    </Sekcja>
  );
}

/* ───────────────────────── Poziomy i Reliability Score ───────────────────────── */

const POZIOMY_KORZYSCI = [
  { nazwa: "Bronze", prog: "0 - 999 OM", korzysci: ["Welcome bonus +100 OM", "Profile missions"] },
  { nazwa: "Silver", prog: "1,000 - 2,999 OM", korzysci: ["Early access to some shifts", "Base OM bonuses"] },
  { nazwa: "Gold", prog: "3,000 - 6,999 OM", korzysci: ["Priority for attractive shifts", "Higher Emergency Bounties", "Faster reward payouts"] },
  { nazwa: "Platinum", prog: "7,000+ OM", korzysci: ["First pick of top-paid shifts", "Extra USDC campaigns", "Ambassador & referral premium"] },
];

export function Poziomy() {
  return (
    <Sekcja>
      <Naglowek
        brow="Levels & reputation"
        tytul="Loyalty you can feel. Reliability you can measure."
        lead="OM shows loyalty and activity. Reliability Score shows quality. Together they decide who gets the best shifts and the biggest bonuses, rewarding good behaviour instead of punishing bad."
      />
      <div className="mt-14 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-px overflow-hidden rounded-[var(--r-lg)] border border-hair bg-hair sm:grid-cols-2">
          {POZIOMY_KORZYSCI.map((p, i) => (
            <Wejscie key={p.nazwa} opoznienie={i * 0.06} className={`p-6 ${p.nazwa === "Gold" ? "bg-bg" : "bg-surface"}`}>
              <div className="flex items-center justify-between">
                <span className="display inline-flex items-center gap-2 text-[22px]">
                  {p.nazwa === "Gold" || p.nazwa === "Platinum" ? <Crown className="h-5 w-5" /> : null}
                  {p.nazwa}
                </span>
                {p.nazwa === "Gold" ? <span className="label !text-ink">Oksana is here</span> : null}
              </div>
              <div className="mono mt-1 text-[12px] text-faint">{p.prog}</div>
              <ul className="mt-4 flex flex-col gap-2 text-[14px] text-dim">
                {p.korzysci.map((k) => (
                  <li key={k} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />{k}</li>
                ))}
              </ul>
            </Wejscie>
          ))}
        </div>

        <Wejscie opoznienie={0.1} className="card p-7">
          <div className="label">Reliability Score</div>
          <div className="mt-3 flex items-end gap-3">
            <span className="num text-[length:var(--t-num)] font-semibold leading-[0.85]">92</span>
            <span className="pb-2 text-[18px] font-semibold text-dim">/100</span>
          </div>
          <div className="mt-2 text-[15px] font-semibold text-positive">Highly Reliable</div>
          <div className="mt-6 flex flex-col gap-3">
            {SKLADOWE_WYNIKU.map((s) => (
              <div key={s.nazwa}>
                <div className="flex justify-between text-[13px]"><span className="text-dim">{s.nazwa}</span><span className="mono">{s.wartosc}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.wartosc}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-positive" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] leading-relaxed text-dim">No-shows never claw back paid USDC. They reset the streak and lower priority. That&apos;s it.</p>
        </Wejscie>
      </div>
    </Sekcja>
  );
}

/* ───────────────────────── Agent z budżetem ───────────────────────── */

const DZIENNIK = [
  { czas: "11:38", tekst: "Gap detected · Line 3 · 14:00 · 8 forklift operators missing", ton: "accent" },
  { czas: "11:38", tekst: "Budget check · 500 USDC available · 4/4 rules passed", ton: "dim" },
  { czas: "11:39", tekst: "Emergency Bounty +20 USDC → 23 verified workers matched", ton: "ink" },
  { czas: "11:44", tekst: "8/8 accepted · 160 USDC locked in escrow", ton: "ink" },
  { czas: "13:58", tekst: "8/8 checked in · geofence verified", ton: "dim" },
  { czas: "22:03", tekst: "Check-out verified · 160 USDC released to 8 wallets", ton: "positive" },
  { czas: "22:03", tekst: "340 USDC unused → returned to company pool", ton: "dim" },
];

export function Agent() {
  const [widoczne, ustawWidoczne] = useState(0);
  const [start, ustawStart] = useState(false);
  useEffect(() => {
    if (!start) return;
    if (widoczne >= DZIENNIK.length) {
      const t = setTimeout(() => ustawWidoczne(0), 4000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => ustawWidoczne((w) => w + 1), widoczne === 0 ? 300 : 900);
    return () => clearTimeout(t);
  }, [widoczne, start]);

  return (
    <Sekcja id="agent" className="bg-surface">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Naglowek
          brow="The bigger vision"
          tytul="We give workforce AI agents a wallet, a budget and permission to act."
          lead={
            <>
              Today it means rewarding someone for taking an urgent shift. Tomorrow it means AI agents operating with
              predefined budgets and solving workforce problems autonomously. <span className="text-ink">Today AI can detect a workforce problem. Omnira lets it pay to solve it.</span>
            </>
          }
        />
        <motion.div onViewportEnter={() => ustawStart(true)} viewport={{ once: true, margin: "-100px" }} data-invert className="rounded-[var(--r-xl)] p-6 shadow-[var(--shadow-float)] sm:p-7">
          <div className="flex items-center justify-between border-b border-hair pb-4">
            <span className="inline-flex items-center gap-2 text-[14px] font-semibold"><Bot className="h-4 w-4" /> Omnira Agent · activity</span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-dim"><UsdcZnak className="h-3.5 w-3.5" /> 500 USDC budget</span>
          </div>
          <div className="mono mt-4 flex min-h-[290px] flex-col gap-3 text-[13px] leading-snug">
            <AnimatePresence>
              {DZIENNIK.slice(0, widoczne).map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-4">
                  <span className="shrink-0 text-faint">{w.czas}</span>
                  <span className={w.ton === "accent" ? "text-accent" : w.ton === "positive" ? "text-positive" : w.ton === "dim" ? "text-dim" : "text-ink"}>{w.tekst}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {widoczne < DZIENNIK.length ? <span className="inline-block h-4 w-2 animate-pulse bg-[var(--text)]" /> : null}
          </div>
        </motion.div>
      </div>
    </Sekcja>
  );
}

/* ───────────────────────── Dlaczego Solana ───────────────────────── */

const POWODY = [
  { Ikona: Zap, tytul: "Fast", opis: "Sub-second confirmation and fees in fractions of a cent. A 20 USDC bonus can't lose 2 USDC to fees." },
  { Ikona: ShieldCheck, tytul: "Programmable", opis: "Budgets, rules and escrow live in code. The agent can only spend what the company allowed, on what it allowed." },
  { Ikona: Eye, tytul: "Transparent", opis: "Every reservation, lock, release and refund is on-chain. Workers trust the payout, finance can audit it." },
];

export function DlaczegoSolana() {
  return (
    <Sekcja id="solana">
      <Naglowek
        brow="Why Solana"
        tytul="Rewards need to be fast, programmable and transparent."
        lead="USDC gives workers real economic value without introducing another speculative token. OM stays a loyalty system, while Solana handles real payments, escrow and settlement."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {POWODY.map(({ Ikona, tytul, opis }, i) => (
          <Wejscie key={tytul} opoznienie={i * 0.08} className="card p-7">
            <Ikona className="h-6 w-6" strokeWidth={1.6} />
            <div className="display mt-6 text-[22px]">{tytul}</div>
            <p className="mt-2 text-[15px] leading-relaxed text-dim">{opis}</p>
          </Wejscie>
        ))}
      </div>
      <Wejscie className="mt-5 flex flex-col items-center justify-between gap-6 rounded-[var(--r-lg)] border border-hair bg-surface px-7 py-6 md:flex-row">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <SolanaLogo className="text-[28px]" />
          <UsdcLogo className="text-[28px]" />
        </div>
        <p className="max-w-[46ch] text-[14px] text-dim md:text-right">No own token. OM are loyalty points, not an investment asset. Real value moves in USDC.</p>
      </Wejscie>
    </Sekcja>
  );
}

/* ───────────────────────── Zakończenie (pas negatywowy 2/2) ───────────────────────── */

export function Zakonczenie() {
  return (
    <section data-invert className="px-4 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-[1200px] text-center">
        <Wejscie>
          <Znak className="mx-auto h-10 w-auto" />
          <h2 className="display mx-auto mt-10 max-w-[900px] text-[length:var(--t-h2)] leading-[1.05]">
            Omnira is building the intelligence layer.{" "}
            <span className="text-dim">Crypto gives that intelligence an economic layer.</span>
          </h2>
          <div className="mono mt-8 text-[13px] tracking-[0.2em] text-dim">AI × WORKFORCE × SOLANA</div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="/app" className="btn btn-cta">Open the live preview <ArrowRight className="h-4 w-4" /></a>
            <a href="https://omniralab.com" className="btn btn-ghost">omniralab.com</a>
          </div>
        </Wejscie>
      </div>
    </section>
  );
}

export function Stopka() {
  return (
    <footer className="border-t border-hair px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-3 text-[13px] text-faint md:flex-row">
        <span>© 2026 Omnira Lab · Omnira Rewards</span>
        <span>Product preview for the Colosseum hackathon. Data and transactions shown are illustrative.</span>
      </div>
    </footer>
  );
}
