import type { Metadata } from "next";
import { headers } from "next/headers";
import { serverSupabase } from "./supabase-server";
import { SEED } from "./seed";
import type { WeddingInfo } from "./types";

/** Used until the couple fills the Website settings in the binder. */
const FALLBACK = {
  title: "Jeger & Shaira — Wedding · 11.11.2026",
  description: "Jeger & Shaira are getting married on 11.11.2026 at The Heaven, Damistan. You're invited. #JSSayIDo",
  shareImage: "/og.jpg",
  favicon: "/favicon.png",
};

/**
 * The address the site is being served from, taken from the request — so the share preview and
 * the tab icon are absolute on any domain (Vercel, a custom domain, a preview host) without
 * hardcoding one. Falls back to the production address when there is no request.
 */
export function siteOrigin(fallback = "https://jsgotmarried.vercel.app"): string {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    if (!host) return fallback;
    const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host);
    const proto = h.get("x-forwarded-proto") || (local ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return fallback;
  }
}

const absolute = (src: string, origin: string) =>
  /^(https?:|data:)/i.test(src) ? src : `${origin}${src.startsWith("/") ? "" : "/"}${src}`;

/** Wedding details as the server knows them — Supabase when configured, the starter data otherwise. */
export async function weddingInfo(): Promise<WeddingInfo> {
  const db = serverSupabase();
  if (db) {
    const { data } = await db.from("wedding_info").select("*").eq("id", "main").maybeSingle();
    if (data) return data as WeddingInfo;
  }
  return SEED.wedding_info[0] as WeddingInfo;
}

/**
 * The browser tab title, the shared-link preview and the tab icon, built from the binder's
 * Website settings. An uploaded banner lives in the database, so it is pointed at
 * /api/og-image — WhatsApp, iMessage and Facebook crawlers can only fetch a real URL.
 */
export function buildMetadata(info: WeddingInfo, origin: string): Metadata {
  const couple = `${info.groom} & ${info.bride}`;
  const title = info.site_title?.trim() || FALLBACK.title;
  const description = info.site_description?.trim() || FALLBACK.description;
  const share = info.share_image?.trim() || FALLBACK.shareImage;
  const shareImage = share.startsWith("data:") ? `${origin}/api/og-image` : absolute(share, origin);
  const favicon = info.favicon?.trim() ? absolute(info.favicon, origin) : FALLBACK.favicon;
  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      type: "website",
      url: "/",
      siteName: couple,
      title,
      description,
      images: [{ url: shareImage, width: 1200, height: 630, alt: `${couple} — Save the Date` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
  };
}

export async function siteMetadata(): Promise<Metadata> {
  return buildMetadata(await weddingInfo(), siteOrigin());
}
