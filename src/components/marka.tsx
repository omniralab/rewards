/* Znak Omniry i dwa logotypy technologii, na których stoi warstwa płatności.
 * Logotypy Solany i USDC są odrysowane w SVG, żeby nie ciągnąć zewnętrznych
 * plików - kolory zgodne z ich materiałami prasowymi. */

export function Znak({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 280 94" fill="none" aria-label="Omnira">
      <g stroke="currentColor" strokeWidth="10">
        <circle cx="46.5" cy="46.75" r="41.5" />
        <path d="M107 88 V46.75 A41.75 41.75 0 0 1 190.5 46.75 V88" />
        <path d="M190.5 46.75 A41.75 41.75 0 0 1 274.5 46.75 V88" />
      </g>
    </svg>
  );
}

/* Sam okrąg - sygnet do małych miejsc (avatar aplikacji, ikona). */
export function Sygnet({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="37" stroke="currentColor" strokeWidth="11" />
    </svg>
  );
}

export function SolanaZnak({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397.7 311.7" aria-label="Solana">
      <defs>
        <linearGradient id="sol-g" x1="360.9" y1="351.5" x2="141.2" y2="-69.3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path fill="url(#sol-g)" d="M64.6 237.9a13 13 0 0 1 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7a13 13 0 0 1-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      <path fill="url(#sol-g)" d="M64.6 3.8A13.4 13.4 0 0 1 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7a13 13 0 0 1-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
      <path fill="url(#sol-g)" d="M333.1 120.1a13 13 0 0 0-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7a13 13 0 0 0 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

export function SolanaLogo({ className = "h-5" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SolanaZnak className="h-[0.8em] w-auto" />
      <span className="font-display font-bold tracking-[0.14em] text-[0.85em]">SOLANA</span>
    </span>
  );
}

export function UsdcZnak({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2000 2000" aria-label="USDC">
      <circle cx="1000" cy="1000" r="1000" fill="#2775CA" />
      <path
        fill="#fff"
        d="M1275 1158.3c0-145.8-87.5-195.8-262.5-216.6-125-16.7-150-50-150-108.4s41.7-95.8 125-95.8c75 0 116.7 25 137.5 87.5a31.3 31.3 0 0 0 29.2 20.8h66.6a28.5 28.5 0 0 0 29.2-29.1v-4.2a208.2 208.2 0 0 0-187.5-170.8v-100c0-16.7-12.5-29.2-33.3-33.4h-62.5c-16.7 0-29.2 12.5-33.4 33.4v95.8c-125 16.7-204.1 100-204.1 204.2 0 137.5 83.3 191.6 258.3 212.5 116.7 20.8 154.2 45.8 154.2 112.5s-58.4 112.5-137.5 112.5c-108.4 0-145.9-45.9-158.4-108.4-4.1-16.6-16.6-25-29.1-25h-70.9a28.5 28.5 0 0 0-29.1 29.2v4.2c16.6 104.1 83.3 179.1 220.8 200v100c0 16.6 12.5 29.1 33.3 33.3h62.5c16.7 0 29.2-12.5 33.4-33.3v-100c125-20.9 208.3-108.4 208.3-220.9z"
      />
      <path
        fill="#fff"
        d="M787.5 1595.8c-325-116.6-491.7-479.1-370.8-800 62.5-175 200-308.3 370.8-370.8 16.7-8.3 25-20.8 25-41.7V325c0-16.7-8.3-29.2-25-33.3-4.2 0-12.5 0-16.7 4.1-395.8 125-612.5 545.9-487.5 941.7 75 233.3 254.2 412.5 487.5 487.5 16.7 8.3 33.4 0 37.5-16.7 4.2-4.1 4.2-8.3 4.2-16.6v-58.4c0-12.5-12.5-29.1-25-37.5zm441.7-1300c-16.7-8.3-33.4 0-37.5 16.7-4.2 4.2-4.2 8.3-4.2 16.7v58.3c0 16.7 12.5 33.3 25 41.7 325 116.6 491.7 479.1 370.8 800-62.5 175-200 308.3-370.8 370.8-16.7 8.3-25 20.8-25 41.7v58.3c0 16.7 8.3 29.2 25 33.3 4.2 0 12.5 0 16.7-4.1 395.8-125 612.5-545.9 487.5-941.7-75-237.5-258.3-416.7-487.5-491.7z"
      />
    </svg>
  );
}

export function UsdcLogo({ className = "h-5" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <UsdcZnak className="h-[1em] w-[1em]" />
      <span className="font-display font-bold tracking-[0.08em] text-[0.85em]">USDC</span>
    </span>
  );
}

/* Plakietka łańcucha: „on Solana" przy kwotach i transakcjach. */
export function NaSolanie({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface px-2 py-0.5 text-[11px] font-medium text-dim ${className}`}>
      <SolanaZnak className="h-2.5 w-auto" />
      Solana
    </span>
  );
}
