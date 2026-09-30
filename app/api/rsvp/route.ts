import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { sendRsvpEmail } from "@/lib/notify";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const row = {
    name,
    phone: clip(b.phone, 40),
    pax: b.pax === 2 ? 2 : 1,
    attending: b.attending === "no" ? "no" : ("yes" as "yes" | "no"),
    dietary: clip(b.dietary, 200),
    message: clip(b.message, 1000),
    song_request: clip(b.song_request, 200),
  };
  // 1) Save to Supabase when configured (otherwise the browser keeps its own copy).
  let saved = false;
  const db = serverSupabase();
  if (db) {
    const { error } = await db.from("guests").insert({ ...row, id: crypto.randomUUID(), source: "RSVP form" });
    if (!error) saved = true;
    else console.error("guests insert failed:", error.message);
  }
  // 2) E-mail the couple a copy — works with or without Supabase.
  const emailed = await sendRsvpEmail(row);
  if (!saved && !emailed) return NextResponse.json({ error: "RSVP is not reachable right now — please try again." }, { status: 503 });
  return NextResponse.json({ ok: true, saved, emailed });
}
