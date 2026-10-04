/**
 * Server-side half of the invitation gate, shared by /api/rsvp (opening a personal link) and
 * /api/data (deciding what a sealed visitor may read). No browser APIs in here — route handlers
 * import it directly.
 */
import { codeCandidates, codeMatches, cleanCode, DEMO_CODE, isReply } from "./guests";
import type { Guest } from "./types";

/**
 * The slice of the Supabase client these helpers need. Typed loosely on purpose: the real
 * client arrives from lib/supabase-server and its generics add nothing to a two-column update.
 */
type Db = { from: (table: string) => any };

export type CodeMatch =
  | { kind: "found"; code: string; rows: Guest[] }
  | { kind: "ambiguous"; codes: string[] }
  | { kind: "none" };

/**
 * Resolve whatever a guest typed — the whole code, the last four characters of their link,
 * lowercase, with a space in it — to one household. Ambiguity is refused rather than guessed:
 * two households answering to "7KQF" would mean replying on the wrong row.
 */
export async function matchCode(db: Db, input: string): Promise<CodeMatch> {
  const raw = cleanCode(input);
  if (!raw) return { kind: "none" };
  if (raw === DEMO_CODE) return { kind: "found", code: DEMO_CODE, rows: [] };

  const wanted = codeCandidates(raw);
  const { data } = await db.from("guests").select("*").in("code", wanted);
  const direct = (data ?? []) as Guest[];
  if (direct.length) return { kind: "found", code: cleanCode(direct[0].code || raw), rows: direct };

  // No exact hit: let the tail of a code answer too ("7KQF" → "JS-7KQF").
  const all = await db.from("guests").select("code");
  const codes = Array.from(new Set(((all.data ?? []) as { code?: string }[]).map((r) => cleanCode(r.code || "")).filter(Boolean)));
  const hits = codes.filter((c) => codeMatches(c, raw));
  if (!hits.length) return { kind: "none" };
  if (hits.length > 1) return { kind: "ambiguous", codes: hits };
  const one = await db.from("guests").select("*").eq("code", hits[0]);
  return { kind: "found", code: hits[0], rows: (one.data ?? []) as Guest[] };
}

/** Is this string a code the couple actually issued? (used to unlock the private pages) */
export async function codeIsIssued(db: Db, input: string): Promise<boolean> {
  const raw = cleanCode(input);
  if (!raw) return false;
  if (raw === DEMO_CODE) return true;
  const { data } = await db.from("guests").select("code").in("code", codeCandidates(raw));
  if ((data ?? []).length) return true;
  const all = await db.from("guests").select("code");
  return ((all.data ?? []) as { code?: string }[]).some((r) => codeMatches(r.code || "", raw));
}

/**
 * What a sealed visitor may NOT read, even though the table itself is public:
 *  · wedding_info — the venue's name, address and both map links are blanked, and the budget,
 *    so "hiding the venue section" is real at the API and not just CSS;
 *  · schedule / faq — the programme and the FAQ are the private pages, so they come back empty.
 * The binder (admin cookie) and any request carrying an issued code skip all of this.
 */
export const SEALED_BLANK_FIELDS = ["venue_name", "venue_address", "venue_map_link", "venue_map_embed", "total_budget"] as const;
export const SEALED_EMPTY_TABLES = ["schedule", "faq"] as const;

export function redactSealed(table: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if ((SEALED_EMPTY_TABLES as readonly string[]).includes(table)) return [];
  if (table !== "wedding_info") return rows;
  return rows.map((r) => {
    const out = { ...r };
    for (const f of SEALED_BLANK_FIELDS) out[f] = f === "total_budget" ? 0 : "";
    return out;
  });
}

/**
 * Ledger columns that only exist once the newest `supabase/schema.sql` has been run on the
 * project. An older database must still take RSVPs, so these are written first and dropped
 * quietly if Postgres says the column isn't there yet.
 */
export const OPTIONAL_GUEST_COLS = ["note", "sent_at", "viewed_at"] as const;

const isColumnError = (e: unknown) => /column|does not exist|schema cache|Could not find/i.test(String((e as { message?: unknown })?.message ?? e ?? ""));

/** Update one guest row, forgiving a database that hasn't caught up with the new columns. */
export async function updateGuest(db: Db, id: string, values: Record<string, unknown>): Promise<{ error: { message: string } | null }> {
  const first = await db.from("guests").update(values).eq("id", id);
  if (!first?.error) return { error: null };
  if (!isColumnError(first.error)) return { error: first.error };
  const lite = { ...values };
  for (const k of OPTIONAL_GUEST_COLS) delete lite[k];
  const again = await db.from("guests").update(lite).eq("id", id);
  return { error: again?.error ?? null };
}

/** Stamp "the guest opened their link" so the Invite codes tab can show `opened` vs `sent`. */
export async function markViewed(db: Db, code: string, rows: Guest[]): Promise<void> {
  if (!code || code === DEMO_CODE) return;
  // only an unanswered household is stamped — an answered one already reads as filled
  const open = rows.find((r) => !isReply(r));
  if (!open?.id || open.viewed_at) return;
  try {
    await updateGuest(db, open.id, { viewed_at: new Date().toISOString() });
  } catch { /* the ledger is a nicety — never fail the invitation over it */ }
}
