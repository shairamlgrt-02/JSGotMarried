import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { sendRsvpEmail } from "@/lib/notify";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

/**
 * GET /api/rsvp?code=JS-XXXX — exact-match invite-code lookup for the public form.
 * Answers only "yes, this household + seat cap" or an error; never lists guests.
 * Invitation rows are the ones carrying a code with approved IS NULL (form replies store
 * the code they used together with approved true/false, so they never match).
 */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
  if (code.length < 4) return NextResponse.json({ error: "code required" }, { status: 400 });
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { data, error } = await db.from("guests").select("name,pax,approved").eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const invite = (data || []).find((r: { approved?: boolean | null }) => r.approved === null || r.approved === undefined);
  if (!invite) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, name: invite.name, pax: Number(invite.pax) || 1 });
}

/**
 * POST /api/rsvp — one reply.
 *  · valid invite code  → auto-approved, capped at the invited seat count, and a household's
 *    second submission updates its earlier reply instead of doubling it;
 *  · missing/unknown code → saved but flagged approved=false so the couple reviews it in the
 *    binder before it counts toward catering.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const code = clip(b.code, 24).toUpperCase();
  const wantsPax = b.pax === 2 ? 2 : 1;

  const db = serverSupabase();
  let approved: boolean | null = false;
  let paxMax = 0;
  let household = "";
  if (code && db) {
    const { data } = await db.from("guests").select("id,name,pax").eq("code", code).is("approved", null);
    const invite = (data || [])[0];
    if (invite) {
      approved = true;
      paxMax = Number(invite.pax) || 1;
      household = String(invite.name || "");
    }
  }
  const pax = approved && paxMax ? Math.min(wantsPax, paxMax) : wantsPax;

  const row = {
    name,
    phone: clip(b.phone, 40),
    pax: b.attending === "no" ? 0 : pax,
    attending: b.attending === "no" ? "no" : ("yes" as "yes" | "no"),
    dietary: clip(b.dietary, 200),
    message: clip(b.message, 1000),
    song_request: clip(b.song_request, 200),
  };

  let saved = false;
  if (db) {
    if (approved && code) {
      // one reply per household: update the earlier one if it exists
      const { data: prev } = await db.from("guests").select("id").eq("code", code).not("approved", "is", null);
      const existing = (prev || [])[0];
      const { error } = existing
        ? await db.from("guests").update({ ...row, approved }).eq("id", existing.id)
        : await db.from("guests").insert({ ...row, id: crypto.randomUUID(), source: "RSVP form", code, approved });
      if (!error) saved = true;
      else console.error("rsvp upsert failed:", error.message);
    } else {
      const { error } = await db.from("guests").insert({ ...row, id: crypto.randomUUID(), source: "RSVP form", code, approved });
      if (!error) saved = true;
      else console.error("guests insert failed:", error.message);
    }
  }

  const emailed = await sendRsvpEmail({
    ...row,
    approval: approved === true ? `code ${code} — auto-approved${household ? ` (${household})` : ""}` : code ? `code ${code} — NEEDS REVIEW` : "no code — NEEDS REVIEW",
  });
  if (!saved && !emailed) return NextResponse.json({ error: "RSVP is not reachable right now — please try again." }, { status: 503 });
  return NextResponse.json({ ok: true, saved, emailed, approved, household, paxMax });
}
