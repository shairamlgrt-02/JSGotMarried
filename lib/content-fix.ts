import { formatGuestTags, guestTagIdFor, parseGuestTags, type TableName } from "./types";

/**
 * One-off repairs to stored text, applied on the way in.
 *
 * The second hashtag was renamed **#JSWeDo → #JSSayIDo** in the code, but a project that was
 * seeded before the rename keeps the old words in its own rows forever: the site reads the
 * stored row (Supabase, or this browser's localStorage in demo mode) rather than the starter
 * data. So the couple would still read the old tag on the live site even though the code is right.
 *
 * `fixRows` modernises that text as it is read and hands back only the fields that changed, so
 * the caller can save them once — every surface (site, share preview, keepsake card, FAQ)
 * agrees from the next request on, without anyone touching SQL.
 *
 * Add a line to `RENAMES` whenever a phrase the couple may already have saved is renamed in the
 * code, and a case to `MIGRATIONS` whenever a field they filled in is replaced by a better one.
 */
const RENAMES: [RegExp, string][] = [
  // #JSWeDo (and the bare JSWeDo) is now #JSSayIDo
  [/\bJSWeDo\b/g, "JSSayIDo"],
];

/**
 * Fields the couple can type into. Guest-written columns (RSVP messages, dietary notes) are
 * deliberately left alone — those are the guests' own words, not our copy.
 */
const TEXT_FIELDS: Partial<Record<TableName, readonly string[]>> = {
  wedding_info: ["hashtags", "site_description", "instagram_note"],
  faq: ["question", "answer"],
  schedule: ["title", "detail"],
  story: ["title", "text"],
  attire: ["label", "notes"],
  entourage: ["role", "name", "title"],
  checklist: ["task"],
  vendors: ["name", "notes"],
  budget: ["category", "item"],
};

const renew = (value: string) => {
  let next = value;
  for (const [from, to] of RENAMES) next = next.replace(from, to);
  return next;
};

/** The single-category values an old guest row could hold, in the tag id each one became. */
const LEGACY_TAG_ID: Record<string, string> = {
  bride_family: "bride_family",
  groom_family: "groom_family",
  sponsor: "sponsors",
  entourage: "entourage",
  bride_friends: "bride_friends",
  groom_friends: "groom_friends",
  couple_friends: "couple_friends",
  work: "work",
  college_school: "college",
  childhood: "childhood",
  neighbor: "neighbours",
  neighbours: "neighbours",
  online: "online",
  vip: "vip",
};

/**
 * Field migrations — same shape as a rename, one field wider.
 *
 * `guests.category` held exactly one group per household; `guests.tags` holds several. A project
 * saved before the change still has its groups in the old column and nothing in the new one, so
 * the first read copies the value across and the caller writes it back once: every group already
 * assigned survives, and the couple can stack more beside it. A row that has tags is left alone
 * and `category` is never cleared, so this is a copy rather than a move — safe to read a hundred
 * times, and nothing is lost if the binder is mid-edit when it runs.
 */
const MIGRATIONS: Partial<Record<TableName, (row: Record<string, unknown>) => Record<string, unknown> | null>> = {
  guests: (row) => {
    const old = typeof row.category === "string" ? row.category.trim() : "";
    if (!old || parseGuestTags(row.tags as string | null | undefined).length) return null;
    // A value this file has never seen (a hand-edited row, a label typed into the old column)
    // still lands on the tag it reads like, or is skipped rather than guessed at.
    const tagId = LEGACY_TAG_ID[old] ?? guestTagIdFor(old);
    return tagId ? { tags: formatGuestTags([tagId]) } : null;
  },
};

const renewValue = (value: unknown): unknown => {
  if (typeof value === "string") return renew(value);
  if (Array.isArray(value)) return value.map(renewValue);
  return value;
};

/** What to write back: the row's id and only the fields whose text was old. */
export type RowPatch = { id: string; fields: Record<string, unknown> };
export type FixedRows<T> = { rows: T[]; patches: RowPatch[] };

export function fixRows<T extends { id?: string }>(table: TableName, rows: T[]): FixedRows<T> {
  const fields = TEXT_FIELDS[table];
  const migrate = MIGRATIONS[table];
  if (!fields && !migrate) return { rows, patches: [] };
  const out: T[] = [];
  const patches: RowPatch[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") { out.push(row); continue; }
    const source = row as Record<string, unknown>;
    const next = { ...source };
    let changed: Record<string, unknown> | null = null;
    for (const field of fields ?? []) {
      const before = source[field];
      if (before === undefined) continue;
      const after = renewValue(before);
      // simple scalars and short string arrays only — the base64 photo fields are never touched
      if (JSON.stringify(after) !== JSON.stringify(before)) {
        next[field] = after;
        (changed ||= {})[field] = after;
      }
    }
    if (migrate) {
      const moved = migrate(source);
      if (moved) {
        Object.assign(next, moved);
        Object.assign((changed ||= {}), moved);
      }
    }
    out.push(next as T);
    if (changed && typeof row.id === "string") patches.push({ id: row.id, fields: changed });
  }
  return { rows: out, patches };
}
