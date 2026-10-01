import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { sendRsvpEmail } from "@/lib/notify";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

/**
 * GET /api/rsvp?code=JS-XXXX — opens a personal invitation link.
 * Returns the household (name + seat cap) and, once the code has been used, the sealed
 * reply so the site can greet the guest and lock the form. Exact-match only; never lists
 * guests. Invitation rows carry a code with approved IS NULL; the burned reply is the row
 * with the same code and approved NOT NULL.
 */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
  if (code.length < 4) return NextResponse.json({ error: "code required" }, { status: 400 });
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const { data, error } = await db
    .from("guests")
    .select("name,pax,approved,attending,plus_one,dietary,song_request,message")
    .eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data || [];
  const isReply = (r: { approved?: boolean | null }) => r.approved !== null && r.approved !== undefined;
  const invite = rows.find((r) => !isReply(r));
  const reply = rows.find(isReply);
  if (!invite && !reply) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    name: invite?.name ?? reply!.name,
    pax: Number(invite?.pax ?? reply?.pax) || 1,
    reply: reply
      ? {
          name: reply.name,
          attending: reply.attending === "no" ? "no" : "yes",
          pax: Number(reply.pax) || 0,
          plus_one: reply.plus_one || "",
          approved: reply.approved,
          dietary: reply.dietary || "",
          song_request: reply.song_request || "",
          message: reply.message || "",
        }
      : null,
  });
}

/**
 * POST /api/rsvp — one reply per invitation code, ever.
 *  · no code            → 403 (only personal links may reply);
 *  · code already used  → 409 (the link is sealed; the site shows the welcome card instead);
 *  · party of two       → always lands in the couple's review queue (approved=false) and
 *    requires the plus-one's name;
 *  · party of one       → auto-approved against the invited seat cap.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const code = clip(b.code, 24).toUpperCase();
  if (!code) return NextResponse.json({ error: "An invitation code is required to reply." }, { status: 403 });
  const wantsPax = b.pax === 2 ? 2 : 1;
  const plusOne = clip(b.plus_one, 120);
  if (wantsPax === 2 && !plusOne) return NextResponse.json({ error: "Please add your plus-one's name." }, { status: 400 });

  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "RSVP is not reachable right now — please try again." }, { status: 503 });

  const { data: rows } = await db
    .from("guests")
    .select("id,name,pax,approved")
    .eq("code", code);
  const all = rows || [];
  if (all.some((r) => r.approved !== null && r.approved !== undefined))
    return NextResponse.json({ error: "This invitation has already replied.", already: true }, { status: 409 });
  const invite = all.find((r) => r.approved === null || r.approved === undefined);
  if (!invite) return NextResponse.json({ error: "We couldn't match that invitation code." }, { status: 404 });

  const paxMax = Number(invite.pax) || 1;
  const pax = Math.min(wantsPax, paxMax);
  const approved = pax === 1; // a second seat always waits for the couple's personal confirmation

  const row = {
    name,
    phone: clip(b.phone, 40),
    pax: b.attending === "no" ? 0 : pax,
    attending: b.attending === "no" ? "no" : ("yes" as "yes" | "no"),
    dietary: clip(b.dietary, 200),
    message: clip(b.message, 1000),
    song_request: clip(b.song_request, 200),
    plus_one: b.attending === "no" ? "" : plusOne,
  };
  const { error } = await db.from("guests").insert({ ...row, id: crypto.randomUUID(), source: "RSVP form", code, approved });
  if (error) {
    console.error("guests insert failed:", error.message);
    return NextResponse.json({ error: "RSVP is not reachable right now — please try again." }, { status: 503 });
  }

  await sendRsvpEmail({
    ...row,
    approval: approved ? `code ${code} — auto-approved (${invite.name})` : `code ${code} — NEEDS REVIEW (party of two)`,
  });
  return NextResponse.json({ ok: true, saved: true, emailed: true, approved, household: invite.name, paxMax });
}
