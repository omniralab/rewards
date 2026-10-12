"use client";

import { useEffect, useState } from "react";

/* Wysokość okna przycięta do widełek - telefon na podglądzie ma wypełniać
 * ekran nagrania, ale nie rosnąć w nieskończoność na 4K. */
export function useWysokoscTelefonu(odejmij: number, min = 560, max = 880) {
  const [h, ustaw] = useState(760);
  useEffect(() => {
    const licz = () => ustaw(Math.max(min, Math.min(max, window.innerHeight - odejmij)));
    licz();
    window.addEventListener("resize", licz);
    return () => window.removeEventListener("resize", licz);
  }, [odejmij, min, max]);
  return h;
}
