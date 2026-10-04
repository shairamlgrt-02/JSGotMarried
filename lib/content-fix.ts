import type { TableName } from "./types";

/**
 * One-off wording repairs, applied on the way in.
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
 * Add a line here whenever a phrase the couple may already have saved is renamed in the code.
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
  if (!fields) return { rows, patches: [] };
  const out: T[] = [];
  const patches: RowPatch[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") { out.push(row); continue; }
    const source = row as Record<string, unknown>;
    const next = { ...source };
    let changed: Record<string, unknown> | null = null;
    for (const field of fields) {
      const before = source[field];
      if (before === undefined) continue;
      const after = renewValue(before);
      // simple scalars and short string arrays only — the base64 photo fields are never touched
      if (JSON.stringify(after) !== JSON.stringify(before)) {
        next[field] = after;
        (changed ||= {})[field] = after;
      }
    }
    out.push(next as T);
    if (changed && typeof row.id === "string") patches.push({ id: row.id, fields: changed });
  }
  return { rows: out, patches };
}
