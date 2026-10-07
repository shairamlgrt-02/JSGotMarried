import type { Guest, WeddingInfo, EntourageMember, Vendor, MessageTemplate, MessageLog } from "./types";
import { GUEST_TAGS, GUEST_TAG_IDS, guestTagIcon, guestTagLabel, parseGuestTags } from "./types";

/* ─── Recipient groups ─── */
/**
 * Every group the couple can address a message to. Each one resolves to people from one or more
 * data sources — guest tags (from `guests.tags`), RSVP status (also the guests table), entourage
 * roles, or vendors.
 */
export type RecipientSource =
  | "entourage" | "vendor"
  | "all_guests" | "pending_rsvp" | "opened_no_rsvp" | "confirmed_yes" | "confirmed_no"
  | "guest_tag";

export interface MessageCategory {
  id: string;
  label: string;
  icon: string;
  source: RecipientSource;
  /** For entourage: the role value. For vendor: the type string. For guest_tag: the tag id. */
  filter: string;
}

/**
 * A guest tag's group id, in the compose picker and in saved templates. The `guest_` prefix is
 * kept from before multi-tag so templates written against a single category still point at
 * something real.
 */
export const guestTagCategoryId = (tagId: string) => `guest_${tagId}`;

/** Households with no tag at all — its own bucket, so a chase list is one click away. */
export const UNGTAGGED_CATEGORY: MessageCategory = {
  id: "guest_untagged", label: "Untagged", icon: "·", source: "guest_tag", filter: "",
};

/** The guest tags, straight from the shared dictionary — the binder's chips and these are the same list. */
export const GUEST_TAG_CATEGORIES: MessageCategory[] = GUEST_TAG_IDS.map((tagId) => ({
  id: guestTagCategoryId(tagId),
  label: GUEST_TAGS[tagId].label,
  icon: GUEST_TAGS[tagId].icon,
  source: "guest_tag" as RecipientSource,
  filter: tagId,
}));

export const MESSAGE_CATEGORIES: MessageCategory[] = [
  // ── Guest tags (guests.tags) — a household can carry several, and appears in each one ──
  ...GUEST_TAG_CATEGORIES,
  UNGTAGGED_CATEGORY,
  // ── RSVP status (auto-resolved from the guests table) ──
  { id: "pending_rsvp",     label: "Pending RSVP",        icon: "⏳", source: "pending_rsvp", filter: "" },
  { id: "opened_no_rsvp",   label: "Opened Link · No Reply", icon: "👀", source: "opened_no_rsvp", filter: "" },
  { id: "confirmed_yes",    label: "Confirmed (Yes)",     icon: "✓", source: "confirmed_yes", filter: "" },
  { id: "confirmed_no",     label: "Declined (No)",       icon: "✗", source: "confirmed_no", filter: "" },
  // ── Entourage roles that are not guest tags (the children in the procession) ──
  { id: "ring_bearer",      label: "Ring Bearer",         icon: "◯", source: "entourage", filter: "ring_bearer" },
  { id: "flower_girl",      label: "Flower Girl",         icon: "❀", source: "entourage", filter: "flower_girl" },
  // ── Vendors ──
  { id: "band_dj",          label: "Band / DJ",           icon: "♫", source: "vendor", filter: "band_dj" },
  { id: "caterers",         label: "Caterers",            icon: "◈", source: "vendor", filter: "catering" },
  { id: "venue",            label: "Venue",               icon: "⌂", source: "vendor", filter: "venue" },
  { id: "vendors",          label: "All Vendors",         icon: "◇", source: "vendor", filter: "" },
  { id: "p_v",              label: "Photo / Video",       icon: "◎", source: "vendor", filter: "p/v" },
  { id: "coordinator",      label: "Coordinator",         icon: "◉", source: "vendor", filter: "coordinator" },
  { id: "hmua",             label: "HMUA",                icon: "✧", source: "vendor", filter: "hmua" },
  { id: "dress_tailor",     label: "Dress / Tailor",      icon: "✂", source: "vendor", filter: "dress_tailor" },
  // ── All guests (kept last, explicit "everyone on the guest list") ──
  { id: "wedding_guest",    label: "All Wedding Guests",  icon: "✉", source: "all_guests", filter: "" },
];

/**
 * Group ids that existed before tags replaced the single category, mapped to where they live now:
 * family, sponsors, honored guests and the wedding party stopped being entourage-only chips the
 * moment they became tags on the household, so a template saved against the old list still finds
 * its people instead of quietly resolving to nobody.
 */
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  // entourage-role chips → the tag they are now
  family_bride:    guestTagCategoryId("bride_family"),
  family_groom:    guestTagCategoryId("groom_family"),
  sponsor:         guestTagCategoryId("sponsors"),
  honored_guest:   guestTagCategoryId("honored"),
  bridesmaid:      guestTagCategoryId("bridesmaids"),
  groomsmen:       guestTagCategoryId("groomsmen"),
  maid_of_honor:   guestTagCategoryId("maid_of_honor"),
  best_man:        guestTagCategoryId("best_man"),
  // the old single-category ids, where the tag id itself changed
  guest_uncategorized: UNGTAGGED_CATEGORY.id,
  guest_sponsor:       guestTagCategoryId("sponsors"),
  guest_college_school: guestTagCategoryId("college"),
  guest_neighbor:      guestTagCategoryId("neighbours"),
  guest_neighbours:    guestTagCategoryId("neighbours"),
};

/**
 * One group by id — including a custom tag the couple typed in the binder, which is not in
 * `MESSAGE_CATEGORIES` and so gets its entry built here. That is what lets the Guests tab's
 * "📨 Message [tag]" jump address any tag, preset or not.
 */
export function messageCategoryFor(raw: string): MessageCategory | undefined {
  const id = LEGACY_CATEGORY_ALIASES[raw] ?? raw;
  const known = MESSAGE_CATEGORIES.find((c) => c.id === id);
  if (known) return known;
  if (!id.startsWith("guest_")) return undefined;
  const tagId = id.slice("guest_".length).trim();
  if (!tagId) return undefined;
  return { id, label: guestTagLabel(tagId), icon: guestTagIcon(tagId), source: "guest_tag", filter: tagId };
}

/* ─── Recipients ─── */
/** A resolved recipient for the messaging module — one row in the tracker. */
export interface Recipient {
  id: string;
  name: string;
  greetName: string;
  phone: string;
  role: string;
  category: string;
  code?: string;
  /** Whether an invitation link exists for this person. */
  inviteLink?: string;
  /** For guests: number of seats (pax). */
  pax?: number;
  /** For guests: plus-one name. */
  plusOne?: string;
  /** For guests: RSVP status. */
  rsvpStatus?: string;
}

/** Resolve the recipients for a set of groups from all data sources. */
export function resolveRecipients(
  categories: string[],
  entourage: EntourageMember[],
  vendors: Vendor[],
  guests: Guest[],
  info: WeddingInfo,
): Recipient[] {
  // Old template ids are followed to where the group lives now, and one group is only worked
  // once however many names pointed at it.
  const selected: MessageCategory[] = [];
  const chosen = new Set<string>();
  for (const raw of categories) {
    const cat = messageCategoryFor(raw);
    if (!cat || chosen.has(cat.id)) continue;
    chosen.add(cat.id);
    selected.push(cat);
  }
  const map = new Map<string, Recipient>();

  const base = typeof window !== "undefined" ? window.location.origin : "";

  for (const cat of selected) {
    if (cat.source === "entourage") {
      entourage
        .filter((e) => e.role === cat.filter)
        .forEach((e) => {
          const id = `ent_${e.id}_${cat.id}`;
          if (map.has(id)) return;
          map.set(id, {
            id,
            name: e.name,
            greetName: e.name.split(" ")[0],
            phone: "",
            role: e.title || roleLabel(e.role),
            category: cat.label,
          });
        });
    }
    if (cat.source === "vendor") {
      vendors
        .filter((v) => !cat.filter || v.type === cat.filter) // empty filter = all vendors
        .forEach((v) => {
          const id = `ven_${v.id}_${cat.id}`;
          if (map.has(id)) return;
          map.set(id, {
            id,
            name: v.name,
            greetName: v.name.split(" ")[0],
            phone: v.contact,
            role: v.type,
            category: cat.label,
          });
        });
    }
    if (
      cat.source === "all_guests" ||
      cat.source === "pending_rsvp" ||
      cat.source === "opened_no_rsvp" ||
      cat.source === "confirmed_yes" ||
      cat.source === "confirmed_no" ||
      cat.source === "guest_tag"
    ) {
      let filtered: Guest[];

      if (cat.source === "all_guests") {
        filtered = guests;
      } else if (cat.source === "pending_rsvp") {
        filtered = guests.filter((g) => g.attending === "pending");
      } else if (cat.source === "opened_no_rsvp") {
        filtered = guests.filter((g) => g.attending === "pending" && g.viewed_at);
      } else if (cat.source === "confirmed_yes") {
        filtered = guests.filter((g) => g.attending === "yes");
      } else if (cat.source === "confirmed_no") {
        filtered = guests.filter((g) => g.attending === "no");
      } else {
        // guest_tag — anyone whose tags contain the one asked for. An empty filter is the
        // untagged bucket: households with no tag at all.
        filtered = guests.filter((g) => {
          const tags = parseGuestTags(g.tags);
          return cat.filter ? tags.includes(cat.filter) : tags.length === 0;
        });
      }

      // One household is one recipient, however many groups led here — tick ♡ Bride's Family and
      // ✿ Bridesmaids and Aling Tess still gets a single message, carrying both labels.
      filtered.forEach((g) => {
        const id = `gst_${g.id}`;
        const seen = map.get(id);
        if (seen) {
          const roles = seen.role.split(" · ");
          if (!roles.includes(cat.label)) seen.role = [...roles, cat.label].join(" · ");
          return;
        }
        map.set(id, {
          id,
          name: g.greet || g.name || "Guest",
          greetName: (g.greet || g.name || "Guest").split(" ")[0],
          phone: g.phone,
          role: cat.label,
          category: cat.label,
          code: g.code,
          inviteLink: g.code ? `${base}/${g.code}` : "",
          pax: g.pax,
          plusOne: g.plus_one,
          rsvpStatus: g.attending === "yes" ? "Confirmed ✓" : g.attending === "no" ? "Declined ✗" : "Pending ⏳",
        });
      });
    }
  }
  return Array.from(map.values());
}

const ROLE_LABELS: Record<string, string> = {
  sponsor: "Principal Sponsor",
  bridesmaid: "Bridesmaid",
  groomsman: "Groomsman",
  maid_of_honor: "Maid of Honor",
  best_man: "Best Man",
  ring_bearer: "Ring Bearer",
  flower_girl: "Flower Girl",
  bride_family: "Bride's Family",
  groom_family: "Groom's Family",
  honored_guest: "Honored Guest",
  other: "Other",
};
function roleLabel(role: string) { return ROLE_LABELS[role] || role; }

/* ─── Merge tags ─── */
export interface MergeTag {
  tag: string;
  label: string;
  /** Short description for the tooltip. */
  hint: string;
}

export const MERGE_TAGS: MergeTag[] = [
  { tag: "{full_name}",      label: "Full Name",        hint: "Their full name or household greet" },
  { tag: "{first_name}",     label: "First Name",       hint: "Just the first name from their greet" },
  { tag: "{role}",           label: "Role / Category",  hint: "Their role or category label" },
  { tag: "{phone}",          label: "Phone Number",     hint: "Their phone number from RSVP" },
  { tag: "{invitation_code}", label: "Invitation Code", hint: "Their personal invitation code" },
  { tag: "{invitation_link}", label: "Invitation Link", hint: "Full link to their personal invitation" },
  { tag: "{rsvp_status}",    label: "RSVP Status",      hint: "Their current RSVP status (Confirmed ✓ / Declined ✗ / Pending ⏳)" },
  { tag: "{pax}",            label: "Number of Seats",  hint: "How many seats they have" },
  { tag: "{plus_one}",       label: "Plus-One Name",    hint: "Their plus-one's name" },
  { tag: "{couple_names}",   label: "Couple Names",     hint: "Bride & Groom names" },
  { tag: "{bride_name}",     label: "Bride Name",       hint: "The bride's name" },
  { tag: "{groom_name}",     label: "Groom Name",       hint: "The groom's name" },
  { tag: "{wedding_date}",   label: "Wedding Date",     hint: "The wedding date (readable format)" },
  { tag: "{wedding_day}",    label: "Wedding Day",      hint: "Day of the week" },
  { tag: "{wedding_venue}",  label: "Wedding Venue",    hint: "Venue name" },
  { tag: "{venue_address}",  label: "Venue Address",    hint: "Full venue address" },
  { tag: "{rsvp_deadline}",  label: "RSVP Deadline",    hint: "RSVP deadline date" },
  { tag: "{hashtag}",        label: "Hashtag",          hint: "Primary wedding hashtag" },
];

/** Replace all merge tags in a template with values for one recipient. */
export function applyMergeTags(template: string, recipient: Recipient, info: WeddingInfo): string {
  const weddingDate = new Date(info.date);
  const dateStr = weddingDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayName = weddingDate.toLocaleDateString("en-GB", { weekday: "long" });
  const rsvpDeadline = info.rsvp_deadline
    ? new Date(`${info.rsvp_deadline}T12:00:00+03:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "October 25, 2026";
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const link = recipient.inviteLink || (recipient.code ? `${base}/${recipient.code}` : "");

  return template
    .replace(/\{full_name\}/g, recipient.name)
    .replace(/\{first_name\}/g, recipient.greetName)
    .replace(/\{role\}/g, recipient.role)
    .replace(/\{phone\}/g, recipient.phone)
    .replace(/\{invitation_code\}/g, recipient.code || "")
    .replace(/\{invitation_link\}/g, link)
    .replace(/\{rsvp_status\}/g, recipient.rsvpStatus || "")
    .replace(/\{pax\}/g, recipient.pax?.toString() || "")
    .replace(/\{plus_one\}/g, recipient.plusOne || "")
    .replace(/\{couple_names\}/g, `${info.bride} & ${info.groom}`)
    .replace(/\{bride_name\}/g, info.bride)
    .replace(/\{groom_name\}/g, info.groom)
    .replace(/\{wedding_date\}/g, dateStr)
    .replace(/\{wedding_day\}/g, dayName)
    .replace(/\{wedding_venue\}/g, info.venue_name)
    .replace(/\{venue_address\}/g, info.venue_address)
    .replace(/\{rsvp_deadline\}/g, rsvpDeadline)
    .replace(/\{hashtag\}/g, info.hashtags[0] || "");
}
