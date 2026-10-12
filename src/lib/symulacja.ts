"use client";

import { create } from "zustand";
import {
  FIRMA,
  HISTORIA,
  KANDYDACI,
  MISJE,
  NAGRODA_SERII,
  NAGRODY_ZMIANY,
  PRACOWNIK,
  ZMIANA,
  podpis,
  type Misja,
  type Transakcja,
} from "./dane";
import { liveNaSerwerze, wywolajLive } from "./live/klient";

/* Jeden stan na cały pokaz. Telefon pracownika i panel firmy czytają to samo,
 * więc klik po jednej stronie od razu widać po drugiej.
 *
 * Fazy idą za najważniejszym momentem z notatek do filmu:
 * pilna zmiana → bonus USDC → akceptacja → wykonanie → settlement. */
export type Faza =
  | "wykryto" // agent widzi lukę, nic jeszcze nie wystawione
  | "wystawiono" // Emergency Bounty poszło do dopasowanych pracowników
  | "przyjeto" // pracownik przyjął, bonus zablokowany w escrow
  | "na-miejscu" // check-in na obiekcie
  | "rozliczanie" // zmiana zakończona, escrow sprawdza warunek
  | "rozliczono"; // USDC zwolnione do portfela

export const KOLEJNOSC: Faza[] = ["wykryto", "wystawiono", "przyjeto", "na-miejscu", "rozliczanie", "rozliczono"];

export type Zakladka = "home" | "shifts" | "rewards" | "wallet";
export type Ekran = null | "offer" | "escrow" | "shift" | "settled";

export type StatusKandydata = "matched" | "offered" | "accepted" | "on-site" | "paid";
export type Kandydat = { id: string; imie: string; wynik: number; poziom: string; status: StatusKandydata; bohater?: boolean };

export type StatusEscrow = "reserved" | "locked" | "released" | "returned";
/* naLancuchu: podpis jest prawdziwą transakcją na devnecie (tryb Live). */
export type WpisEscrow = { id: string; czas: string; opis: string; kwota: number; status: StatusEscrow; sig: string; naLancuchu?: boolean };

export type PodpisyLive = { budzet?: string; blokada?: string; wyplata?: string };

export type Toast = { id: number; tytul: string; opis?: string; ton: "usdc" | "om" | "info" };

type Stan = {
  faza: Faza;
  zakladka: Zakladka;
  ekran: Ekran;
  powiadomienie: boolean;
  bonus: number;
  om: number;
  usdc: number;
  niezawodnosc: number;
  seria: number;
  misje: Misja[];
  historia: Transakcja[];
  kandydaci: Kandydat[];
  escrow: WpisEscrow[];
  toasty: Toast[];
  wymienione: string[];
  konsolaUkryta: boolean;

  /* Tryb Live: bohaterka robi prawdziwe transakcje na devnecie, reszta
   * zostaje symulacją. Ustawienie przeżywa reset, przebieg nie. */
  live: boolean;
  liveDostepny: boolean;
  liveRun: string | null;
  liveSig: PodpisyLive;
  liveBlad: string | null;

  ustawBonus: (n: number) => void;
  wystaw: () => void;
  otworzOferte: () => void;
  przyjmij: () => void;
  zamelduj: () => void;
  zakoncz: () => void;
  zamknijEkran: () => void;
  pokaz: (z: Zakladka) => void;
  pokazEkran: (e: Ekran) => void;
  odbierzMisje: (id: string) => void;
  wymien: (id: string, koszt: number, usdc?: number, tytul?: string) => void;
  dalej: () => void;
  skocz: (f: Faza) => void;
  reset: (start?: Faza) => void;
  przelaczKonsole: () => void;
  zgasToast: (id: number) => void;
  sprawdzLive: (wlacz?: boolean) => void;
  przelaczLive: () => void;
};

/* Pokolenie timerów: reset podnosi licznik, a callback ze starego pokolenia
 * nic nie robi. Prościej niż pilnowanie listy uchwytów do clearTimeout. */
let pokolenie = 0;
let licznikToastow = 0;

function zegar(): string {
  return "11:4" + ((Date.now() / 1000) % 10 | 0);
}

const stanPoczatkowy = () => ({
  faza: "wykryto" as Faza,
  zakladka: "home" as Zakladka,
  ekran: null as Ekran,
  powiadomienie: false,
  bonus: 20,
  om: PRACOWNIK.om,
  usdc: PRACOWNIK.usdc,
  niezawodnosc: PRACOWNIK.niezawodnosc,
  seria: PRACOWNIK.seriaNaCzas,
  misje: MISJE.map((m) => ({ ...m })),
  historia: [...HISTORIA],
  kandydaci: [
    { id: PRACOWNIK.numer, imie: `${PRACOWNIK.imie} ${PRACOWNIK.nazwisko}`, wynik: PRACOWNIK.niezawodnosc, poziom: "Gold", status: "matched" as StatusKandydata, bohater: true },
    ...KANDYDACI.map((k) => ({ id: k.id, imie: k.imie, wynik: k.wynik, poziom: k.poziom, status: "matched" as StatusKandydata })),
  ],
  escrow: [] as WpisEscrow[],
  toasty: [] as Toast[],
  wymienione: [] as string[],
  liveRun: null as string | null,
  liveSig: {} as PodpisyLive,
  liveBlad: null as string | null,
});

/* Kroki na łańcuchu idą po kolei (blokada wymaga budżetu, wypłata blokady),
 * a symulacja nie czeka: podpis podmienia się, gdy transakcja się potwierdzi. */
let kolejkaLive: Promise<void> = Promise.resolve();

export const useSymulacja = create<Stan>((set, get) => {
  const toast = (t: Omit<Toast, "id">) => {
    const id = ++licznikToastow;
    set((s) => ({ toasty: [...s.toasty, { ...t, id }] }));
    const p = pokolenie;
    setTimeout(() => {
      if (p === pokolenie) get().zgasToast(id);
    }, 3200);
  };

  const pozniej = (ms: number, fn: () => void) => {
    const p = pokolenie;
    setTimeout(() => {
      if (p === pokolenie) fn();
    }, ms);
  };

  const ustawKandydata = (id: string, status: StatusKandydata) =>
    set((s) => ({ kandydaci: s.kandydaci.map((k) => (k.id === id ? { ...k, status } : k)) }));

  const dopiszEscrow = (w: Omit<WpisEscrow, "czas" | "sig">) =>
    set((s) => ({ escrow: [{ ...w, czas: zegar(), sig: podpis(w.id) }, ...s.escrow] }));

  const zmienEscrow = (pasuje: (w: WpisEscrow) => boolean, status: StatusEscrow) =>
    set((s) => ({ escrow: s.escrow.map((w) => (pasuje(w) ? { ...w, status } : w)) }));

  const podpiszEscrow = (id: string, sig: string) =>
    set((s) => ({ escrow: s.escrow.map((w) => (w.id === id ? { ...w, sig, naLancuchu: true } : w)) }));

  /* Jeden krok na devnecie w kolejce. Reset (nowe pokolenie) albo wcześniejszy
   * błąd ucinają resztę przebiegu - pokaz leci dalej jako symulacja. */
  const naLancuchu = <T,>(wywolanie: () => Promise<T> | null, poSukcesie: (r: T) => void) => {
    if (!get().live) return;
    const p = pokolenie;
    kolejkaLive = kolejkaLive.then(async () => {
      if (p !== pokolenie || get().liveBlad) return;
      try {
        const obietnica = wywolanie();
        if (!obietnica) return;
        const r = await obietnica;
        if (p === pokolenie) poSukcesie(r);
      } catch (e) {
        if (p !== pokolenie) return;
        set({ liveBlad: e instanceof Error ? e.message : "Devnet error" });
        toast({ tytul: "Devnet unavailable", opis: "Continuing in simulation", ton: "info" });
      }
    });
  };

  return {
    ...stanPoczatkowy(),
    konsolaUkryta: false,
    live: false,
    liveDostepny: false,

    ustawBonus: (n) => set({ bonus: n }),

    wystaw: () => {
      if (get().faza !== "wykryto") return;
      const { bonus } = get();
      set((s) => ({
        faza: "wystawiono",
        powiadomienie: true,
        kandydaci: s.kandydaci.map((k) => ({ ...k, status: "offered" })),
      }));
      dopiszEscrow({ id: "pool", opis: `Bounty pool · ${ZMIANA.brakuje} × ${bonus} USDC`, kwota: ZMIANA.brakuje * bonus, status: "reserved" });
      naLancuchu(
        () => wywolajLive<{ run: string; sig: string }>({ krok: "budzet" }),
        (r) => {
          set((s) => ({ liveRun: r.run, liveSig: { ...s.liveSig, budzet: r.sig } }));
          podpiszEscrow("pool", r.sig);
        },
      );
      // Pozostali dopasowani akceptują sami, w rytmie, który na nagraniu
      // wygląda jak prawdziwe odpowiedzi z telefonów.
      KANDYDACI.forEach((k) => {
        pozniej(k.za, () => {
          // Prowadzący mógł przeklikać flow szybciej, niż ci zdążyli odpowiedzieć.
          if (get().faza === "rozliczanie" || get().faza === "rozliczono") return;
          ustawKandydata(k.id, get().faza === "na-miejscu" ? "on-site" : "accepted");
          dopiszEscrow({ id: `lock-${k.id}`, opis: `Escrow lock · ${k.id}`, kwota: get().bonus, status: "locked" });
        });
      });
    },

    otworzOferte: () => set({ ekran: "offer", powiadomienie: false }),

    przyjmij: () => {
      const s = get();
      if (s.faza === "wykryto") get().wystaw();
      if (get().faza !== "wystawiono") return;
      set({ faza: "przyjeto", ekran: "escrow", powiadomienie: false });
      ustawKandydata(PRACOWNIK.numer, "accepted");
      dopiszEscrow({ id: `lock-${PRACOWNIK.numer}`, opis: `Escrow lock · ${PRACOWNIK.numer}`, kwota: get().bonus, status: "locked" });
      naLancuchu(
        () => {
          const run = get().liveRun;
          return run ? wywolajLive({ krok: "przyjecie", run, kwota: get().bonus }) : null;
        },
        (r) => {
          set((s) => ({ liveSig: { ...s.liveSig, blokada: r.sig } }));
          podpiszEscrow(`lock-${PRACOWNIK.numer}`, r.sig);
        },
      );
    },

    zamelduj: () => {
      if (get().faza !== "przyjeto") return;
      set((s) => ({
        faza: "na-miejscu",
        ekran: "shift",
        kandydaci: s.kandydaci.map((k) => (k.status === "accepted" ? { ...k, status: "on-site" } : k)),
      }));
      toast({ tytul: "Checked in at 13:52", opis: "On time · geofence verified", ton: "info" });
    },

    zakoncz: () => {
      if (get().faza !== "na-miejscu") return;
      set({ faza: "rozliczanie", ekran: "shift" });
      // Na łańcuchu wypłata rusza od razu; wpis z prawdziwym podpisem
      // dochodzi do rejestru, gdy transakcja się potwierdzi.
      naLancuchu(
        () => {
          const run = get().liveRun;
          return run ? wywolajLive({ krok: "wyplata", run }) : null;
        },
        (r) =>
          set((s) => ({
            liveSig: { ...s.liveSig, wyplata: r.sig },
            escrow: [
              { id: `payout-${PRACOWNIK.numer}`, czas: zegar(), opis: `Payout to wallet · ${PRACOWNIK.numer}`, kwota: s.bonus, status: "released", sig: r.sig, naLancuchu: true },
              ...s.escrow,
            ],
          })),
      );
      pozniej(2600, () => {
        const s = get();
        const omZmiany = NAGRODY_ZMIANY.reduce((a, n) => a + n.om, 0) + NAGRODA_SERII.om;
        zmienEscrow((w) => w.status === "locked", "released");
        zmienEscrow((w) => w.id === "pool", "released");
        const wydane = s.kandydaci.length * s.bonus;
        dopiszEscrow({ id: "return", opis: "Unused budget back to company pool", kwota: FIRMA.budzet - wydane, status: "returned" });
        set({
          faza: "rozliczono",
          ekran: "settled",
          usdc: s.usdc + s.bonus,
          om: s.om + omZmiany,
          niezawodnosc: Math.min(100, s.niezawodnosc + 1),
          seria: s.seria + 1,
          kandydaci: s.kandydaci.map((k) => ({ ...k, status: "paid" })),
          misje: s.misje.map((m) => (m.id === "tydzien" || m.id === "awaryjne" ? { ...m, postep: Math.min(m.cel, m.postep + 1) } : m)),
          historia: [
            { id: "nowa", opis: `Emergency Bounty · ${ZMIANA.id}`, kwota: s.bonus, kiedy: "Just now", sig: podpis(`lock-${PRACOWNIK.numer}`).slice(0, 8) },
            ...s.historia,
          ],
        });
      });
    },

    zamknijEkran: () => set({ ekran: null }),
    pokaz: (z) => set({ zakladka: z, ekran: null }),
    pokazEkran: (e) => set({ ekran: e }),

    odbierzMisje: (id) => {
      const m = get().misje.find((x) => x.id === id);
      if (!m || m.odebrana || m.postep < m.cel) return;
      set((s) => ({ om: s.om + m.om, misje: s.misje.map((x) => (x.id === id ? { ...x, odebrana: true } : x)) }));
      toast({ tytul: `+${m.om} OM`, opis: m.tytul, ton: "om" });
    },

    wymien: (id, koszt, usdc, tytul) => {
      const s = get();
      if (s.om < koszt) return;
      set({
        om: s.om - koszt,
        usdc: s.usdc + (usdc ?? 0),
        wymienione: [...s.wymienione, id],
        historia: usdc
          ? [{ id: `w-${id}-${s.wymienione.length}`, opis: `Redeemed ${koszt.toLocaleString("en-US")} OM`, kwota: usdc, kiedy: "Just now", sig: podpis(id + s.om).slice(0, 8) }, ...s.historia]
          : s.historia,
      });
      toast(usdc ? { tytul: `+${usdc} USDC`, opis: "Sent to your Solana wallet", ton: "usdc" } : { tytul: "Voucher unlocked", opis: tytul, ton: "om" });
    },

    /* Spacja w trybie nagrywania: jeden krok najważniejszego flow. */
    dalej: () => {
      const s = get();
      if (s.faza === "wykryto") return s.wystaw();
      if (s.faza === "wystawiono") return s.ekran === "offer" ? s.przyjmij() : s.otworzOferte();
      if (s.faza === "przyjeto") return s.zamelduj();
      if (s.faza === "na-miejscu") return s.zakoncz();
      if (s.faza === "rozliczono") {
        if (s.ekran) return s.pokaz("rewards");
        if (s.zakladka === "rewards") return s.pokaz("wallet");
        return s.pokaz("home");
      }
    },

    /* Skok do fazy bez przechodzenia pośrednich kroków ręcznie. */
    skocz: (f) => {
      get().reset();
      const kroki: Record<Faza, () => void> = {
        wykryto: () => {},
        wystawiono: () => get().wystaw(),
        przyjeto: () => {
          get().wystaw();
          get().przyjmij();
        },
        "na-miejscu": () => {
          get().wystaw();
          get().przyjmij();
          get().zamelduj();
        },
        rozliczanie: () => {
          get().wystaw();
          get().przyjmij();
          get().zamelduj();
          get().zakoncz();
        },
        rozliczono: () => {
          get().wystaw();
          get().przyjmij();
          get().zamelduj();
          get().zakoncz();
        },
      };
      kroki[f]();
      // Przy skoku pozostali kandydaci akceptują od razu, bez czekania.
      if (f !== "wykryto" && f !== "wystawiono") {
        set((s) => ({
          kandydaci: s.kandydaci.map((k) => (k.bohater ? k : { ...k, status: f === "przyjeto" ? "accepted" : f === "na-miejscu" ? "on-site" : k.status })),
        }));
      }
    },

    reset: (start) => {
      pokolenie++;
      set({ ...stanPoczatkowy() });
      if (start === "wystawiono") get().wystaw();
    },

    przelaczKonsole: () => set((s) => ({ konsolaUkryta: !s.konsolaUkryta })),
    zgasToast: (id) => set((s) => ({ toasty: s.toasty.filter((t) => t.id !== id) })),

    sprawdzLive: (wlacz) => {
      liveNaSerwerze().then((ok) => set((s) => ({ liveDostepny: ok, live: ok && (wlacz ?? s.live) })));
    },

    /* Przełączenie zaczyna pokaz od nowa, żeby nie mieszać symulowanego
     * i prawdziwego przebiegu. */
    przelaczLive: () => {
      if (!get().liveDostepny) return;
      set((s) => ({ live: !s.live }));
      get().reset();
    },
  };
});
