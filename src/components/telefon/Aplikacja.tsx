"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BatteryFull, CalendarClock, Gift, House, Signal, Wallet, Wifi } from "lucide-react";
import { useSymulacja, type Zakladka } from "@/lib/symulacja";
import { FIRMA, ZMIANA } from "@/lib/dane";
import { Sygnet, UsdcZnak } from "../marka";
import { EkranHome, EkranNagrody, EkranPortfel, EkranZmiany } from "./zakladki";
import { EkranDyzuru, EkranEscrow, EkranOferty, EkranRozliczenia } from "./flow";
import { Om } from "./wspolne";

const ZAKLADKI: { id: Zakladka; etykieta: string; Ikona: typeof House }[] = [
  { id: "home", etykieta: "Home", Ikona: House },
  { id: "shifts", etykieta: "Shifts", Ikona: CalendarClock },
  { id: "rewards", etykieta: "Rewards", Ikona: Gift },
  { id: "wallet", etykieta: "Wallet", Ikona: Wallet },
];

/* Aplikacja pracownika - sama zawartość ekranu, bez obudowy. Obudowę
 * dokłada Telefon.tsx; na prawdziwej komórce (/phone) idzie bez niej. */
export function Aplikacja({ pelnyEkran = false }: { pelnyEkran?: boolean }) {
  const s = useSymulacja();
  const przewijak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    przewijak.current?.scrollTo({ top: 0 });
  }, [s.zakladka]);

  const Tresc = { home: EkranHome, shifts: EkranZmiany, rewards: EkranNagrody, wallet: EkranPortfel }[s.zakladka];
  const Nakladka = s.ekran ? { offer: EkranOferty, escrow: EkranEscrow, shift: EkranDyzuru, settled: EkranRozliczenia }[s.ekran] : null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg text-ink">
      {pelnyEkran ? <div style={{ height: "env(safe-area-inset-top)" }} /> : <PasekStatusu />}

      <div ref={przewijak} className="no-scrollbar relative flex-1 overflow-y-auto px-5 pb-6 pt-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={s.zakladka} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <Tresc />
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="relative z-10 grid grid-cols-4 border-t border-hair bg-surface/95 backdrop-blur" style={{ paddingBottom: pelnyEkran ? "max(env(safe-area-inset-bottom), 10px)" : 22 }}>
        {ZAKLADKI.map(({ id, etykieta, Ikona }) => {
          const aktywna = s.zakladka === id && !s.ekran;
          return (
            <button key={id} onClick={() => s.pokaz(id)} className={`relative flex flex-col items-center gap-1 pb-1 pt-2.5 text-[10.5px] font-semibold transition-colors ${aktywna ? "text-ink" : "text-faint"}`}>
              {/* Stan aktywny niesie włos 2px, nie wypełnienie - reguła brandu. */}
              <span className={`absolute left-1/2 top-0 h-[2px] w-8 -translate-x-1/2 bg-ink transition-transform duration-200 ${aktywna ? "scale-y-100" : "scale-y-0"}`} />
              <Ikona className="h-[22px] w-[22px]" strokeWidth={aktywna ? 2.2 : 1.8} />
              {etykieta}
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {Nakladka ? (
          <motion.div
            key={s.ekran}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="no-scrollbar absolute inset-x-0 bottom-0 z-20 overflow-y-auto bg-bg px-5 pb-8"
            style={{ top: pelnyEkran ? "env(safe-area-inset-top)" : 47 }}
          >
            <Nakladka />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Powiadomienie pelnyEkran={pelnyEkran} />
      <Toasty />
    </div>
  );
}

function PasekStatusu() {
  return (
    <div className="relative z-30 flex h-[47px] shrink-0 items-center justify-between bg-bg px-7 pt-1 text-[15px] font-semibold">
      <span className="num">11:42</span>
      <span className="flex items-center gap-1.5">
        <Signal className="h-4 w-4" strokeWidth={2.4} />
        <Wifi className="h-4 w-4" strokeWidth={2.4} />
        <BatteryFull className="h-5 w-5" strokeWidth={2} />
      </span>
    </div>
  );
}

function Powiadomienie({ pelnyEkran }: { pelnyEkran: boolean }) {
  const widoczne = useSymulacja((s) => s.powiadomienie && s.ekran === null);
  const otworz = useSymulacja((s) => s.otworzOferte);
  const bonus = useSymulacja((s) => s.bonus);
  return (
    <AnimatePresence>
      {widoczne ? (
        <motion.button
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.3 }}
          onClick={otworz}
          className="absolute inset-x-2.5 z-40 flex gap-3 rounded-[22px] border border-white/40 bg-surface/90 p-3 text-left shadow-[var(--shadow-float)] backdrop-blur-xl"
          style={{ top: pelnyEkran ? "calc(env(safe-area-inset-top) + 8px)" : 50 }}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-ink text-[var(--on-cta)]">
            <Sygnet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-[12px]">
              <span className="font-semibold uppercase tracking-wide text-dim">Omnira</span>
              <span className="text-faint">now</span>
            </div>
            <div className="text-[14px] font-semibold leading-snug">Emergency Bounty · +{bonus} USDC</div>
            <div className="text-[13px] leading-snug text-dim">{FIRMA.obiekt} needs you today at {ZMIANA.start}. Tap to accept.</div>
          </div>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

function Toasty() {
  const toasty = useSymulacja((s) => s.toasty);
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-[96px] z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasty.map((t) => (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-3 rounded-full bg-panel py-2 pl-2 pr-4 text-[var(--on-panel)] shadow-[var(--shadow-float)]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
              {t.ton === "usdc" ? <UsdcZnak className="h-5 w-5" /> : t.ton === "om" ? <Om className="!bg-white !text-panel text-[18px]" /> : <Sygnet className="h-4 w-4" />}
            </span>
            <span className="leading-tight">
              <span className="block text-[14px] font-semibold">{t.tytul}</span>
              {t.opis ? <span className="block text-[12px] text-white/60">{t.opis}</span> : null}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
