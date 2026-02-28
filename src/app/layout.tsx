import type { Metadata } from "next";
import { Nunito, Fraunces } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Floupet — Le compagnon de vos compagnons",
  description:
    "Suivez la santé et l'alimentation de vos animaux domestiques avec Floupet. Journal alimentaire, suivi de poids, médicaments et plus encore.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${nunito.variable} ${fraunces.variable}`}>
      <body className="antialiased font-body bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}
