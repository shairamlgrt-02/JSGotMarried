import type { Guest } from "./types";

/**
 * A guest row is a *reply* once `approved` is set (true = confirmed, false = waiting for the
 * couple's review). Before that it is the plain invitation row the couple typed by hand —
 * name, phone and how many seats the household is invited to.
 */
export const isReply = (g: { approved?: boolean | null }) => g.approved !== null && g.approved !== undefined;

export type HouseholdMerge = { keep: Guest; drop: Guest[] };

/**
 * Every row sharing one invitation code is the same household. Older builds wrote the reply
 * as a *second* row with the same code, which doubled the guest list; `planHouseholdMerges`
 * finds those groups and decides which row survives: the reply when there is one (it holds
 * the guest's actual answer), otherwise the newest row.
 */
export function planHouseholdMerges(rows: Guest[]): HouseholdMerge[] {
  const byCode = new Map<string, Guest[]>();
  for (const g of rows) {
    const code = (g.code || "").trim().toUpperCase();
    if (!code) continue;
    const group = byCode.get(code) || [];
    group.push(g);
    byCode.set(code, group);
  }
  const plans: HouseholdMerge[] = [];
  for (const group of byCode.values()) {
    if (group.length < 2) continue;
    const newestFirst = [...group].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    const keep = newestFirst.find(isReply) ?? newestFirst[0];
    plans.push({ keep, drop: newestFirst.filter((g) => g.id !== keep.id) });
  }
  return plans;
}

/**
 * Fold the household's leftover rows into the survivor: the kept row wins on every value it
 * already has, and anything it left blank (a phone, a dietary note, the plus-one's name…) is
 * rescued from the rows being merged away.
 */
export function mergeHousehold(keep: Guest, others: Guest[]): Guest {
  return others.reduce((acc, g) => {
    const patch: Partial<Guest> = {};
    for (const k of ["name", "phone", "dietary", "message", "song_request", "plus_one"] as const)
      if (!acc[k] && g[k]) patch[k] = g[k];
    if (acc.attending === "pending" && g.attending !== "pending") patch.attending = g.attending;
    if (!acc.pax && g.pax) patch.pax = g.pax;
    return { ...acc, ...patch };
  }, { ...keep });
}
