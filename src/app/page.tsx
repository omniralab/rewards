import { Hero, Nawigacja, PasLiczb } from "@/components/landing/Hero";
import { Agent, DlaczegoSolana, DwieWarstwy, JakToDziala, Poziomy, Problem, Stopka, Zakonczenie } from "@/components/landing/Sekcje";

/* Landing Omnira Rewards - wersja do wysłania jury. Kolejność sekcji idzie
 * za scenariuszem filmu: problem → flow USDC → OM → poziomy → agent →
 * dlaczego Solana → karta końcowa. */
export default function Strona() {
  return (
    <>
      <Nawigacja />
      <main>
        <Hero />
        <PasLiczb />
        <Problem />
        <JakToDziala />
        <DwieWarstwy />
        <Poziomy />
        <Agent />
        <DlaczegoSolana />
        <Zakonczenie />
      </main>
      <Stopka />
    </>
  );
}
