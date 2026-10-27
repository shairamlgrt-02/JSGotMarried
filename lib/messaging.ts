import type { Attending, Guest, WeddingInfo, EntourageMember, Vendor, MessageLog } from "./types";
import { GUEST_TAGS, GUEST_TAG_IDS, guestTagIcon, guestTagLabel, parseGuestTags } from "./types";
import { DAY_ROLE_IDS, DAY_ROLES, dayRoleIcon, dayRoleLabel } from "./roles";
import { cleanCode } from "./guests";

/* ─── Short tracking IDs & tracked links ─── */
const MSG_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Compact 7-character message tracking id (`m` + 6 URL-safe characters, e.g. `mk7p3m9`).
 * Doubles as `messages.id` and the `?m=…` query parameter on links in that message, keeping
 * WhatsApp links short and tidy while tracking opens per recipient and per message.
 */
export function genMessageId(): string {
  const bytes =
    typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)))
      : Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  return `m${bytes.map((b) => MSG_ID_ALPHABET[b % MSG_ID_ALPHABET.length]).join("")}`;
}

/**
 * Append `?m=<messageId>` cleanly BEFORE any `#hash` fragment (e.g. `…/JS-7KQF?m=mk7p3m9#rsvp`),
 * so `window.location.hash === "#rsvp"` still smooth-scrolls straight to the reply card.
 */
export function attachTrackingParam(rawUrl: string, origin = "", messageId?: string): string {
  if (!rawUrl || !messageId) return rawUrl;
  try {
    const fallbackOrigin = origin || "https://jsgotmarried.local";
    const u = new URL(rawUrl, fallbackOrigin);
    if (!u.searchParams.has("m")) u.searchParams.set("m", messageId);
    if (!origin && !/^https?:\/\//i.test(rawUrl)) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
    return u.toString();
  } catch {
    const hashIdx = rawUrl.indexOf("#");
    const before = hashIdx >= 0 ? rawUrl.slice(0, hashIdx) : rawUrl;
    const hash = hashIdx >= 0 ? rawUrl.slice(hashIdx) : "";
    const sep = before.includes("?") ? "&" : "?";
    return `${before}${sep}m=${encodeURIComponent(messageId)}${hash}`;
  }
}

/* ─── Message delivery / tracking statuses (Invite Codes style) ─── */
export type MessageStage = "to_send" | "sent" | "opened" | "responded" | "declined";

export const MESSAGE_STATUS: Record<
  MessageStage,
  { label: string; hint: string; tone: "moss" | "wine" | "ink" | "amethyst" | "burgundy" }
> = {
  to_send: { label: "to send", hint: "Ready — copy the message or tap send to share it.", tone: "ink" },
  sent: { label: "sent", hint: "Copied / shared with the recipient — waiting on them to open.", tone: "wine" },
  opened: { label: "opened", hint: "They opened the link — waiting on their reply.", tone: "amethyst" },
  responded: { label: "responded", hint: "They replied on WhatsApp or confirmed their RSVP.", tone: "moss" },
  declined: { label: "declined", hint: "Declined with love on the RSVP card.", tone: "burgundy" },
};

export interface MessageTrackingInfo {
  stage: MessageStage;
  opens: number;
  openedAt: string | null;
  repliedViaRsvp: boolean;
}

/**
 * Compute the live Invite-Codes-style status for one message row, combining per-message link
 * tracking (`link_opens`, `opened_at`, `responded`) with live household state on `guests`.
 */
export function messageTrackingInfo(log?: MessageLog | null, guest?: Guest | null): MessageTrackingInfo {
  if (!log || !log.sent) {
    // Even if not sent yet, allow manually ticked responded edge case
    if (log?.responded) {
      return {
        stage: "responded",
        opens: Number(log.link_opens) || 0,
        openedAt: log.opened_at ?? null,
        repliedViaRsvp: false,
      };
    }
    return { stage: "to_send", opens: Number(log?.link_opens) || 0, openedAt: log?.opened_at ?? null, repliedViaRsvp: false };
  }

  const directOpens = Number(log.link_opens) || 0;
  const isDistributedLinkRow = Boolean(log.id?.startsWith("link_"));
  const guestViewedAfterSend = Boolean(
    guest?.viewed_at && (!log.sent_at || guest.viewed_at >= log.sent_at),
  );
  const opens = directOpens > 0 ? directOpens : guestViewedAfterSend || log.opened_at ? 1 : 0;
  const openedAt =
    log.opened_at ||
    (isDistributedLinkRow && directOpens > 0 ? log.created_at ?? guest?.viewed_at ?? null : null) ||
    (guestViewedAfterSend ? guest?.viewed_at ?? null : null);

  const rsvpSubmittedAfterSend = Boolean(
    guest &&
      guest.source === "RSVP form" &&
      guest.attending !== "pending" &&
      guest.created_at &&
      (!log.sent_at || guest.created_at >= log.sent_at),
  );

  if (rsvpSubmittedAfterSend && guest?.attending === "no") {
    return { stage: "declined", opens: Math.max(opens, 1), openedAt: openedAt || guest.created_at || null, repliedViaRsvp: true };
  }
  if (log.responded || rsvpSubmittedAfterSend) {
    if (guest?.attending === "no" && guest.source === "RSVP form") {
      return { stage: "declined", opens, openedAt, repliedViaRsvp: true };
    }
    return { stage: "responded", opens, openedAt, repliedViaRsvp: rsvpSubmittedAfterSend };
  }
  if (opens > 0) {
    return { stage: "opened", opens, openedAt, repliedViaRsvp: false };
  }
  return { stage: "sent", opens: 0, openedAt: null, repliedViaRsvp: false };
}

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
  /** Underlying `guests.id` when the recipient belongs to the guest list. */
  guestId?: string;
  /** Underlying `vendors.id` when the recipient is a vendor. */
  vendorId?: string;
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
  attending?: Attending;
  viewedAt?: string | null;
  sentAt?: string | null;
}

/** Resolve the recipients for a set of groups from all data sources. */
export function resolveRecipients(
  categories: string[],
  entourage: EntourageMember[],
  vendors: Vendor[],
  guests: Guest[],
  _info: WeddingInfo,
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
            vendorId: v.id,
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
        const code = cleanCode(g.code);
        map.set(id, {
          id,
          guestId: g.id,
          name: g.greet || g.name || "Guest",
          greetName: (g.greet || g.name || "Guest").split(" ")[0],
          phone: g.phone,
          role: cat.label,
          category: cat.label,
          code,
          inviteLink: code ? `${base}/${code}` : "",
          pax: g.pax,
          plusOne: g.plus_one,
          rsvpStatus: g.attending === "yes" ? "Confirmed ✓" : g.attending === "no" ? "Declined ✗" : "Pending ⏳",
          attending: g.attending,
          viewedAt: g.viewed_at ?? null,
          sentAt: g.sent_at ?? null,
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
  { tag: "{instagram}",      label: "Instagram Handle", hint: "Your @handle from Details → Social" },
  { tag: "{venue_map_link}", label: "Venue Map Link",   hint: "The Google Maps link saved on the venue" },
  { tag: "{upload_link}",    label: "Photo Upload Link", hint: "The /upload page where guests send their photos & videos" },
  { tag: "{hashtag}",        label: "Hashtag",          hint: "Primary wedding hashtag" },
];

/** Does a message body reference a guest's personal invitation code or personal link? */
export const templateUsesInviteCode = (body: string) =>
  /\{(invitation_code|invitation_link|rsvp_link)\}/.test(body);

/** Build a recipient's personal tracked URL (either their invitation page or straight on `#rsvp`). */
export function recipientTrackedLink(
  recipient: Recipient,
  messageId?: string,
  origin?: string,
  jumpToRsvp = false,
): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const code = cleanCode(recipient.code);
  const raw = code
    ? jumpToRsvp
      ? `${base}/${code}#rsvp`
      : `${base}/${code}`
    : jumpToRsvp
      ? `${base}/rsvp`
      : base;
  return raw ? attachTrackingParam(raw, base, messageId) : "";
}

/** Replace all merge tags in a template with values for one recipient, attaching per-message tracking. */
export function applyMergeTags(
  template: string,
  recipient: Recipient,
  info: WeddingInfo,
  messageId?: string,
  originOverride?: string,
): string {
  const weddingDate = new Date(info.date);
  const dateStr = weddingDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayName = weddingDate.toLocaleDateString("en-GB", { weekday: "long" });
  const rsvpDeadline = info.rsvp_deadline
    ? new Date(`${info.rsvp_deadline}T12:00:00+03:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "October 25, 2026";
  const base = originOverride ?? (typeof window !== "undefined" ? window.location.origin : "");
  const code = cleanCode(recipient.code);
  const link = recipientTrackedLink(recipient, messageId, base, false);
  // The chase messages point here: the guest's own page, landed straight on the reply card.
  // `?m=…` sits cleanly before `#rsvp` so smooth-scroll still lands right on the reply card.
  const rsvpLink = recipientTrackedLink(recipient, messageId, base, true);
  // "2 seats" / "1 seat" / "a seat" — phrased so the template's sentence always reads naturally
  const seats = recipient.pax && recipient.pax > 0 ? `${recipient.pax} seat${recipient.pax === 1 ? "" : "s"}` : "a seat";

  let resolved = template
    .replace(/\{full_name\}/g, recipient.name)
    .replace(/\{first_name\}/g, recipient.greetName)
    .replace(/\{role\}/g, recipient.role)
    .replace(/\{phone\}/g, recipient.phone)
    .replace(/\{invitation_code\}/g, code)
    .replace(/\{invitation_link\}/g, link)
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
    .replace(/\{instagram\}/g, info.instagram || "")
    .replace(/\{venue_map_link\}/g, info.venue_map_link || "")
    .replace(/\{upload_link\}/g, base ? `${base}/upload` : "/upload")
    .replace(/\{hashtag\}/g, info.hashtags[0] || "")
    .replace(/\{rsvp_link\}/g, rsvpLink);

  // Also attach `?m=<messageId>` to any hand-pasted link pointing to this wedding site so
  // custom messages track opens even without using a `{…_link}` merge tag.
  if (messageId && base) {
    try {
      const host = new URL(base).host;
      resolved = resolved.replace(/https?:\/\/[^\s<>"')]+/gi, (match) => {
        try {
          const u = new URL(match);
          if (u.host === host && !u.searchParams.has("m")) {
            u.searchParams.set("m", messageId);
            return u.toString();
          }
        } catch { /* leave untouched */ }
        return match;
      });
    } catch { /* ignore invalid base */ }
  }

  return resolved;
}

/* ─── Ready-made templates ─── */
/**
 * The couple's letters, written once in the code so nobody has to start from a blank box: the
 * RSVP chase (a gentle reminder, then the kind-but-firm final call before the deadline), the
 * thank-yous (one general, plus separate letters for the wedding team's 3:30 PM call time and
 * the guests' 5:30 PM majlis arrival, each carrying the adults-only ceremony and livestream
 * notes), the replies for after the deadline (fill-in-your-details, missed-RSVP livestream and
 * the final guest-list-closed note), and the day-of role briefing. The binder's Templates tab
 * lists them with one-click "add to my templates" buttons — added copies are ordinary templates,
 * free to edit or delete.
 *
 * {first_name}, {seats}, {rsvp_deadline}, {rsvp_link}, {invitation_link}, {wedding_date},
 * {couple_names} and {role} fill themselves in per household (see applyMergeTags above).
 * WhatsApp *asterisks* bold.
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
    id: "preset_thank_yes_wedding_team",
    name: "RSVP · Thank You, Wedding Team (3:30 PM Call Time)",
    label: "Thank you",
    hint: "For the entourage & wedding team who said yes — 3:30 PM call time, doors close 4:00 PM, late friends join the majlis livestream, plus the adults-only ceremony note for their children.",
    categories: [],
    body: `Hi {first_name}! 🥰

Thank you for saying YES — not only to celebrating with us, but to standing beside us as part of our wedding team. It means the absolute world to us, and {seats} are saved with so much love.

Here is how our wedding day on {wedding_date} will flow for you:

*🕞 3:30 PM — your call time at the majlis*
Please come straight to the majlis, just outside the hall. Our coordinators will meet and brief you there, with snacks and refreshments waiting.

*🚪 The doors close at 4:00 PM*
A few minutes before 4:00 PM we will all walk into the hall together, and the doors close the moment the procession begins — so please make sure to arrive *earlier than 4:00 PM*. If anything ever delays you and you arrive after the doors close, you are still completely welcome to settle in at the majlis and watch the entire ceremony with us there on the livestream, refreshments in hand.

*👶 A gentle note about little ones*
Our ceremony is an adults-only, closed-door moment. Unless your children are taking part in the wedding ceremony itself, they are very welcome to stay at the majlis and watch along on the livestream, with refreshments served there too — and we cannot wait to hug them at the reception later!

*🥂 After the ceremony*
Once the vows and photos are done, we will come and join you at the majlis for the welcome toast, snacks, chats and pictures. Then at *7:00 PM*, everyone walks into the hall together and the reception begins! 🎉

Your personal invitation has the full programme, dress code, venue and map:
{invitation_link}

We truly could not do this without you. Thank you for loving us this well. ❤️

With love,
{couple_names}`,
  },
  {
    id: "preset_thank_yes_guests",
    name: "RSVP · Thank You for Your Yes (5:30 PM Majlis · 7 PM Hall)",
    label: "Thank you",
    hint: "For confirmed guests — 5:30 PM at the majlis with welcome toasts & snacks, ceremony on the livestream, little ones welcome from the reception, and everyone enters the hall together at 7:00 PM.",
    categories: ["confirmed_yes"],
    body: `Hi {first_name}! 🥰

Thank you for confirming — your {seats} are officially saved, and reading your yes made us so happy! We cannot wait to celebrate with you on {wedding_date}.

A few lovely details so you know exactly how the day flows:

*🕠 5:30 PM — welcome to the majlis*
Please join us at the majlis, just outside the hall, for welcome toasts, snacks and photos. Our ceremony is a small, adults-only, closed-door moment — but you will not miss a thing: it will be shown on the livestream at the majlis, with snacks and refreshments served as you watch.

*👶 Children are welcome at the reception!*
Because the ceremony itself is adults-only and behind closed doors, we would love your little ones to join us from the reception onwards. Until then, they can watch the ceremony beside you at the majlis on the livestream, with refreshments ready for them too.

*🥂 After the ceremony*
As soon as the vows are done, we will come and find you at the majlis for the welcome toast, snacks, chats and pictures. Then at *7:00 PM*, all of our guests will walk into the hall together — and the wedding celebrations begin! 🎉

Your personal invitation holds the full programme, dress code, venue and map:
{invitation_link}

See you very soon — with all our love,
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
    id: "preset_confirmed_personal_details",
    name: "RSVP · Confirmed Personally? Please Add Your Details",
    label: "Action needed",
    hint: "For guests who said yes in person or by chat but never filled in the form — their greeting is appreciated, their seats are saved, and the link lets them complete their own details; if the link won't open, they can reply with names and a mobile number instead.",
    categories: [],
    body: `Hi {first_name}! 🤍

Thank you so much for letting us know personally that you will be with us on our wedding day — truly. Your greeting made us smile, and we have saved {seats} just for you. 🥰

One small favour, if we may: as much as possible, we would love for you to fill in your details personally through our RSVP link. It only takes a quiet minute, and it makes sure everything — your names, your seats, all of it — is exactly right for the day:

{rsvp_link}

*Can't open or access the link?* No worries at all — simply reply to this message with:
• your *full name*;
• the *full names of every guest coming with you*; and
• your *mobile number*.

We will be needing these details for the seating tables, the programme and our final announcements, so it is a huge help to us either way. 😊

Thank you for the love and support you have shown us — we cannot wait to celebrate with you!

With love,
{couple_names}`,
  },
  {
    id: "preset_rsvp_missed_livestream",
    name: "RSVP · Missed the Deadline? Join via Livestream",
    label: "Livestream",
    hint: "A loving reply for guests whose RSVP arrived too late — the list is locked, but they are welcome at the majlis to watch the ceremony on the livestream with refreshments.",
    categories: [],
    body: `Hi {first_name}! 🤍

We are writing with so much love. We noticed your RSVP did not reach us before the deadline, and our final guest list and seating are now locked in, so we are sadly unable to reserve a seat for you at the reception. We truly wish things were different.

The lovely part is that you can still be right there with us: our wedding ceremony will be shown on the livestream at the majlis, where you are warmly welcome to watch along with refreshments — it will feel like you are in the room as we say "I do". 🥹

Thank you for the love and support you have shown us, from near or far. We would love to find a time for coffee soon after the wedding!

With all our love,
{couple_names}`,
  },
  {
    id: "preset_rsvp_closed_no_reply",
    name: "RSVP · With Love — the Guest List Is Finalised",
    label: "Final call",
    hint: "For guests who never replied — kind but firm: we would love them there, the deadline has passed and the final guest list is now set.",
    categories: ["pending_rsvp"],
    body: `Hi {first_name}! 🤍

We would truly love to have you with us on our wedding day, and you have been in our thoughts as we put the final touches on everything.

Sadly, we have now reached the moment where we must give our venue the final number of guests. Our RSVP deadline has passed and our guest list has been finalised, so we are no longer able to add new seats. We completely understand that life gets busy, and there are truly no hard feelings at all.

Thank you for being part of our story, whatever the day looks like for you. Sending you so much love, and we hope we can hug and catch up very soon.

Love always,
{couple_names}`,
  },
  {
    id: "preset_broadcast_2_weeks",
    name: "Broadcast · 2 Weeks To Go (Attire · IG · Gifts)",
    label: "Broadcast",
    hint: "The first countdown broadcast — Instagram handle, the glossy-greens & shining-browns dress code on the invitation site, and where to find the Note on Gifts.",
    categories: ["confirmed_yes"],
    body: `Hi {first_name}! 💌

Only two weeks until we say "I do" — and we cannot wait to celebrate with you on {wedding_date}!

A few little things to get you excited (and ready):

👗 *What to wear* — black tie in glossy greens and warm shining browns. The full palette, fabrics and the colours we'd love you to skip are on your personal invitation:
{invitation_link}

📸 *Follow along* — find us on Instagram at {instagram} for the countdown, behind-the-scenes peeks and all the wedding-day joy.

🎁 *A note on gifts* — your presence is truly the only present we need. If you would still like to give, our Note on Gifts (including BenefitPay details) is at the bottom of the invitation page above.

See you very soon!
With love,
{couple_names}`,
  },
  {
    id: "preset_broadcast_1_week",
    name: "Broadcast · 1 Week To Go (Map · Arrival Times)",
    label: "Broadcast",
    hint: "The week-of broadcast — the Google Maps pin, the 3:30 PM wedding-team call time and the 5:30 PM majlis arrival for everyone else, with the full schedule on the invitation site.",
    categories: ["confirmed_yes"],
    body: `Hi {first_name}! 🤍

One week to go — we are down to the final countdown, and our hearts are so full that you will be part of this day.

📍 *Finding us* — the Google Maps pin for {wedding_venue}:
{venue_map_link}

🕞 *When to arrive*
· Our entourage & wedding team: please be at the *majlis by 3:30 PM* for your briefing — the ceremony doors close at *4:00 PM*.
· All other guests: join us at the *majlis from 5:30 PM* for welcome toasts and snacks; after the ceremony we will join you there, and at *7:00 PM* everyone walks into the hall together for the reception.

The full programme, dress code and venue details live on your invitation:
{invitation_link}

Any questions at all, just reply here. One week! 🎉

Love,
{couple_names}`,
  },
  {
    id: "preset_broadcast_1_day",
    name: "Broadcast · Tomorrow! (Tag Us)",
    label: "Broadcast",
    hint: "The-eve hype message — tomorrow is the day, with the reminder to tag the couple's handle and hashtag in every photo and story.",
    categories: ["confirmed_yes"],
    body: `Hi {first_name}! ✨

Tomorrow. We actually get to marry each other tomorrow, and you get to be there — pinching ourselves! 🥹

One tiny favour as you get ready: take ALL the photos and videos, and tag us so we can keep every moment forever:
📸 Instagram: {instagram}
🏷️ Hashtag: {hashtag}

Stories, reels, dance-floor clips — we want them all. See you at the majlis tomorrow!

With all our excitement,
{couple_names}`,
  },
  {
    id: "preset_broadcast_day_after",
    name: "Broadcast · The Morning After (Share Your Photos)",
    label: "Broadcast",
    hint: "The thank-you broadcast for the day after — warm gratitude and the /upload link so guests send their photos and videos straight to the couple (up to 25 files).",
    categories: ["confirmed_yes"],
    body: `Hi {first_name}! 🤍

Thank you. Last night was the best night of our lives, and it was because you were in it — the hugs, the laughter, the dance floor (we saw everything 😄).

Would you do us one last favour? Upload your favourite photos and videos from the day here — up to 25 files, straight from your phone:
{upload_link}

Every clip is a little keepsake for us, and we cannot wait to relive the day through your eyes. Tag {instagram} and {hashtag} when you post, too!

Forever grateful,
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
