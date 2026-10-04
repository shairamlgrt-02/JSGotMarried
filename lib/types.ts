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
};
export type VendorStatus = "quoted" | "contacted" | "booked" | "pending";
export type Vendor = { id: string; type: string; name: string; quote: number; contact: string; status: VendorStatus; notes: string };
export type Priority = "critical" | "high" | "medium";
export type ChecklistItem = { id: string; task: string; category: Priority; due_date: string; completed: boolean };
export type AttireGroup = "bride" | "groom" | "shai_family" | "jeg_family" | "bridesmaids" | "groomsmen" | "guests";
export type Attire = { id: string; group: AttireGroup; label: string; colors: { name: string; hex: string; fabric?: string }[]; reserved: boolean; notes: string; swatch_url: string; order: number };
export type EntourageRole =
  | "bride_family" | "groom_family"
  | "sponsor"
  | "best_man" | "groomsman"
  | "maid_of_honor" | "bridesmaid"
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
  { value: "bridesmaid", label: "Bridesmaid" },
  { value: "flower_girl", label: "Flower Girl" },
  { value: "ring_bearer", label: "Ring Bearer" },
  { value: "honored_guest", label: "Honored Guest" },
  { value: "other", label: "Other" },
];
export type Faq = { id: string; question: string; answer: string; order: number };
/** One chapter of the couple's story — title + a little paragraph + one photo, swipeable on the site. */
export type StoryChapter = { id: string; title: string; text: string; photo: string; order: number };

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
};
export type TableName = keyof TableMap;
export const TABLES: TableName[] = ["wedding_info", "schedule", "budget", "guests", "vendors", "checklist", "attire", "entourage", "faq", "story"];
/** Tables the public site may read without logging in. */
export const PUBLIC_TABLES: TableName[] = ["wedding_info", "schedule", "attire", "entourage", "faq", "story"];
