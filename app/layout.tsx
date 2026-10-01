import type { Metadata } from "next";
import "./globals.css";

const title = "Jeger & Shaira — Wedding · 11.11.2026";
const description = "Jeger & Shaira are getting married on 11.11.2026 at The Heaven, Damistan. You're invited. #JSWeDo";
const shareImageAlt = "Jeger & Shaira — Save the Date, 11 November 2026 at The Heaven, Damistan";

export const metadata: Metadata = {
  metadataBase: new URL("https://jsgotmarried.vercel.app"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Jeger & Shaira",
    title: "Jeger & Shaira — 11.11.2026",
    description: "Save the Date · #JSWeDo #JSWishComeTrue",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: shareImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
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
