"use client";

import type { ReactNode } from "react";
import { UsdcZnak } from "../marka";

/* Prymitywy aplikacji pracownika - ta sama gramatyka co mobilna apka Omniry
 * (Expo): karta na surface, label mono,
 * tytuł Manrope, liczby display. */

export function Karta({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`block w-full rounded-[12px] border border-hair bg-surface p-4 text-left shadow-[var(--shadow-card)] ${onClick ? "transition active:scale-[0.99]" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`label ${className}`}>{children}</div>;
}

export function Om({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-grid h-[1.15em] min-w-[1.15em] place-items-center rounded-full bg-ink px-[0.3em] text-[0.62em] font-bold leading-none tracking-tight text-[var(--on-cta)] ${className}`}>
      OM
    </span>
  );
}

export function KwotaUsdc({ kwota, className = "" }: { kwota: string | number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <UsdcZnak className="h-[0.9em] w-[0.9em]" />
      <span className="num">{kwota}</span>
      <span className="text-[0.7em] font-semibold text-dim">USDC</span>
    </span>
  );
}

export function Pasek({ wartosc, className = "", kolor = "var(--text)" }: { wartosc: number; className?: string; kolor?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-[var(--ease)]" style={{ width: `${Math.max(2, Math.min(100, wartosc * 100))}%`, background: kolor }} />
    </div>
  );
}

export function Naglowek({ tytul, podtytul, prawa }: { tytul: string; podtytul?: string; prawa?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {podtytul ? <Label>{podtytul}</Label> : null}
        <div className="display mt-1 text-[26px] leading-tight">{tytul}</div>
      </div>
      {prawa}
    </div>
  );
}

/* Okrągły wskaźnik Reliability Score. */
export function Pierscien({ wartosc, rozmiar = 64, grubosc = 6 }: { wartosc: number; rozmiar?: number; grubosc?: number }) {
  const r = (rozmiar - grubosc) / 2;
  const obwod = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: rozmiar, height: rozmiar }}>
      <svg width={rozmiar} height={rozmiar} className="-rotate-90">
        <circle cx={rozmiar / 2} cy={rozmiar / 2} r={r} stroke="var(--surface-2)" strokeWidth={grubosc} fill="none" />
        <circle
          cx={rozmiar / 2}
          cy={rozmiar / 2}
          r={r}
          stroke="var(--positive)"
          strokeWidth={grubosc}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={obwod}
          strokeDashoffset={obwod * (1 - wartosc / 100)}
          style={{ transition: "stroke-dashoffset 900ms var(--ease)" }}
        />
      </svg>
      <span className="num absolute text-[1.1em] font-semibold" style={{ fontSize: rozmiar * 0.3 }}>
        {wartosc}
      </span>
    </div>
  );
}

export function Przycisk({ children, onClick, wariant = "cta", className = "", disabled }: { children: ReactNode; onClick?: () => void; wariant?: "cta" | "ghost"; className?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${
        wariant === "cta" ? "bg-cta text-on-cta" : "border border-line bg-surface text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}
