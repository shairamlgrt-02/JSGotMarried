import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jeger & Shaira — Wedding · 11.11.2026",
  description: "Jeger & Shaira are getting married on 11.11.2026 at The Heaven, Damistan. You're invited. #JSWeDo",
  openGraph: { title: "Jeger & Shaira — 11.11.2026", description: "Save the Date · #JSWeDo #JSWishComeTrue" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Pinyon+Script&family=Jost:wght@300;400;500&display=swap" />
      </head>
      <body className="paper-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
