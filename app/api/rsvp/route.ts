import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { sendRsvpEmail } from "@/lib/notify";
import { cleanCode, isReply, planParty, seatCapFor, whoIsItFor } from "@/lib/guests";
import { markViewed, matchCode, updateGuest } from "@/lib/invite-gate";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

/** The reply, in the shape the site and the keepsake read it back. */
const shape = (r: Record<string, unknown>) => ({
  name: String(r.name ?? ""),
  attending: r.attending === "no" ? ("no" as const) : ("yes" as const),
  pax: Number(r.pax) || 0,
  plus_one: String(r.plus_one ?? ""),
  approved: r.approved === true,
  dietary: String(r.dietary ?? ""),
  song_request: String(r.song_request ?? ""),
  message: String(r.message ?? ""),
});

/**
 * GET /api/rsvp?code=JS-7KQF — opens a personal invitation link (or the last four characters
 * of it, typed at /rsvp). Returns the household (name + seat cap), its canonical code and, once
 * the code has been used, the sealed reply so the site can greet the guest and lock the form.
 * Never lists guests: one household, the one this code belongs to.
 * One row per household: while it is waiting the row is the invitation (approved IS NULL); once
 * the guest replies that same row is overwritten with the reply (approved NOT NULL). Rows split
 * in two are only ever left behind by older builds.
 */
export async function GET(req: Request) {
  const code = cleanCode(new URL(req.url).searchParams.get("code") || "");
  if (code.length < 3) return NextResponse.json({ error: "code required" }, { status: 400 });
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const hit = await matchCode(db, code);
  if (hit.kind === "ambiguous")
    return NextResponse.json({ error: "That code matches more than one invitation — please type the full code from your link.", ambiguous: hit.codes }, { status: 409 });
  if (hit.kind === "none") return NextResponse.json({ error: "not found" }, { status: 404 });

  const rows = hit.rows;
  const invite = rows.find((r) => !isReply(r));
  const reply = rows.find(isReply);
  if (!invite && !reply) return NextResponse.json({ error: "not found" }, { status: 404 });

  await markViewed(db, hit.code, rows);
  return NextResponse.json({
    ok: true,
    code: hit.code,
    name: invite?.name ?? reply!.name,
    // the couple's own label for the link ("Ana & Ivan") — shown above the reply card, and never
    // used to pre-fill the guest's name, which stays theirs to type
    label: whoIsItFor(invite ?? reply!),
    pax: seatCapFor(invite?.pax ?? reply?.pax),
    reply: reply ? shape(reply as unknown as Record<string, unknown>) : null,
  });
}

/**
 * POST /api/rsvp — one reply per invitation code, ever.
 *  · no code            → 403 (only personal links may reply);
 *  · unknown code       → 404;
 *  · code already used  → 409 (the link is sealed; the site shows the welcome card instead);
 *  · a party of two or more → always lands in the couple's review queue (approved=false) and
 *    requires a name for every extra guest;
 *  · party of one, or a decline → auto-approved against the invited seat cap.
 * The card offers 1…4 seats (`MAX_RSVP_SEATS`), never more than the invitation carries: a household
 * invited with five seats can still only answer for four of them here.
 * The reply OVERWRITES the invitation row in place (same id, same code): the binder keeps
 * one row per household, so filling in the form through a link never duplicates a guest.
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = clip(b.name, 120);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const code = cleanCode(b.code);
  if (!code) return NextResponse.json({ error: "An invitation code is required to reply." }, { status: 403 });
  const declined = b.attending === "no";
  // whatever the guest's browser says, 1…4 seats — the invitation's own cap is applied after the code is matched
  const wantsPax = b.pax;
  const companions = clip(b.plus_one, 400);

  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "RSVP is not reachable right now — please try again." }, { status: 503 });

  const hit = await matchCode(db, code);
  if (hit.kind === "ambiguous")
    return NextResponse.json({ error: "That code matches more than one invitation — open the personal link the couple sent you.", ambiguous: hit.codes }, { status: 409 });
  const all = hit.kind === "found" ? hit.rows : [];
  if (all.some(isReply))
    return NextResponse.json({ error: "This invitation has already replied.", already: true }, { status: 409 });
  const invite = all.find((r) => !isReply(r));
  if (!invite) return NextResponse.json({ error: "We couldn't match that invitation code." }, { status: 404 });

  const canonical = hit.kind === "found" ? hit.code : code;
  // the invitation's own cap decides, trimmed to four — and every seat past the first carries a name
  const { pax, paxMax, needed, plusOne, missingNames, approved } = planParty(wantsPax, invite.pax, companions, declined);
  if (missingNames > 0)
    return NextResponse.json({ error: `Please add a name for each of your ${needed} guest${needed === 1 ? "" : "s"}.` }, { status: 400 });

  const row = {
    name,
    phone: clip(b.phone, 40),
    pax,
    attending: declined ? ("no" as const) : ("yes" as const),
    dietary: clip(b.dietary, 200),
    message: clip(b.message, 1000),
    song_request: clip(b.song_request, 200),
    plus_one: plusOne,
  };
  // Overwrite the invitation itself — never a second row for the same household.
  const { error } = await updateGuest(db, invite.id, {
    ...row, code: canonical, source: "RSVP form", approved, created_at: new Date().toISOString(), viewed_at: new Date().toISOString(),
  });
  if (error) {
    console.error("guests update failed:", error.message);
    return NextResponse.json({ error: "RSVP is not reachable right now — please try again." }, { status: 503 });
  }

  await sendRsvpEmail({
    ...row,
    approval: approved ? `code ${canonical} — auto-approved (${whoIsItFor(invite)})` : `code ${canonical} — NEEDS REVIEW (party of ${pax})`,
  });
  return NextResponse.json({ ok: true, saved: true, emailed: true, approved, code: canonical, household: whoIsItFor(invite), paxMax });
}
