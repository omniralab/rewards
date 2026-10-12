/* Świat pokazu. Wszystko zmyślone i spójne ze sobą: liczby z dokumentu
 * „Omnira Loyalty Program" (stawki OM, progi poziomów, stawki bonusów),
 * reszta dobrana tak, żeby flow na nagraniu domykał się w jednym ujęciu. */

export const FIRMA = {
  nazwa: "Vertex Logistics",
  obiekt: "Hub Łódź South",
  linia: "Line 3 · Outbound",
  budzet: 500,
  limitNaOsobe: 50,
};

export const ZMIANA = {
  id: "SH-30518",
  dzien: "Today",
  start: "14:00",
  koniec: "22:00",
  stanowisko: "Forklift operator",
  uprawnienie: "UDT forklift cert.",
  adres: "ul. Pryncypalna 132, Łódź",
  brakuje: 8,
  kosztLuki: 4800,
  dojazd: "18 min by tram 10",
};

export const PRACOWNIK = {
  imie: "Oksana",
  nazwisko: "Melnyk",
  numer: "W-2417",
  portfel: "7xKXq3vN8pR2tBc9mZ4wE6yH1sJdLfA5uGo9fQm",
  om: 3450,
  usdc: 184.5,
  niezawodnosc: 92,
  seriaNaCzas: 9,
};

/* Poziomy z dokumentu, rozdz. 6. */
export const POZIOMY = [
  { nazwa: "Bronze", od: 0, do: 999 },
  { nazwa: "Silver", od: 1000, do: 2999 },
  { nazwa: "Gold", od: 3000, do: 6999 },
  { nazwa: "Platinum", od: 7000, do: Infinity },
] as const;

export function poziom(om: number) {
  const i = POZIOMY.findIndex((p) => om >= p.od && om <= p.do);
  const obecny = POZIOMY[i];
  const nastepny = POZIOMY[i + 1] ?? null;
  const postep = nastepny ? (om - obecny.od) / (nastepny.od - obecny.od) : 1;
  return { obecny, nastepny, postep, brakuje: nastepny ? nastepny.od - om : 0 };
}

/* Pozostali kandydaci dopasowani przez agenta. Bohaterka nagrania (Oksana)
 * akceptuje ręcznie z telefonu, ci akceptują sami po wystawieniu bounty. */
export const KANDYDACI = [
  { id: "W-1182", imie: "Piotr Zając", wynik: 96, poziom: "Platinum", za: 900 },
  { id: "W-2033", imie: "Dmytro Kovalenko", wynik: 94, poziom: "Gold", za: 1500 },
  { id: "W-0871", imie: "Anna Wróbel", wynik: 91, poziom: "Gold", za: 2300 },
  { id: "W-3310", imie: "Mykola Shevchuk", wynik: 89, poziom: "Silver", za: 3100 },
  { id: "W-1946", imie: "Katarzyna Lis", wynik: 93, poziom: "Gold", za: 3900 },
  { id: "W-2702", imie: "Tomasz Nowak", wynik: 88, poziom: "Silver", za: 4800 },
  { id: "W-0555", imie: "Iryna Bondar", wynik: 95, poziom: "Platinum", za: 5600 },
];

/* Rozdz. 3 i 4: za co pracownik dostaje OM w tym flow. */
export const NAGRODY_ZMIANY = [
  { opis: "Completed shift", om: 100 },
  { opis: "On time", om: 30 },
  { opis: "Emergency shift accepted", om: 50 },
];
export const NAGRODA_SERII = { opis: "Streak · 10 shifts on time", om: 250 };

export type Misja = { id: string; tytul: string; cel: number; postep: number; om: number; odebrana: boolean };
export const MISJE: Misja[] = [
  { id: "dostepnosc", tytul: "Confirm availability for next week", cel: 1, postep: 1, om: 25, odebrana: false },
  { id: "tydzien", tytul: "3 shifts this week", cel: 3, postep: 2, om: 150, odebrana: false },
  { id: "awaryjne", tytul: "2 emergency shifts this month", cel: 2, postep: 1, om: 500, odebrana: false },
  { id: "dokumenty", tytul: "Update your documents", cel: 1, postep: 1, om: 50, odebrana: true },
];

export type Nagroda = { id: string; tytul: string; opis: string; koszt: number; usdc?: number; poziom?: string };
export const KATALOG: Nagroda[] = [
  { id: "usdc5", tytul: "5 USDC", opis: "Sent to your Solana wallet", koszt: 1000, usdc: 5 },
  { id: "transport", tytul: "Monthly tram pass", opis: "MPK Łódź · partner voucher", koszt: 2000 },
  { id: "paliwo", tytul: "Fuel voucher 150 PLN", opis: "Orlen · partner voucher", koszt: 3000 },
  { id: "boost", tytul: "Shift boost +15 USDC", opis: "Extra bonus on a shift you pick", koszt: 5000 },
  { id: "pierwszenstwo", tytul: "First pick of top-paid shifts", opis: "48 h early access, monthly", koszt: 0, poziom: "Platinum" },
];

export type Transakcja = { id: string; opis: string; kwota: number; kiedy: string; sig: string };
export const HISTORIA: Transakcja[] = [
  { id: "t1", opis: "Shift Bonus · Hub Łódź South", kwota: 5, kiedy: "Fri, 2 Oct", sig: "4fJd9Qx2" },
  { id: "t2", opis: "Emergency Bounty · night shift", kwota: 30, kiedy: "Mon, 28 Sep", sig: "2aPw7Ln1" },
  { id: "t3", opis: "Redeemed 1,000 OM", kwota: 5, kiedy: "Thu, 24 Sep", sig: "9kTe3Mv8" },
  { id: "t4", opis: "Emergency Bounty · rare skill", kwota: 45, kiedy: "Sat, 19 Sep", sig: "6sHb1Rc4" },
];

/* Rozdz. 5: składowe Reliability Score. */
export const SKLADOWE_WYNIKU = [
  { nazwa: "Completed shifts", wartosc: 98 },
  { nazwa: "Punctuality", wartosc: 95 },
  { nazwa: "No-shows (90 days)", wartosc: 100 },
  { nazwa: "Confirmation speed", wartosc: 84 },
  { nazwa: "Emergency shifts", wartosc: 88 },
  { nazwa: "Documents up to date", wartosc: 100 },
];

/* Podpis transakcji Solany w kształcie base58 - deterministyczny z ziarna,
 * żeby nagranie za każdym razem pokazywało to samo. */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function podpis(ziarno: string, dlugosc = 88) {
  let h = 2166136261;
  for (const z of ziarno) h = Math.imul(h ^ z.charCodeAt(0), 16777619);
  let wynik = "";
  for (let i = 0; i < dlugosc; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) + i;
    wynik += B58[Math.abs(h) % 58];
  }
  return wynik;
}

export function skrot(s: string, a = 4, b = 4) {
  return `${s.slice(0, a)}…${s.slice(-b)}`;
}

export function usdc(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function liczba(n: number) {
  return n.toLocaleString("en-US");
}
