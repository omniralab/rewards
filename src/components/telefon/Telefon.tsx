"use client";

import { Aplikacja } from "./Aplikacja";

/* Obudowa telefonu wokół aplikacji pracownika. Ekran ma stałe 390×844
 * (logiczne punkty iPhone'a), a całość skaluje się do zadanej wysokości,
 * więc układ aplikacji jest zawsze ten sam - na landingu i w podglądzie. */
const EKRAN_W = 390;
const EKRAN_H = 844;
const RAMKA = 12;

export function Telefon({ wysokosc = 760, className = "" }: { wysokosc?: number; className?: string }) {
  const pelnaW = EKRAN_W + RAMKA * 2;
  const pelnaH = EKRAN_H + RAMKA * 2;
  const skala = wysokosc / pelnaH;
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: pelnaW * skala, height: wysokosc }}>
      <div
        className="absolute left-0 top-0 origin-top-left rounded-[64px] bg-[#0e0e10] shadow-[var(--shadow-float)] ring-1 ring-black/10"
        style={{ width: pelnaW, height: pelnaH, padding: RAMKA, transform: `scale(${skala})` }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[52px]" style={{ isolation: "isolate" }}>
          <Aplikacja />
          {/* Dynamic Island i pasek domowy - nad treścią, nieklikalne. */}
          <div className="pointer-events-none absolute left-1/2 top-[11px] z-[60] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
          <div className="pointer-events-none absolute bottom-[8px] left-1/2 z-[60] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink/80" />
        </div>
      </div>
    </div>
  );
}
