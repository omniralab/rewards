import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin", "latin-ext"] });

// Strona pokazowa na hackathon Colosseum. Bez bramki dostępu, bo link idzie
// do jury w zgłoszeniu, i poza indeksem, bo to koncept, nie oferta.
export const metadata: Metadata = {
  title: "Omnira Rewards - AI × Workforce × Solana",
  description:
    "Omnira rewards the behavior companies actually care about: showing up, being on time and stepping in when the operation needs you. OM Loyalty Points plus USDC rewards settled on Solana.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f8",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Zmienne next/font MUSZĄ siedzieć na <html> - aliasy w :root ich szukają.
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
