import type { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FF6B4A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Floupet — Le compagnon de vos compagnons",
  description:
    "Suivez la santé et l'alimentation de vos animaux domestiques avec Floupet. Journal alimentaire, suivi de poids, médicaments et plus encore.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Floupet",
  },
  icons: {
    icon: "/logo-icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/logo-icon.svg" color="#FF6B4A" />
      </head>
      <body className="antialiased font-body bg-cream text-ink">
        <NextTopLoader color="var(--ink)" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
