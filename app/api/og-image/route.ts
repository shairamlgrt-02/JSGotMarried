import { NextResponse } from "next/server";
import { siteOrigin, weddingInfo } from "@/lib/site-meta";

/**
 * GET /api/og-image — the banner friends see when your link is shared. An image uploaded in the
 * binder lives in the database, and WhatsApp / iMessage / Facebook can only fetch a real URL,
 * never a data: URL — so the uploaded banner is streamed from here.
 */
export async function GET() {
  const info = await weddingInfo();
  const src = (info.share_image || "").trim();
  const uploaded = /^data:([\w/+.-]+);base64,([\s\S]+)$/.exec(src);
  if (uploaded) {
    return new NextResponse(Buffer.from(uploaded[2], "base64"), {
      headers: { "Content-Type": uploaded[1], "Cache-Control": "public, max-age=300, s-maxage=900" },
    });
  }
  // a hosted image or the default banner — let it be fetched where it lives
  return NextResponse.redirect(new URL(src || "/og.jpg", siteOrigin()));
}
