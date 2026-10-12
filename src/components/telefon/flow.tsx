"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, Clock, ExternalLink, LoaderCircle, Lock, LogOut, MapPin, ShieldCheck, X } from "lucide-react";
import { useSymulacja } from "@/lib/symulacja";
import { FIRMA, NAGRODA_SERII, NAGRODY_ZMIANY, PRACOWNIK, ZMIANA, liczba, podpis, poziom, skrot, usdc } from "@/lib/dane";
import { NaSolanie, SolanaZnak, UsdcZnak } from "../marka";
import { Karta, KwotaUsdc, Label, Om, Pasek, Przycisk } from "./wspolne";

function Pasek_({ tytul, onWstecz }: { tytul: string; onWstecz: () => void }) {
  return (
    <div className="flex items-center justify-between pb-2">
      <button onClick={onWstecz} className="-ml-2 grid h-10 w-10 place-items-center rounded-full active:bg-surface-2" aria-label="Back">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <span className="text-[15px] font-semibold">{tytul}</span>
      <span className="w-10" />
    </div>
  );
}

/* ───────────────────────── Oferta: Emergency Bounty ───────────────────────── */

export function EkranOferty() {
  const s = useSymulacja();
  const wolne = s.kandydaci.filter((k) => k.status === "offered").length;
  return (
    <div className="flex min-h-full flex-col gap-4">
      <Pasek_ tytul="Emergency Bounty" onWstecz={s.zamknijEkran} />

      <div className="rounded-[18px] border border-accent/25 bg-accent-soft p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Urgent · starts in 2 h 18 min</span>
          <span className="mono text-[11px] text-dim">{ZMIANA.id}</span>
        </div>
        <div className="mt-4 text-[13px] font-semibold text-dim">Bonus on top of your pay</div>
        <KwotaUsdc kwota={`+${s.bonus}.00`} className="mt-1 text-[44px] font-semibold leading-none" />
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold"><Om /> +50 OM emergency</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold"><Om /> +130 OM shift</span>
        </div>
      </div>

      <Karta>
        <div className="flex items-baseline gap-2">
          <span className="num text-[30px] font-semibold">{ZMIANA.start}</span>
          <span className="mono text-[14px] text-dim">- {ZMIANA.koniec} · {ZMIANA.dzien}</span>
        </div>
        <div className="display mt-1 text-[18px]">{FIRMA.obiekt}</div>
        <div className="text-[13px] text-dim">{FIRMA.linia} · {ZMIANA.stanowisko}</div>
        <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-dim">
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {ZMIANA.adres}</span>
          <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {ZMIANA.dojazd}</span>
        </div>
      </Karta>

      <Karta>
        <Label>You qualify</Label>
        <div className="mt-2 flex flex-col gap-2 text-[14px]">
          {["Verified worker", ZMIANA.uprawnienie, "Gold level · priority access"].map((w) => (
            <span key={w} className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-positive-soft text-positive"><Check className="h-3 w-3" /></span>{w}</span>
          ))}
        </div>
      </Karta>

      <div className="flex items-start gap-3 rounded-[12px] bg-surface-2 p-3.5 text-[12.5px] leading-snug text-dim">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
        <span>When you accept, the bonus is locked in escrow on Solana. It is released to your wallet automatically after a verified check-out.</span>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="text-center text-[12px] text-faint">{wolne} of {ZMIANA.brakuje} spots left</div>
        <Przycisk onClick={s.przyjmij}>Accept shift · +{s.bonus} USDC</Przycisk>
      </div>
    </div>
  );
}

/* ───────────────────────── Escrow ───────────────────────── */

const KROKI_ESCROW = [
  { tytul: "Bonus reserved", opis: `From ${FIRMA.nazwa} shift budget` },
  { tytul: "Locked in escrow", opis: "Smart contract on Solana" },
  { tytul: "Release on verified check-out", opis: "Paid to your wallet automatically" },
];

export function EkranEscrow() {
  const s = useSymulacja();
  const [krok, ustawKrok] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => ustawKrok(1), 700);
    const b = setTimeout(() => ustawKrok(2), 1700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  const sig = podpis(`lock-${PRACOWNIK.numer}`);
  return (
    <div className="flex min-h-full flex-col gap-4">
      <Pasek_ tytul="Shift accepted" onWstecz={s.zamknijEkran} />
      <div className="flex flex-col items-center pt-2 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="grid h-20 w-20 place-items-center rounded-full bg-ink text-[var(--on-cta)]">
          {krok < 2 ? <LoaderCircle className="h-9 w-9 animate-spin" /> : <Lock className="h-9 w-9" />}
        </motion.div>
        <div className="display mt-4 text-[24px] leading-tight">{krok < 2 ? "Securing your bonus…" : "Your bonus is secured"}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[14px] text-dim">
          <UsdcZnak className="h-4 w-4" /> {s.bonus}.00 USDC locked until check-out
        </div>
      </div>

      <Karta>
        <div className="flex flex-col">
          {KROKI_ESCROW.map((k, i) => {
            const zrobiony = i < krok || (i === 1 && krok >= 2);
            const trwa = i === krok && i < 2;
            const czeka = i === 2;
            return (
              <div key={k.tytul} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`grid h-6 w-6 place-items-center rounded-full ${zrobiony ? "bg-positive text-white" : czeka ? "border border-line bg-surface" : "bg-surface-2"}`}>
                    {zrobiony ? <Check className="h-3.5 w-3.5" /> : trwa ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                  </div>
                  {i < KROKI_ESCROW.length - 1 ? <div className={`my-1 w-px flex-1 ${zrobiony ? "bg-positive" : "bg-line"}`} /> : null}
                </div>
                <div className="pb-4">
                  <div className={`text-[14px] font-semibold ${czeka ? "text-dim" : ""}`}>{k.tytul}</div>
                  <div className="text-[12px] text-dim">{k.opis}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-hair pt-3">
          <div>
            <div className="label !text-[10px]">Escrow transaction</div>
            <div className="mono mt-0.5 text-[12px]">{krok >= 2 ? skrot(sig, 8, 8) : "pending…"}</div>
          </div>
          <NaSolanie />
        </div>
      </Karta>

      <div className="mt-auto pt-2">
        <Przycisk onClick={() => s.pokazEkran("shift")} disabled={krok < 2}>View shift</Przycisk>
      </div>
    </div>
  );
}

/* ───────────────────────── Zmiana: check-in, check-out ───────────────────────── */

export function EkranDyzuru() {
  const s = useSymulacja();
  const naMiejscu = s.faza === "na-miejscu";
  const rozliczanie = s.faza === "rozliczanie";
  return (
    <div className="flex min-h-full flex-col gap-4">
      <Pasek_ tytul={naMiejscu ? "On shift" : rozliczanie ? "Shift completed" : "Your shift"} onWstecz={s.zamknijEkran} />

      {/* Mapka-szkic obiektu z geofence - bez kafelków, czysty SVG. */}
      <div className="relative h-[150px] overflow-hidden rounded-[18px] border border-hair bg-surface-2">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 340 150" preserveAspectRatio="xMidYMid slice">
          <g stroke="var(--border)" strokeWidth="9" fill="none" strokeLinecap="round">
            <path d="M-10 110 L140 90 L360 120" />
            <path d="M120 -10 L140 90 L150 170" />
            <path d="M230 -10 L250 100" />
          </g>
          <rect x="170" y="30" width="120" height="58" rx="6" fill="var(--surface)" stroke="var(--border-strong)" />
          <circle cx="230" cy="60" r="52" fill="var(--positive)" fillOpacity={naMiejscu || rozliczanie ? 0.12 : 0.06} stroke="var(--positive)" strokeDasharray="4 4" />
          <circle cx={naMiejscu || rozliczanie ? 222 : 98} cy={naMiejscu || rozliczanie ? 66 : 116} r="7" fill="var(--info)" stroke="#fff" strokeWidth="3" style={{ transition: "all 900ms var(--ease)" }} />
        </svg>
        <div className="absolute left-3 top-3 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold shadow-[var(--shadow-card)]">{FIRMA.obiekt}</div>
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-positive shadow-[var(--shadow-card)]">
          <MapPin className="h-3 w-3" /> {naMiejscu || rozliczanie ? "Inside geofence" : "1.2 km away"}
        </div>
      </div>

      <Karta>
        <div className="flex items-center justify-between">
          <Label>{ZMIANA.dzien}</Label>
          <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-semibold text-positive">
            <Lock className="h-3 w-3" /> {s.bonus} USDC in escrow
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-[30px] font-semibold">{ZMIANA.start}</span>
          <span className="mono text-[14px] text-dim">- {ZMIANA.koniec}</span>
        </div>
        <div className="text-[14px] font-semibold">{ZMIANA.stanowisko} · {FIRMA.linia}</div>
        <div className="mt-1 text-[12px] text-dim">Shift lead: Marek Duda · gate B</div>
        {naMiejscu || rozliczanie ? (
          <div className="mt-4">
            <div className="flex justify-between text-[12px] text-dim">
              <span>Checked in 13:52 · on time</span>
              <span className="mono">{rozliczanie ? "22:00" : "17:41"}</span>
            </div>
            <Pasek wartosc={rozliczanie ? 1 : 0.46} className="mt-1.5" kolor="var(--positive)" />
          </div>
        ) : null}
      </Karta>

      {rozliczanie ? (
        <Karta>
          <div className="flex items-center gap-3">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <div>
              <div className="text-[14px] font-semibold">Verifying check-out…</div>
              <div className="text-[12px] text-dim">Escrow releases your bonus once attendance is confirmed</div>
            </div>
          </div>
        </Karta>
      ) : null}

      <div className="mt-auto pt-2">
        {s.faza === "przyjeto" ? (
          <Przycisk onClick={s.zamelduj}><MapPin className="h-5 w-5" /> I&apos;m here · Check in</Przycisk>
        ) : naMiejscu ? (
          <Przycisk onClick={s.zakoncz}><LogOut className="h-5 w-5" /> Finish shift · Check out</Przycisk>
        ) : rozliczanie ? (
          <Przycisk disabled><LoaderCircle className="h-5 w-5 animate-spin" /> Settling on Solana…</Przycisk>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────── Rozliczono ───────────────────────── */

export function EkranRozliczenia() {
  const s = useSymulacja();
  const [szczegoly, ustawSzczegoly] = useState(false);
  const sumaOm = NAGRODY_ZMIANY.reduce((a, n) => a + n.om, 0) + NAGRODA_SERII.om;
  const lvl = poziom(s.om);
  return (
    <div className="relative flex min-h-full flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={s.zamknijEkran} className="grid h-10 w-10 place-items-center rounded-full active:bg-surface-2" aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 14 }} className="relative grid h-24 w-24 place-items-center rounded-full bg-positive text-white">
          <Check className="h-12 w-12" strokeWidth={2.5} />
          <motion.span initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.2, repeat: 1 }} className="absolute inset-0 rounded-full bg-positive" />
        </motion.div>
        <div className="mt-5 text-[14px] font-semibold text-dim">Bonus received</div>
        <KwotaUsdc kwota={`+${usdc(s.bonus)}`} className="mt-1 text-[44px] font-semibold leading-none" />
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-dim">
          <SolanaZnak className="h-2.5 w-auto" /> Released from escrow · confirmed in 0.4 s
        </div>
      </div>

      <Karta>
        <div className="flex items-center justify-between">
          <Label>OM earned</Label>
          <span className="num text-[18px] font-semibold">+{sumaOm}</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {[...NAGRODY_ZMIANY, NAGRODA_SERII].map((n, i) => (
            <motion.div key={n.opis} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.12 }} className="flex items-center justify-between text-[14px]">
              <span className="text-dim">{n.opis}</span>
              <span className="mono font-semibold">+{n.om} OM</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 border-t border-hair pt-3">
          <div className="flex justify-between text-[12px] text-dim">
            <span>{liczba(s.om)} OM · {lvl.obecny.nazwa}</span>
            <span>{lvl.nastepny ? `${liczba(lvl.brakuje)} to ${lvl.nastepny.nazwa}` : ""}</span>
          </div>
          <Pasek wartosc={lvl.postep} className="mt-1.5" kolor="var(--warning)" />
        </div>
      </Karta>

      <Karta>
        <div className="flex items-center justify-between">
          <div>
            <Label>Reliability Score</Label>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-[16px] text-faint line-through">92</span>
              <span className="num text-[28px] font-semibold">{s.niezawodnosc}</span>
              <span className="text-[12px] font-semibold text-positive">+1</span>
            </div>
          </div>
          <div className="text-right text-[12px] text-dim">Streak<br /><span className="num text-[18px] font-semibold text-ink">{s.seria} on time</span></div>
        </div>
      </Karta>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Przycisk wariant="ghost" onClick={() => ustawSzczegoly(true)}><ExternalLink className="h-4 w-4" /> View transaction</Przycisk>
        <Przycisk onClick={() => s.pokaz("rewards")}>Go to rewards</Przycisk>
      </div>

      {szczegoly ? <ArkuszTransakcji onZamknij={() => ustawSzczegoly(false)} /> : null}
    </div>
  );
}

/* Arkusz udający podgląd eksploratora. Prawdziwego linku nie dajemy:
 * podpis jest zmyślony i eksplorer zwróciłby 404. */
function ArkuszTransakcji({ onZamknij }: { onZamknij: () => void }) {
  const bonus = useSymulacja((s) => s.bonus);
  const sig = podpis(`release-${PRACOWNIK.numer}`);
  const wiersze: [string, string][] = [
    ["Signature", skrot(sig, 10, 10)],
    ["Status", "Finalized"],
    ["Slot", "318,442,907"],
    ["Block time", "Oct 5, 2026 · 22:03:41"],
    ["Fee", "0.000005 SOL"],
    ["Program", "Omnira Escrow · OMNesc…8vKp"],
    ["From", "Escrow PDA · 3hQw…Lm2T"],
    ["To", skrot(PRACOWNIK.portfel, 6, 6)],
    ["Amount", `${usdc(bonus)} USDC`],
  ];
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onZamknij} className="absolute inset-0 bg-black/30" aria-label="Close" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="relative -mx-5 -mb-8 rounded-t-[24px] bg-surface px-5 pb-10 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SolanaZnak className="h-4 w-auto" />
            <span className="text-[15px] font-semibold">Transaction details</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-semibold text-positive"><Check className="h-3 w-3" /> Success</span>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-[var(--hairline)]">
          {wiersze.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-dim">{k}</span>
              <span className={`mono text-right ${k === "Status" ? "text-positive" : ""}`}>{v}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
