import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shaira & Jeger — 11.11.26",
  description: "Shaira & Jeger are getting married. November 11, 2026 · The Heaven, Damistan. #JSWeDo",
  openGraph: { title: "Shaira & Jeger — 11.11.26", description: "#JSWeDo #JSWishComeTrue" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded by the browser (works on Vercel, StackBlitz and offline builds) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" />
      </head>
      <body className="bg-ink text-paper font-sans antialiased">{children}</body>
    </html>
  );
}
