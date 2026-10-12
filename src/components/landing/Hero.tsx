"use client";

import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useSymulacja } from "@/lib/symulacja";
import { SolanaLogo, UsdcLogo, Znak } from "../marka";
import { Telefon } from "../telefon/Telefon";

export function Nawigacja() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Znak className="h-[18px] w-auto" />
          <span className="label !text-[10px]">Rewards</span>
        </a>
        <nav className="hidden items-center gap-7 text-[14px] text-dim md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#loyalty" className="hover:text-ink">OM Points</a>
          <a href="#agent" className="hover:text-ink">AI agent</a>
          <a href="#solana" className="hover:text-ink">Why Solana</a>
        </nav>
        <a href="/app" className="btn btn-cta !h-10 !px-4 !text-[14px]">
          Live preview <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

function useWysokoscHero() {
  const [h, ustaw] = useState(700);
  useEffect(() => {
    const licz = () => ustaw(window.innerWidth < 640 ? 600 : Math.min(720, Math.max(600, window.innerHeight - 140)));
    licz();
    window.addEventListener("resize", licz);
    return () => window.removeEventListener("resize", licz);
  }, []);
  return h;
}

export function Hero() {
  const wysokosc = useWysokoscHero();

  // Telefon na landingu gra sam: po chwili wpada Emergency Bounty, dalej
  // klika już oglądający.
  useEffect(() => {
    useSymulacja.getState().reset();
    const t = setTimeout(() => useSymulacja.getState().wystaw(), 2200);
    return () => clearTimeout(t);
  }, []);

  const odNowa = () => {
    useSymulacja.getState().reset();
    setTimeout(() => useSymulacja.getState().wystaw(), 600);
  };

  return (
    <section id="top" className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-16">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div>
          <div className="label eyebrow">Omnira Rewards · AI × Workforce × Solana</div>
          <h1 className="display mt-5 text-[length:var(--t-h1)] leading-[1.02]">
            AI can detect a workforce problem.{" "}
            <span className="text-dim">Omnira gives it the economic layer to act.</span>
          </h1>
          <p className="mt-6 max-w-[56ch] text-[length:var(--t-lead)] leading-relaxed text-dim">
            Omnira rewards the behaviour companies actually care about: showing up, being on time and stepping in when the
            operation needs you. OM Loyalty Points build long-term reliability. USDC bonuses on Solana fill urgent gaps
            in minutes, paid from escrow only when the job is done.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/app" className="btn btn-cta">Open the live preview <ArrowRight className="h-4 w-4" /></a>
            <a href="#how" className="btn btn-ghost">How it works</a>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="label">Payments built on</span>
            <SolanaLogo className="text-[22px]" />
            <UsdcLogo className="text-[22px]" />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Telefon wysokosc={wysokosc} />
          <div className="mt-5 flex items-center gap-4 text-[13px] text-dim">
            <span>Tap the notification. It&apos;s clickable.</span>
            <button onClick={odNowa} className="inline-flex items-center gap-1.5 font-semibold text-ink"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const LICZBY = [
  { wartosc: "1", jednostka: "worker", opis: "missing from a line can stop a whole outbound wave" },
  { wartosc: "3 h 40", jednostka: "min", opis: "average time to fill an urgent gap by phone today" },
  { wartosc: "5 min 36", jednostka: "s", opis: "to fill 8 spots with an Emergency Bounty in our pilot scenario" },
];

export function PasLiczb() {
  return (
    <div className="border-y border-hair bg-surface px-4 sm:px-8">
      <div className="mx-auto grid max-w-[1200px] divide-y divide-[var(--hairline)] md:grid-cols-3 md:divide-x md:divide-y-0">
        {LICZBY.map((l) => (
          <div key={l.opis} className="py-8 md:px-8 md:first:pl-0">
            <div className="flex items-baseline gap-2">
              <span className="num text-[clamp(40px,4.4vw,60px)] font-semibold leading-none">{l.wartosc}</span>
              <span className="text-[18px] font-semibold text-dim">{l.jednostka}</span>
            </div>
            <p className="mt-3 max-w-[32ch] text-[15px] text-dim">{l.opis}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
