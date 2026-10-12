"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSymulacja } from "@/lib/symulacja";
import { useWysokoscTelefonu } from "@/lib/useWysokosc";
import { AlertIBounty, Gorny, Kpi, Obsadzanie, PasekBoczny, RejestrEscrow } from "@/components/konsola/Konsola";
import { Telefon } from "@/components/telefon/Telefon";
import { Rezyser } from "@/components/Rezyser";

/* Podgląd „jak na produkcji" do nagrania: panel firmy po lewej, telefon
 * pracownika po prawej, jeden stan. H chowa panel i zostawia sam telefon. */
export default function Podglad() {
  const ukryta = useSymulacja((s) => s.konsolaUkryta);
  // Panel: nagłówek 74 + odstępy 48 + etykieta nad telefonem 30.
  const wysokosc = useWysokoscTelefonu(ukryta ? 60 : 160, 560, ukryta ? 940 : 820);

  return (
    <div className="h-dvh overflow-hidden bg-bg">
      <AnimatePresence mode="wait" initial={false}>
        {ukryta ? (
          <motion.div key="telefon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full place-items-center">
            <Telefon wysokosc={wysokosc} />
          </motion.div>
        ) : (
          <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full">
            <PasekBoczny />
            <div className="flex min-w-0 flex-1 flex-col">
              <Gorny />
              <div className="flex min-h-0 flex-1 gap-8 overflow-hidden px-7 py-6">
                <div className="no-scrollbar flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto pb-6 [&>*]:shrink-0">
                  <Kpi />
                  <AlertIBounty />
                  <Obsadzanie />
                  <RejestrEscrow />
                </div>
                <div className="hidden shrink-0 flex-col items-center lg:flex">
                  <div className="label mb-3 !text-[10px]">Worker app · live</div>
                  <Telefon wysokosc={wysokosc} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Rezyser />
    </div>
  );
}
