"use client";

import { useEffect } from "react";
import { useSymulacja } from "@/lib/symulacja";
import { useWysokoscTelefonu } from "@/lib/useWysokosc";
import { Aplikacja } from "@/components/telefon/Aplikacja";
import { Telefon } from "@/components/telefon/Telefon";
import { Rezyser } from "@/components/Rezyser";

/* Sama aplikacja pracownika. Na komórce zajmuje cały ekran jak natywna
 * apka (do nagrania telefonu w ręce), na komputerze stoi w obudowie.
 * Bounty przychodzi samo po 3 s od wejścia - przeładowanie strony = od nowa. */
export default function Telefon_() {
  const wysokosc = useWysokoscTelefonu(60, 560, 940);

  useEffect(() => {
    const s = useSymulacja.getState();
    s.reset();
    const t = setTimeout(() => useSymulacja.getState().wystaw(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className="fixed inset-0 sm:hidden">
        <Aplikacja pelnyEkran />
      </div>
      <div className="hidden h-dvh place-items-center bg-bg sm:grid">
        <Telefon wysokosc={wysokosc} />
        <Rezyser />
      </div>
    </>
  );
}
