import type { Metadata } from "next";
import "./globals.css";
import { siteMetadata } from "@/lib/site-meta";

/**
 * The tab title, the shared-link preview and the tab icon are read from the binder
 * (Settings → Website & sharing) on every request, so edits go live without a redeploy.
 */
export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata();
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Pinyon+Script&family=Jost:wght@0,300;0,400;0,500&display=swap" />
      </head>
      <body className="paper-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
