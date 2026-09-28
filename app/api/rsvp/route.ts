import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export async function POST(req: Request) {
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const row = {
    id: crypto.randomUUID(),
    name,
    phone: clip(b.phone, 40),
    pax: b.pax === 2 ? 2 : 1,
    attending: b.attending === "no" ? "no" : "yes",
    dietary: clip(b.dietary, 200),
    message: clip(b.message, 1000),
    song_request: clip(b.song_request, 200),
    source: "RSVP form",
  };
  const { error } = await db.from("guests").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
