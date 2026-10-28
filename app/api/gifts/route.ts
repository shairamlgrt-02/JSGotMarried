import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { SEED } from "@/lib/seed";
import { serverSupabase } from "@/lib/supabase-server";
import { DEFAULT_REGISTRY_NOTE, type GiftItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const isMissingTable = (message: string) =>
  /Could not find the table|relation .* does not exist|schema cache/i.test(message);
const isMissingColumn = (message: string) =>
  /column|does not exist|schema cache|Could not find/i.test(message);

type Db = NonNullable<ReturnType<typeof serverSupabase>>;

/** The public board: ordered gifts (seed fallback for a fresh/not-yet-migrated project) + the note. */
async function readBoard(db: Db) {
  const giftRes = await db.from("gift_items").select("*").order("order", { ascending: true });
  let items: GiftItem[];
  if (giftRes.error) {
    if (isMissingTable(giftRes.error.message)) items = SEED.gift_items as GiftItem[];
    else throw giftRes.error;
  } else {
    items = (giftRes.data ?? []) as GiftItem[];
    if (!items.length) items = SEED.gift_items as GiftItem[];
  }

  // The transfer details are deliberately served HERE, on the public registry endpoint, even
  // though the generic data API keeps them sealed (lib/invite-gate.ts): the couple chooses to
  // print them on /gifts, and this route hands back nothing else from wedding_info.
  let note = "";
  let benefit = "";
  let iban = "";
  type InfoRow = { registry_note?: string; benefitpay_number?: string; benefitpay_iban?: string };
  let infoData: InfoRow | null = null;
  const fullRes = await db
    .from("wedding_info")
    .select("registry_note, benefitpay_number, benefitpay_iban")
    .eq("id", "main")
    .maybeSingle();
  if (!fullRes.error) {
    infoData = (fullRes.data as InfoRow) ?? null;
  } else if (isMissingColumn(fullRes.error.message)) {
    // A database that hasn't re-run schema.sql yet lacks registry_note. Retry with just the
    // transfer columns so one missing newer column can never blank the saved BenefitPay details
    // (this is what made the card disappear from the page a few seconds after first paint).
    const legacyRes = await db
      .from("wedding_info")
      .select("benefitpay_number, benefitpay_iban")
      .eq("id", "main")
      .maybeSingle();
    if (!legacyRes.error) infoData = (legacyRes.data as InfoRow) ?? null;
    else if (!isMissingColumn(legacyRes.error.message)) throw legacyRes.error;
  } else {
    throw fullRes.error;
  }
  if (infoData) {
    note = String(infoData.registry_note || "");
    benefit = String(infoData.benefitpay_number || "").trim();
    iban = String(infoData.benefitpay_iban || "").trim();
  }
  return { items, note: note || DEFAULT_REGISTRY_NOTE, benefit, iban };
}

/**
 * GET /api/gifts — public, invite-code free: the registry is meant for every guest.
 * Add ?light=1 for the live polling loop: only claim state comes back (no notes, pictures or
 * transfer details), so boards with uploaded photos stay cheap to refresh every few seconds.
 */
export async function GET(req: Request) {
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });
  try {
    const light = new URL(req.url).searchParams.get("light") === "1";
    if (light) {
      const res = await db
        .from("gift_items")
        .select("id, claimed, claimed_by, claimed_at, \"order\"")
        .order("order", { ascending: true });
      if (res.error) {
        if (isMissingTable(res.error.message)) return NextResponse.json({ items: [] });
        throw res.error;
      }
      return NextResponse.json({ items: res.data ?? [] });
    }
    return NextResponse.json(await readBoard(db));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/gifts
 *  · { action: "claim", id, name }   — guest marks a gift bought. The `claimed = false` guard in
 *    the WHERE clause settles two-guest races: only one update can win, the loser gets 409.
 *  · { action: "release", id }       — puts a gift back (the UI only offers it for same-device
 *    claims, and the binder can release any of them).
 *  · { action: "note", note }        — binder only; edits the public monetary-gift wording.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = clip(b.action, 20);
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });

  if (action === "note") {
    const authed = await isAuthed(cookies().get(COOKIE)?.value);
    if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const note = clip(b.note, 600);
    const { error } = await db.from("wedding_info").update({ registry_note: note }).eq("id", "main");
    if (error) {
      if (isMissingColumn(error.message))
        return NextResponse.json(
          {
            error:
              "This Supabase project is missing the registry_note column. In Supabase → SQL Editor, run the latest supabase/schema.sql, then try again.",
          },
          { status: 409 },
        );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, note: note || DEFAULT_REGISTRY_NOTE });
  }

  if (action === "claim") {
    const id = clip(b.id, 80);
    if (!id) return NextResponse.json({ error: "A gift id is required." }, { status: 400 });
    const name = clip(b.name, 120);
    const { data, error } = await db
      .from("gift_items")
      .update({ claimed: true, claimed_by: name, claimed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("claimed", false)
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || !data.length) {
      // Zero rows: unknown id, or someone else won the claim in the last moment.
      const existing = await db.from("gift_items").select("*").eq("id", id).maybeSingle();
      if (!existing.data) return NextResponse.json({ error: "That gift is no longer on the list." }, { status: 404 });
      const row = existing.data as GiftItem;
      return NextResponse.json(
        { error: row.claimed_by ? `“${row.title}” was just bought by ${row.claimed_by}.` : `“${row.title}” was just bought by someone else.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, item: data[0] });
  }

  if (action === "release") {
    const id = clip(b.id, 80);
    if (!id) return NextResponse.json({ error: "A gift id is required." }, { status: 400 });
    const { data, error } = await db
      .from("gift_items")
      .update({ claimed: false, claimed_by: "", claimed_at: null })
      .eq("id", id)
      .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || !data.length) return NextResponse.json({ error: "That gift is no longer on the list." }, { status: 404 });
    return NextResponse.json({ ok: true, item: data[0] });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
