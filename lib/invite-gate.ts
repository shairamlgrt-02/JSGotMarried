/**
 * Server-side half of the invitation gate, shared by /api/rsvp (opening a personal link) and
 * /api/data (deciding what a sealed visitor may read). No browser APIs in here — route handlers
 * import it directly.
 */
import { codeCandidates, codeMatches, cleanCode, DEMO_CODE, isReply, whoIsItFor } from "./guests";
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

const issuedCodeCache = new Map<string, { ok: boolean; expires: number }>();
const CODE_CACHE_TTL_MS = 60_000;

export function invalidateIssuedCodeCache() {
  issuedCodeCache.clear();
}

/** Is this string a code the couple actually issued? (used to unlock the private pages) */
export async function codeIsIssued(db: Db, input: string): Promise<boolean> {
  const raw = cleanCode(input);
  if (!raw) return false;
  if (raw === DEMO_CODE) return true;
  const cached = issuedCodeCache.get(raw);
  if (cached && Date.now() < cached.expires) return cached.ok;

  const { data } = await db.from("guests").select("code").in("code", codeCandidates(raw));
  if ((data ?? []).length) {
    issuedCodeCache.set(raw, { ok: true, expires: Date.now() + CODE_CACHE_TTL_MS });
    return true;
  }
  const all = await db.from("guests").select("code");
  const ok = ((all.data ?? []) as { code?: string }[]).some((r) => codeMatches(r.code || "", raw));
  issuedCodeCache.set(raw, { ok, expires: Date.now() + CODE_CACHE_TTL_MS });
  return ok;
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
 * Best-effort activity timestamps. RSVP writes and invite-label/note edits must not be silently
 * discarded; only these timestamps may be omitted on older databases.
 */
export const OPTIONAL_GUEST_COLS = ["sent_at", "viewed_at"] as const;
export const OPTIONAL_MESSAGE_COLS = ["opened_at"] as const;

const isColumnError = (e: unknown) => /column|does not exist|schema cache|Could not find/i.test(String((e as { message?: unknown })?.message ?? e ?? ""));

const recentOpens = new Map<string, number>();
const OPEN_COOLDOWN_MS = 30_000;

function allowOpenStamp(key: string): boolean {
  if (!key) return false;
  const now = Date.now();
  const prev = recentOpens.get(key);
  if (prev && now - prev < OPEN_COOLDOWN_MS) return false;
  if (recentOpens.size > 500) {
    for (const [k, ts] of Array.from(recentOpens.entries())) {
      if (now - ts >= OPEN_COOLDOWN_MS) recentOpens.delete(k);
    }
  }
  recentOpens.set(key, now);
  return true;
}

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

/** Update one message row, forgiving a database without the newer `opened_at` column. */
async function updateMessageRow(db: Db, id: string, values: Record<string, unknown>): Promise<void> {
  const first = await db.from("messages").update(values).eq("id", id);
  if (!first?.error) return;
  if (!isColumnError(first.error)) return;
  const lite = { ...values };
  for (const k of OPTIONAL_MESSAGE_COLS) delete lite[k];
  await db.from("messages").update(lite).eq("id", id);
}

/** Upsert one message row, forgiving a database without the newer `opened_at` column. */
async function upsertMessageRow(db: Db, row: Record<string, unknown>): Promise<void> {
  const first = await db.from("messages").upsert(row);
  if (!first?.error) return;
  if (!isColumnError(first.error)) return;
  const lite = { ...row };
  for (const k of OPTIONAL_MESSAGE_COLS) delete lite[k];
  await db.from("messages").upsert(lite);
}

/** Stamp "the guest opened their link" on every visit so fresh timestamps are always recorded. */
export async function markViewed(db: Db, code: string, rows: Guest[]): Promise<void> {
  if (!code || code === DEMO_CODE) return;
  const target = rows.find((r) => !isReply(r)) ?? rows[0];
  if (!target?.id) return;
  if (!allowOpenStamp(`guest:${target.id}`)) return;
  try {
    await updateGuest(db, target.id, { viewed_at: new Date().toISOString() });
  } catch { /* the ledger is a nicety — never fail the invitation over it */ }
}

/**
 * Stamp a link open against:
 *  1) the specific Compose message when `?m=…` is present, OR
 *  2) any sent Compose message for this household, OR
 *  3) an automatic per-link tracker row (`link_rsvp_<id>` / `link_invite_<id>`) when the couple
 *     distributed plain `https://…/JS-XXXX#rsvp` or `https://…/JS-XXXX` links directly!
 */
export async function markMessageOpened(
  db: Db,
  opts: {
    messageId?: string;
    guest?: Guest;
    guestId?: string;
    code?: string;
    via?: "rsvp" | "invite";
    origin?: string;
  },
): Promise<void> {
  const msgId = String(opts.messageId ?? "").trim();
  const guest = opts.guest;
  const guestId = String(opts.guestId ?? guest?.id ?? "").trim();
  const via = opts.via === "rsvp" ? "rsvp" : "invite";
  const guardKey = msgId ? `msg:${msgId}` : guestId ? `msg-guest:${guestId}:${via}` : "";
  if (!allowOpenStamp(guardKey)) return;

  const now = new Date().toISOString();
  try {
    if (msgId) {
      const { data } = await db.from("messages").select("id, link_opens").eq("id", msgId);
      const hit = ((data ?? []) as { id: string; link_opens?: number }[])[0];
      if (hit?.id) {
        await updateMessageRow(db, hit.id, { link_opens: (Number(hit.link_opens) || 0) + 1, opened_at: now });
        return;
      }
    }
    if (guestId) {
      const { data } = await db.from("messages").select("*").eq("recipient_id", `gst_${guestId}`);
      const allForGuest = (data ?? []) as {
        id: string;
        body?: string;
        original_body?: string;
        link_opens?: number;
        sent?: boolean;
        created_at?: string;
      }[];
      const sentRows = allForGuest
        .filter((r) => r.sent && !r.id.startsWith("link_"))
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      const matchingKindRows =
        via === "rsvp"
          ? sentRows.filter((r) => /#rsvp\b/i.test(r.body || "") || /\{rsvp_link\}/i.test(r.original_body || ""))
          : sentRows;
      if (matchingKindRows.length) {
        const unopened = matchingKindRows.filter((r) => !(Number(r.link_opens) > 0));
        const targets = unopened.length ? unopened : [matchingKindRows[0]];
        await Promise.all(
          targets.map((r) => updateMessageRow(db, r.id, { link_opens: (Number(r.link_opens) || 0) + 1, opened_at: now })),
        );
        return;
      }

      // Create/update an automatic link-open record specifically distinguishing `#rsvp` vs plain `/JS-XXXX`!
      const autoId = `link_${via}_${guestId}`;
      const existingAuto = allForGuest.find((r) => r.id === autoId);
      if (existingAuto) {
        await updateMessageRow(db, autoId, {
          link_opens: (Number(existingAuto.link_opens) || 0) + 1,
          opened_at: now,
          created_at: now,
        });
      } else if (guest) {
        const canonical = cleanCode(opts.code || guest.code || "");
        const base = opts.origin || "";
        const fullLink = canonical ? `${base}/${canonical}${via === "rsvp" ? "#rsvp" : ""}` : base;
        await upsertMessageRow(db, {
          id: autoId,
          template_id: via === "rsvp" ? "distributed_rsvp_link" : "distributed_invite_link",
          template_name: via === "rsvp" ? "RSVP Link (#rsvp)" : "Invitation Link",
          original_body: "",
          body: fullLink,
          recipient_id: `gst_${guestId}`,
          recipient_name: whoIsItFor(guest) || guest.name || canonical,
          recipient_phone: guest.phone || "",
          category: via === "rsvp" ? "RSVP Link (#rsvp)" : "Invitation Link",
          sent: true,
          responded: isReply(guest) || guest.attending !== "pending",
          link_opens: 1,
          opened_at: now,
          sent_at: guest.sent_at || guest.created_at || now,
          created_at: now,
        });
      }
    }
  } catch { /* never fail the invitation page if `messages` hasn't been created yet */ }
}

/** When a household replies via RSVP, reflect their reply on any Compose messages sent to them. */
export async function markMessagesResponded(db: Db, guestId: string): Promise<void> {
  if (!guestId) return;
  const now = new Date().toISOString();
  try {
    const { data } = await db.from("messages").select("*").eq("recipient_id", `gst_${guestId}`);
    const rows = ((data ?? []) as { id: string; link_opens?: number; responded?: boolean; opened_at?: string | null }[])
      .filter((r) => !r.responded);
    await Promise.all(
      rows.map((r) =>
        updateMessageRow(db, r.id, {
          responded: true,
          link_opens: Math.max(1, Number(r.link_opens) || 0),
          opened_at: r.opened_at || now,
        }),
      ),
    );
  } catch { /* never block RSVP submission */ }
}
