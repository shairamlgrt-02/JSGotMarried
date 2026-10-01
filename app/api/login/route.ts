import { NextResponse } from "next/server";
import { COOKIE, adminPassword, sessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (password !== adminPassword()) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  // SameSite=None (+Secure) so the binder session also survives embedded previews/iframes;
  // plain http (local dev) falls back to Lax because None requires Secure.
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  const host = (req.headers.get("host") || "").split(":")[0];
  const localHost = host === "" || host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  // any real domain (Vercel, preview proxies) is served over https → None+Secure there
  const secure = proto.includes("https") || !localHost;
  res.cookies.set(COOKIE, await sessionToken(), {
    httpOnly: true, sameSite: secure ? "none" : "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 60,
  });
  return res;
}
