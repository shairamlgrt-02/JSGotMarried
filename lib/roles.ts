import type { Guest } from "./types";

/**
 * The one dictionary of day-of roles — the small jobs the couple entrust to their own guests on
 * the wedding day (the coffee & tea station, the souvenir table, the ushers…). Every surface reads
 * this: the binder's Guest Roles tab, its suggested-role picker, the "message this team" jump into
 * the messaging module and the {role} merge tag — so a label changes in one place.
 *
 * A household carries exactly one role, stored on `guests.role` as a preset id (or the couple's
 * own words, which then *are* the id — the same trick the guest tags use, so nothing needs a table
 * of its own and a custom role is filterable and messageable like any other).
 */
export const DAY_ROLES = {
  usher:         { label: "Ushers & Seating",       icon: "❦", brief: "Welcome guests at the majlis, walk them to their seats and mind the reserved rows." },
  registration:  { label: "Registration & Guestbook", icon: "✎", brief: "The first smile guests see — check names off the list and point the way." },
  coffee_tea:    { label: "Coffee & Tea Station",   icon: "☕", brief: "Set up, refill and keep the coffee & tea corner warm and stocked all evening." },
  snacks:        { label: "Snacks & Refreshments",  icon: "◍", brief: "Serve the welcome snacks at the majlis and keep the tables tidy and full." },
  serveware:     { label: "Serveware & Table Setup", icon: "皿", brief: "Cups, glasses, plates and the cake table — set them out and keep them coming." },
  souvenirs:     { label: "Souvenirs & Tokens",     icon: "❁", brief: "Run the souvenir table and make sure every guest leaves with theirs." },
  decor:         { label: "Décor & Setup Team",     icon: "✿", brief: "Chiffon, aisle pieces, signs — the styling, and the hall walk-in at 4:00 PM." },
  sound_media:   { label: "Sound & Media Support",  icon: "♫", brief: "Mics, playlist, projector and the livestream — keep it all playing." },
  games:         { label: "Games & Giveaways",      icon: "✧", brief: "Run the reception games, scratch cards and raffle, right beside the MC." },
  photo_point:   { label: "Photo Moments",          icon: "◎", brief: "Gather groups for photos, mind the shot list and keep the couple moving." },
  kids:          { label: "Kids' Corner Keeper",    icon: "☘", brief: "Eyes on the little ones — activities, snacks and happy endings." },
  parking:       { label: "Parking & Directions",   icon: "⌂", brief: "Point the cars to the separate parking area and every guest to the majlis." },
  floater:       { label: "All-Around Runner",      icon: "✚", brief: "The floating helper: anything needed, anywhere, with a smile." },
  prayer:        { label: "Prayer Partner",         icon: "✝", brief: "Covers the whole day in prayer — the quietest role, and the closest to us." },
} as const;

export type DayRoleId = keyof typeof DAY_ROLES;

/** The preset ids, in display order. Custom roles (the couple's own words) are not in here. */
export const DAY_ROLE_IDS = Object.keys(DAY_ROLES) as DayRoleId[];

/** Is this a preset, or a role the couple typed themselves? */
export const isPresetDayRole = (id: string): id is DayRoleId =>
  Object.prototype.hasOwnProperty.call(DAY_ROLES, id);

/** Preset roles read "Coffee & Tea Station"; a custom role shows the words that were typed. */
export function dayRoleLabel(id: string | null | undefined): string {
  if (!id) return "";
  return isPresetDayRole(id) ? DAY_ROLES[id].label : id;
}
export function dayRoleIcon(id: string | null | undefined): string {
  if (!id) return "";
  return isPresetDayRole(id) ? DAY_ROLES[id].icon : "◇";
}
export function dayRoleBrief(id: string | null | undefined): string {
  if (!id) return "";
  return isPresetDayRole(id) ? DAY_ROLES[id].brief : "";
}

/**
 * Text typed into the role picker → the value to store. Something that already exists as a preset
 * is matched case-insensitively (so "coffee & tea station" joins ☕ Coffee & Tea Station); anything
 * else keeps its own words, single-spaced — the same behaviour the guest tags have.
 */
export function dayRoleIdFor(text: string): string {
  const wanted = text.trim().replace(/\s+/g, " ");
  if (!wanted) return "";
  const key = wanted.toLowerCase();
  return DAY_ROLE_IDS.find((id) => id === key || DAY_ROLES[id].label.toLowerCase() === key) ?? wanted;
}

/** This household's role (or blank), read safely off a guest row. */
export function guestRole(g: Guest): string {
  return (g.role || "").trim();
}

/** Group households by their role, in dictionary order first, then the couple's own alphabetically. */
export function groupGuestsByRole(guests: Guest[]): { role: string; households: Guest[] }[] {
  const groups = new Map<string, Guest[]>();
  for (const g of guests) {
    const role = guestRole(g);
    if (!role) continue;
    if (!groups.has(role)) groups.set(role, []);
    groups.get(role)!.push(g);
  }
  const rank = (id: string) => DAY_ROLE_IDS.indexOf(id as DayRoleId);
  return [...groups.entries()]
    .sort((a, b) => {
      const ia = rank(a[0]), ib = rank(b[0]);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return dayRoleLabel(a[0]).localeCompare(dayRoleLabel(b[0]));
    })
    .map(([role, households]) => ({ role, households }));
}
