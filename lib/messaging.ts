import type { Guest, WeddingInfo, EntourageMember, Vendor, MessageTemplate, MessageLog } from "./types";
import { GUEST_TAGS, GUEST_TAG_IDS, guestTagIcon, guestTagLabel, parseGuestTags } from "./types";
import { DAY_ROLE_IDS, DAY_ROLES, dayRoleIcon, dayRoleLabel } from "./roles";

/* ─── Recipient groups ─── */
/**
 * Every group the couple can address a message to. Each one resolves to people from one or more
 * data sources — guest tags (from `guests.tags`), RSVP status (also the guests table), day-of
 * roles (from `guests.role`), entourage roles, or vendors.
 */
export type RecipientSource =
  | "entourage" | "vendor"
  | "all_guests" | "pending_rsvp" | "opened_no_rsvp" | "confirmed_yes" | "confirmed_no"
  | "guest_tag" | "guest_role";

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

/** A day-of role's group id, in the compose picker and in the Roles tab's "message this team". */
export const dayRoleCategoryId = (roleId: string) => `drole_${roleId}`;

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

/** The day-of roles, straight from the shared dictionary — the Roles tab's chips and these are the same list. */
export const DAY_ROLE_CATEGORIES: MessageCategory[] = DAY_ROLE_IDS.map((roleId) => ({
  id: dayRoleCategoryId(roleId),
  label: DAY_ROLES[roleId].label,
  icon: DAY_ROLES[roleId].icon,
  source: "guest_role" as RecipientSource,
  filter: roleId,
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
  // ── Day-of roles (guests.role) — preset ones; a custom role joins the picker the moment it's used ──
  ...DAY_ROLE_CATEGORIES,
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
 * One group by id — including a custom tag or a custom day-of role the couple typed in the binder,
 * which are not in `MESSAGE_CATEGORIES` and so get their entries built here. That is what lets the
 * Guests tab's "📨 Message [tag]" and the Roles tab's "📨 Message this team" jumps address any
 * group, preset or not.
 */
export function messageCategoryFor(raw: string): MessageCategory | undefined {
  const id = LEGACY_CATEGORY_ALIASES[raw] ?? raw;
  const known = MESSAGE_CATEGORIES.find((c) => c.id === id);
  if (known) return known;
  if (id.startsWith("drole_")) {
    const roleId = id.slice("drole_".length).trim();
    if (!roleId) return undefined;
    return { id, label: dayRoleLabel(roleId), icon: dayRoleIcon(roleId), source: "guest_role", filter: roleId };
  }
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
      cat.source === "guest_tag" ||
      cat.source === "guest_role"
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
      } else if (cat.source === "guest_role") {
        // one role per household — the stored value is the preset id, or the couple's own words
        filtered = guests.filter((g) => (g.role || "").trim() === cat.filter);
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
  matron_of_honor: "Matron of Honor",
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
  { tag: "{rsvp_link}",       label: "RSVP Link",        hint: "Their invitation link, opened straight on the reply card (…#rsvp)" },
  { tag: "{rsvp_status}",    label: "RSVP Status",      hint: "Their current RSVP status (Confirmed ✓ / Declined ✗ / Pending ⏳)" },
  { tag: "{pax}",            label: "Number of Seats",  hint: "How many seats they have" },
  { tag: "{seats}",          label: "Seats (readable)", hint: "\"2 seats\" / \"1 seat\" / \"a seat\" — drops straight into a sentence" },
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
  // The chase messages point here: the guest's own page, landed straight on the reply card.
  // #rsvp is the site's own deep link (the /rsvp door hands guests over the same way), and the
  // page smooth-scrolls them down the moment their code is verified.
  const rsvpLink = link ? `${link}#rsvp` : "";
  // "2 seats" / "1 seat" / "a seat" — phrased so the template's sentence always reads naturally
  const seats = recipient.pax && recipient.pax > 0 ? `${recipient.pax} seat${recipient.pax === 1 ? "" : "s"}` : "a seat";

  return template
    .replace(/\{full_name\}/g, recipient.name)
    .replace(/\{first_name\}/g, recipient.greetName)
    .replace(/\{role\}/g, recipient.role)
    .replace(/\{phone\}/g, recipient.phone)
    .replace(/\{invitation_code\}/g, recipient.code || "")
    .replace(/\{invitation_link\}/g, link)
    .replace(/\{rsvp_link\}/g, rsvpLink)
    .replace(/\{rsvp_status\}/g, recipient.rsvpStatus || "")
    .replace(/\{pax\}/g, recipient.pax?.toString() || "")
    .replace(/\{seats\}/g, seats)
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

/* ─── Ready-made templates ─── */
/**
 * The couple's letters, written once in the code so nobody has to start from a blank box: the
 * RSVP chase (a gentle reminder, then the kind-but-firm final call before the deadline), the two
 * thank-yous, and the day-of role briefing. The binder's Templates tab lists them with one-click
 * "add to my templates" buttons — added copies are ordinary templates, free to edit or delete.
 *
 * {first_name}, {seats}, {rsvp_deadline}, {invitation_link}, {wedding_date}, {couple_names} and
 * {role} fill themselves in per household (see applyMergeTags above). WhatsApp *asterisks* bold.
 */
export interface PresetTemplate {
  id: string;
  name: string;
  /** Short label chip — "Reminder", "Final call"… */
  label: string;
  /** One line under the name in the picker. */
  hint: string;
  /** The recipient groups pre-ticked when the template is added (see MESSAGE_CATEGORIES). */
  categories: string[];
  body: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "preset_rsvp_reminder",
    name: "RSVP · Gentle Reminder",
    label: "Reminder",
    hint: "For guests who haven't replied yet — warm, no pressure, one minute to fill in.",
    categories: ["pending_rsvp"],
    body: `Hi {first_name}! 🌸

We hope you've been well! We're counting down the days to our wedding on {wedding_date}, and we wanted to send a gentle little reminder about your RSVP.

We've saved {seats} just for you, and we'd love to know if you can join us. When you have a quiet minute, could you please fill out the short RSVP form here? It only takes a minute — and your reply is how we hold your seat:

{rsvp_link}

Even a "no" helps us plan, so whatever your answer, please tell us there. 😊

If you have any questions at all — transport, timing, anything — just reply to this message. We're always happy to help.

With love,
{couple_names}`,
  },
  {
    id: "preset_rsvp_final_call",
    name: "RSVP · Final Check-in (No Reply = Not Coming)",
    label: "Final call",
    hint: "For the guests who haven't replied — personal, warm, and clear: no RSVP by the deadline means we count it as a no and release the seats.",
    categories: ["pending_rsvp"],
    body: `Hi {first_name}! 🤍

Just checking in — we noticed your RSVP hasn't come in yet. Totally understand, life gets busy!

We'd really love to have you with us on {wedding_date}, so when you get a minute, please fill it out here:
{rsvp_link}

📌 *One small but important thing:* we finalise our guest list on *{rsvp_deadline}* — if we don't hear from you by then, we'll have to lovingly take that as a "no" and release your {seats}. Either way, just let us know! 😊

Love,
{couple_names}`,
  },
  {
    id: "preset_rsvp_thank_you_yes",
    name: "RSVP · Thank You for Your Yes",
    label: "Thank you",
    hint: "For confirmed guests — warm thanks, plus the one arrival thing to remember.",
    categories: ["confirmed_yes"],
    body: `Hi {first_name}! 🥰

Thank you for confirming — your seats are officially saved! We can't tell you how happy it made us to read your yes.

Your personal invitation link holds everything: the programme, the dress code, the venue and the map:

{invitation_link}

One small thing to remember: the hall is being prepared until 4:00 PM, so everyone gathers at the majlis just outside it first — come a little early, have snacks with us there, and we'll all walk into the hall together. From 5:30 PM, everyone is welcome for the Welcome Toast & Snacks before the reception.

We can't wait to celebrate with you! ❤️

With love,
{couple_names}`,
  },
  {
    id: "preset_rsvp_thank_you_no",
    name: "RSVP · Thank You for Letting Us Know",
    label: "Thank you",
    hint: "For guests who declined — no guilt, all love, door left open.",
    categories: ["confirmed_no"],
    body: `Hi {first_name},

Thank you so much for letting us know — truly. We'll miss you dearly on the day, but we understand completely, and we're grateful you told us so we can plan our seats well. 🤍

Thank you for the love and support you've shown us, from near or far. We'd love to see you before or after the wedding, too — let's find a time for coffee!

With all our love,
{couple_names}`,
  },
  {
    id: "preset_role_briefing",
    name: "Day-of Role · We'd Love to Entrust You",
    label: "Roles",
    hint: "For a day-of role team (pick the role as the recipient) — {role} fills itself in.",
    categories: [],
    body: `Hi {first_name}! 💛

As we prepare for our wedding on {wedding_date}, there's one small role close to our hearts that we'd love to entrust to you: *{role}*.

You'd be such a big help to us — the day truly wouldn't run as smoothly without you. Our coordinators will brief you on all the details before the day. No heavy lifting, we promise — just your kind presence and a willing hand. 😊

Can we count you in? Just reply here to let us know.

With love and gratitude,
{couple_names}`,
  },
];
