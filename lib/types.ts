export type WeddingInfo = {
  id: string;
  date: string; // ISO datetime
  bride: string;
  groom: string;
  venue_name: string;
  venue_address: string;
  venue_map_link: string;
  venue_map_embed: string;
  theme_name: string;
  story: string;
  instagram: string;
  /** The one line inviting guests to follow along and tag their moments. */
  instagram_note?: string;
  hashtags: string[];
  total_budget: number;
  currency: string;
  save_the_date_url: string;
  /** Website & sharing, editable in the binder (Settings → Website & sharing). */
  site_title?: string;        // the browser tab title
  site_description?: string;  // the description friends see on a shared link
  share_image?: string;       // the preview banner on WhatsApp / iMessage / Facebook
  favicon?: string;           // the little icon in the browser tab
  gallery: string[];
  cover_photo?: string;
  music_url?: string;
  rsvp_deadline?: string; // YYYY-MM-DD
  /** Note on Gifts section (binder → Details): shown on the public site only when a note or account detail exists. */
  gift_note?: string;
  /**
   * The public wording above the gift registry (/gifts and the Hub tile) — invite-code free, so
   * it must never carry BenefitPay numbers: those stay sealed behind the invitation gate.
   * Blank falls back to DEFAULT_REGISTRY_NOTE.
   */
  registry_note?: string;
  /** BenefitPay mobile number / benefit account, as the couple wants it printed. */
  benefitpay_number?: string;
  /** IBAN for anyone who prefers a bank transfer. */
  benefitpay_iban?: string;
};
export type ScheduleItem = { id: string; time: string; title: string; detail: string; order: number };
export type BudgetStatus = "confirmed" | "quoted" | "pending";
export type BudgetItem = { id: string; category: string; item: string; quoted_cost: number; paid_cost: number; status: BudgetStatus };
export type Attending = "yes" | "no" | "pending";
export type Guest = {
  id: string; name: string; phone: string; pax: number; attending: Attending;
  dietary: string; message: string; song_request: string; source: "RSVP form" | "manual"; created_at?: string;
  /** Invite code: on manual rows it is the household's key; on form rows the code they replied with. */
  code?: string;
  /** null = not part of the gate (manual/legacy) · true = confirmed · false = awaiting the couple's review. */
  approved?: boolean | null;
  /** Name of the second guest when a party of two was requested. */
  plus_one?: string;
  /** The couple's own note on the household ("Jeg's cousins", "no kids invited"). */
  note?: string;
  /**
   * Who the link is for — "Ana & Ivan". The invitation letter greets this, and the guest's reply
   * card shows it above the form; it never pre-fills their name, so `name` can stay blank until
   * they type their own.
   */
  greet?: string;
  /** When the link left the binder (copy link / send ↗ / mark sent) — the `sent` stage. */
  sent_at?: string | null;
  /** First time the guest opened their personal link — the `opened` stage. */
  viewed_at?: string | null;
  /**
   * Who this household belongs to — one or more tags from `GUEST_TAGS` (or the couple's own),
   * stored as a CSV of tag ids so the column stays a plain `text` in Supabase. A maid of honor
   * who is also the bride's cousin carries both, and each tag on its own is a group the couple
   * can filter by and message. Replaces the old single `category`.
   */
  tags?: string;
  /**
   * The household's day-of role — the task they are entrusted with on the wedding day ("usher",
   * "coffee_tea"…, or the couple's own words). One role per household; a preset id from
   * `DAY_ROLES` (lib/roles.ts) or a custom label, exactly like the tags above.
   */
  role?: string;
  /** A small note on how they'll serve it ("bring the thermos", "handles the espresso machine"). */
  role_note?: string;
};

/** The icon a custom (couple-typed) tag is shown with; presets each carry their own. */
export const CUSTOM_TAG_ICON = "◇";

/**
 * The one dictionary of guest tags. Every surface reads this — the binder's Tags column, the
 * filter dropdown, the CSV export and the messaging module's recipient picker — so a label or an
 * icon changes in one place. Insertion order is display order everywhere.
 *
 * Custom tags are allowed too: their id *is* their label ("Church choir"), which keeps them
 * storable in the same CSV without a table of their own. `guestTagLabel` hands back the id when
 * it isn't a preset, so nothing needs to know the difference.
 */
export const GUEST_TAGS = {
  bride_family:   { label: "Bride's Family",     icon: "♡" },
  groom_family:   { label: "Groom's Family",     icon: "♡" },
  sponsors:       { label: "Principal Sponsors", icon: "✦" },
  entourage:      { label: "Entourage",          icon: "✿" },
  bridesmaids:    { label: "Bridesmaids",        icon: "✿" },
  groomsmen:      { label: "Groomsmen",          icon: "◆" },
  maid_of_honor:  { label: "Maid of Honor",      icon: "♛" },
  best_man:       { label: "Best Man",           icon: "♚" },
  honored:        { label: "Honored Guests",     icon: "★" },
  bride_friends:  { label: "Bride's Friends",    icon: "❀" },
  groom_friends:  { label: "Groom's Friends",    icon: "◆" },
  couple_friends: { label: "Couple Friends",     icon: "❂" },
  work:           { label: "Work/Colleagues",    icon: "▤" },
  college:        { label: "College/School",     icon: "✎" },
  childhood:      { label: "Childhood Friends",  icon: "☀" },
  neighbours:     { label: "Neighbours",         icon: "⌂" },
  online:         { label: "Online Friends",     icon: "☁" },
  vip:            { label: "VIP",                icon: "★" },
} as const;

export type GuestTagId = keyof typeof GUEST_TAGS;

/** The preset ids, in display order. Custom tags are not in here. */
export const GUEST_TAG_IDS = Object.keys(GUEST_TAGS) as GuestTagId[];

/** Is this a preset, or a tag the couple typed themselves? */
export const isPresetGuestTag = (id: string): id is GuestTagId =>
  Object.prototype.hasOwnProperty.call(GUEST_TAGS, id);

/** The stored CSV → a clean, de-duplicated list of tag ids. */
export function parseGuestTags(csv: string | null | undefined): string[] {
  if (!csv) return [];
  const seen = new Set<string>();
  for (const part of String(csv).split(",")) {
    const id = part.trim();
    if (id) seen.add(id);
  }
  return [...seen];
}

/** A list of tag ids → the CSV we store. Blanks and repeats never reach the database. */
export function formatGuestTags(tags: string[]): string {
  return parseGuestTags(tags.join(",")).join(",");
}

/** Preset tags read "Bride's Family"; a custom tag shows the words that were typed. */
export function guestTagLabel(id: string): string {
  return isPresetGuestTag(id) ? GUEST_TAGS[id].label : id;
}
export function guestTagIcon(id: string): string {
  return isPresetGuestTag(id) ? GUEST_TAGS[id].icon : CUSTOM_TAG_ICON;
}

/**
 * Text typed into "+ tag" → the tag id to store. Something that already exists as a preset is
 * matched case-insensitively (so "neighbours" joins ⌂ Neighbours instead of cloning it); anything
 * else keeps its own words, single-spaced.
 */
export function guestTagIdFor(text: string): string {
  const wanted = text.trim().replace(/\s+/g, " ");
  if (!wanted) return "";
  const key = wanted.toLowerCase();
  return GUEST_TAG_IDS.find((id) => id.toLowerCase() === key || GUEST_TAGS[id].label.toLowerCase() === key) ?? wanted;
}

/** Presets in dictionary order first, then custom tags alphabetically — chips and menus agree. */
export function sortGuestTagIds(ids: string[]): string[] {
  const rank = (id: string) => GUEST_TAG_IDS.indexOf(id as GuestTagId);
  return [...ids].sort((a, b) => {
    const ia = rank(a);
    const ib = rank(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return guestTagLabel(a).localeCompare(guestTagLabel(b));
  });
}
export type VendorStatus = "quoted" | "contacted" | "booked" | "pending";
export type Vendor = { id: string; type: string; name: string; quote: number; contact: string; status: VendorStatus; notes: string };
export type Priority = "critical" | "high" | "medium";
export type ChecklistItem = {
  id: string; task: string; category: Priority; due_date: string; completed: boolean;
  /** The sheet's "Category" — which part of the wedding this belongs to ("Venue & Catering"). */
  section?: string;
  /** The sheet's "Person In-charge" — who owns getting this done ("Tita Lorle"). */
  owner?: string;
  /** The sheet's "Details / Notes" — the how, the where, the what-exactly. */
  details?: string;
};
export type AttireGroup = "bride" | "groom" | "shai_family" | "jeg_family" | "bridesmaids" | "groomsmen" | "guests" | "flower_girl" | "ring_bearer";
export type Attire = { id: string; group: AttireGroup; label: string; colors: { name: string; hex: string; fabric?: string }[]; reserved: boolean; notes: string; swatch_url: string; order: number };
export type EntourageRole =
  | "bride_family" | "groom_family"
  | "sponsor"
  | "best_man" | "groomsman"
  | "maid_of_honor" | "matron_of_honor" | "bridesmaid"
  | "flower_girl" | "ring_bearer"
  | "honored_guest"
  | "other";
export type EntourageMember = { id: string; role: EntourageRole; name: string; title: string; order: number };
/** The admin picker's wording; the public site prints its own headings. */
export const ENTOURAGE_ROLES: { value: EntourageRole; label: string }[] = [
  { value: "groom_family", label: "Groom's Family" },
  { value: "bride_family", label: "Bride's Family" },
  { value: "sponsor", label: "Principal Sponsor" },
  { value: "best_man", label: "Best Man" },
  { value: "groomsman", label: "Groomsman" },
  { value: "maid_of_honor", label: "Maid of Honor" },
  { value: "matron_of_honor", label: "Matron of Honor" },
  { value: "bridesmaid", label: "Bridesmaid" },
  { value: "flower_girl", label: "Flower Girl" },
  { value: "ring_bearer", label: "Ring Bearer" },
  { value: "honored_guest", label: "Honored Guest" },
  { value: "other", label: "Other" },
];
/** How a bridesmaid's jewel is drawn on her card. */
export type GemCut = "brilliant" | "oval" | "pear" | "emerald" | "cushion";
export const GEM_CUTS: { value: GemCut; label: string }[] = [
  { value: "brilliant", label: "Round brilliant" },
  { value: "oval", label: "Oval" },
  { value: "pear", label: "Pear" },
  { value: "emerald", label: "Emerald (step cut)" },
  { value: "cushion", label: "Cushion" },
];
/**
 * One bridesmaid's A4 thank-you card. Every line the card prints is a field here, so the binder
 * can edit all of it; the jewel presets in lib/jewels.ts only fill the fields in to start with.
 */
export type BridesmaidCard = {
  id: string;
  /** Her name as the card addresses her. */
  name: string;
  /** Her jewel — "Garnet", "Sapphire"… A preset's name brings its colour and its line; any word is allowed. */
  jewel: string;
  /** The jewel's colour (hex) — the gem, the jewel's name and the accents are drawn in it. */
  color: string;
  cut: GemCut;
  /** The small line of capitals at the very top — "For my bridesmaid". */
  kicker: string;
  /** The script headline — "Thank you, my Sapphire". The jewel's name is picked out in her colour. */
  greeting: string;
  /** The capitals under the headline — "for saying yes, Ana". */
  subline: string;
  /** One line on what her jewel's colour says of her, printed under the gem. */
  embodies: string;
  /** A line of Scripture under that — "“She is far more precious than jewels.” — Proverbs 31:10". Optional on older rows. */
  verse?: string;
  /** The bride's own note to her. Blank lines start new paragraphs. */
  note: string;
  /** The small heading over the role block — "Her role on the day". */
  role_kicker: string;
  /** Her role, printed in capitals. */
  role_title: string;
  /** The motto under the title, in quotes. */
  tagline: string;
  /** "Your mission" — a short paragraph. */
  mission: string;
  /** "The duties" — one per line. */
  duties: string;
  /** "Pro tip" — one line; leave empty to print none. */
  pro_tip: string;
  /** The script sign-off — "With all my love, Shaira". */
  closing: string;
  /** The capitals under the sign-off — "J & S · 11.11.2026". */
  footer: string;
  order: number;
};

export type Faq = { id: string; question: string; answer: string; order: number };

/**
 * One line on the couple's gift registry. Guests mark items they have bought from the public
 * /gifts page (no invitation code needed); everyone else then sees them crossed off live.
 * The binder owns the list itself — add, edit, reorder, delete and release a mistaken claim.
 */
export type GiftItem = {
  id: string;
  title: string;
  /** Optional one-line detail ("king-size, crisp cotton") — the polite, specific "what's included". */
  note: string;
  /** Optional picture of the gift: an uploaded data URL (binder) or a pasted hosted image link. */
  image_url: string;
  claimed: boolean;
  /** What the guest typed as their name — shown in the binder and as "Bought by …" on the page. */
  claimed_by: string;
  claimed_at?: string | null;
  order: number;
};
/** One chapter of the couple's story — title + a little paragraph + one photo, swipeable on the site. */
export type StoryChapter = { id: string; title: string; text: string; photo: string; order: number };

/** A reusable message template with merge tags and assigned categories. */
export type MessageTemplate = {
  id: string;
  name: string;
  /** Short label like "Save the Date", "Reminder", "Thank You". */
  label: string;
  /** The message body with merge tags. */
  body: string;
  /**
   * Which recipient groups this template is meant for — guest tags, RSVP buckets, vendors —
   * stored as a comma-separated list of group ids (see MESSAGE_CATEGORIES in lib/messaging.ts).
   */
  categories: string;
  created_at?: string;
};

/** One row in the message tracker — one message to one recipient. */
export type MessageLog = {
  id: string;
  template_id: string;
  template_name: string;
  /** The original template body before merge tags were applied. */
  original_body: string;
  /** The resolved message body (merge tags applied). */
  body: string;
  recipient_id: string;
  recipient_name: string;
  recipient_phone: string;
  category: string;
  /** Whether the couple has sent/copied the message. */
  sent: boolean;
  /** Whether the guest has responded (manually ticked). */
  responded: boolean;
  /** How many times a link in the message was opened. */
  link_opens: number;
  /** Most recent time the recipient opened a tracked link in this message. */
  opened_at?: string | null;
  sent_at?: string | null;
  created_at?: string;
};

export type TableMap = {
  wedding_info: WeddingInfo;
  schedule: ScheduleItem;
  budget: BudgetItem;
  guests: Guest;
  vendors: Vendor;
  checklist: ChecklistItem;
  attire: Attire;
  entourage: EntourageMember;
  faq: Faq;
  story: StoryChapter;
  message_templates: MessageTemplate;
  messages: MessageLog;
  bridesmaid_cards: BridesmaidCard;
  gift_items: GiftItem;
};
export type TableName = keyof TableMap;
export const TABLES: TableName[] = ["wedding_info", "schedule", "budget", "guests", "vendors", "checklist", "attire", "entourage", "faq", "story", "message_templates", "messages", "bridesmaid_cards", "gift_items"];
/** Tables the public site may read without logging in. */
export const PUBLIC_TABLES: TableName[] = ["wedding_info", "schedule", "attire", "entourage", "faq", "story"];

/**
 * The public wording above /gifts when the couple hasn't written their own. Deliberately carries
 * no account numbers — the sealed BenefitPay/IBAN fields stay inside personal invitation links.
 */
export const DEFAULT_REGISTRY_NOTE =
  "As we begin our new life together, any gift would be a wonderful help and is deeply appreciated — thank you for supporting us, your newlyweds, as a community.";
