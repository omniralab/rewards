"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { KOLEJNOSC, useSymulacja } from "@/lib/symulacja";

/* Sterowanie pokazem z klawiatury - do nagrywania ekranu bez klikania
 * po omacku. Ściąga pod „?" mówi, co robi każdy klawisz. */
const KLAWISZE: [string, string][] = [
  ["Space / →", "Next step of the flow"],
  ["1-6", "Jump: gap · bounty · accepted · on site · settling · settled"],
  ["R", "Reset to start"],
  ["H", "Hide company panel (phone only)"],
  ["L", "Live: real transactions on Solana devnet"],
  ["?", "This help"],
];

export function Rezyser() {
  const [pomoc, ustawPomoc] = useState(false);
  const live = useSymulacja((s) => s.live);
  const liveDostepny = useSymulacja((s) => s.liveDostepny);
  const liveBlad = useSymulacja((s) => s.liveBlad);

  // ?live=1 włącza tryb Live od wejścia (link dla jury), jeśli serwer ma klucze.
  useEffect(() => {
    useSymulacja.getState().sprawdzLive(new URLSearchParams(window.location.search).get("live") === "1");
  }, []);

  useEffect(() => {
    const obsluz = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const s = useSymulacja.getState();
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        s.dalej();
      } else if (/^[1-6]$/.test(e.key)) {
        s.skocz(KOLEJNOSC[Number(e.key) - 1]);
      } else if (e.key === "r" || e.key === "R") {
        s.reset();
      } else if (e.key === "h" || e.key === "H") {
        s.przelaczKonsole();
      } else if (e.key === "l" || e.key === "L") {
        s.przelaczLive();
      } else if (e.key === "?") {
        ustawPomoc((p) => !p);
      } else if (e.key === "Escape") {
        ustawPomoc(false);
      }
    };
    window.addEventListener("keydown", obsluz);
    return () => window.removeEventListener("keydown", obsluz);
  }, []);

  return (
    <>
      {liveDostepny ? (
        <button
          onClick={() => useSymulacja.getState().przelaczLive()}
          className={`fixed bottom-4 right-16 z-50 inline-flex h-9 items-center gap-2 rounded-full border border-hair bg-surface px-3.5 text-[12px] font-semibold transition ${live ? "opacity-100" : "text-faint opacity-40 hover:opacity-100"}`}
          title="Toggle real transactions on Solana devnet (L)"
        >
          <span className={`h-2 w-2 rounded-full ${!live ? "bg-line" : liveBlad ? "bg-warning" : "animate-pulse bg-positive"}`} />
          {!live ? "Simulation" : liveBlad ? "Live paused · simulation" : "Live · Solana devnet"}
        </button>
      ) : null}
      <button onClick={() => ustawPomoc(true)} className="fixed bottom-4 right-4 z-50 grid h-9 w-9 place-items-center rounded-full border border-hair bg-surface text-faint opacity-40 transition hover:opacity-100" aria-label="Keyboard shortcuts">
        <Keyboard className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {pomoc ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4" onClick={() => ustawPomoc(false)}>
            <motion.div initial={{ y: 10 }} animate={{ y: 0 }} className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="label eyebrow">Recording controls</span>
                <button onClick={() => ustawPomoc(false)} aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                {KLAWISZE.map(([k, opis]) => (
                  <div key={k} className="flex items-center gap-4 text-[14px]">
                    <kbd className="mono w-24 shrink-0 rounded-[6px] border border-line bg-bg px-2 py-1 text-center text-[12px]">{k}</kbd>
                    <span className="text-dim">{opis}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[13px] leading-relaxed text-dim">
                Golden path for the video: <b className="text-ink">Launch bounty</b> on the left, then on the phone tap the notification, <b className="text-ink">Accept</b>, <b className="text-ink">View shift</b>, <b className="text-ink">Check in</b>, <b className="text-ink">Check out</b>. Or just press Space six times.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-dim">
                <b className="text-ink">Live</b> (L or <span className="mono">?live=1</span>): the worker&apos;s budget, escrow lock and payout run as real transactions of the escrow program on Solana devnet. Ledger rows marked devnet open in Solana Explorer. Other candidates stay simulated.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
