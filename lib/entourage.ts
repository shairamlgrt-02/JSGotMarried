import type { EntourageMember, EntourageRole } from "./types";

/**
 * The order the entourage stands in on the site, with the heading each group is printed
 * under. Groomsmen stand after the Best Man and before the Ring Bearer; Bridesmaids after
 * the Maid of Honor and before the Flower Girl; the honoured guests come last, in two
 * columns. The binder groups people exactly the same way, so both always agree.
 */
export const ENTOURAGE_ORDER: { role: EntourageRole; heading: string }[] = [
  { role: "groom_family", heading: "Parents of the Groom" },
  { role: "bride_family", heading: "Parents of the Bride" },
  { role: "sponsor", heading: "Principal Sponsors" },
  { role: "best_man", heading: "Best Man" },
  { role: "groomsman", heading: "Groomsmen" },
  { role: "maid_of_honor", heading: "Maid of Honor" },
  { role: "bridesmaid", heading: "Bridesmaids" },
  { role: "ring_bearer", heading: "Ring Bearer" },
  { role: "flower_girl", heading: "Flower Girl" },
  { role: "honored_guest", heading: "Our Honoured Guests" },
  { role: "other", heading: "With Love" },
];

/** The heading a role is printed under — on the site and in the binder. */
export function entourageHeading(role: EntourageRole): string {
  return ENTOURAGE_ORDER.find((g) => g.role === role)?.heading ?? "With Love";
}

export type EntourageGroup = { role: EntourageRole; heading: string; people: EntourageMember[] };

/**
 * Group the entourage by role, in the order they stand on the site, keeping each person's
 * own `order` inside their group. Every role is a category: as many Principal Sponsors,
 * Groomsmen or Bridesmaids as you like share one heading. Anyone whose role isn't listed
 * above still shows up, gathered at the end under "With Love".
 */
export function entourageGroups(people: EntourageMember[]): EntourageGroup[] {
  const groups: EntourageGroup[] = ENTOURAGE_ORDER.map(({ role, heading }) => ({
    role,
    heading,
    people: people.filter((p) => p.role === role).sort((a, b) => a.order - b.order),
  })).filter((g) => g.people.length > 0);
  const known = new Set(ENTOURAGE_ORDER.map((g) => g.role));
  const strays = people.filter((p) => !known.has(p.role)).sort((a, b) => a.order - b.order);
  if (strays.length) groups.push({ role: "other", heading: "With Love", people: strays });
  return groups;
}
