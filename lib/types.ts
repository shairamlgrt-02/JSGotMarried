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
  hashtags: string[];
  total_budget: number;
  currency: string;
  save_the_date_url: string;
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
};
export type VendorStatus = "quoted" | "contacted" | "booked" | "pending";
export type Vendor = { id: string; type: string; name: string; quote: number; contact: string; status: VendorStatus; notes: string };
export type Priority = "critical" | "high" | "medium";
export type ChecklistItem = { id: string; task: string; category: Priority; due_date: string; completed: boolean };
export type AttireGroup = "bride" | "groom" | "shai_family" | "jeg_family" | "bridesmaids" | "groomsmen" | "guests" | "moh";
export type Attire = { id: string; group: AttireGroup; label: string; colors: { name: string; hex: string }[]; reserved: boolean; notes: string; swatch_url: string; order: number };
export type EntourageMember = { id: string; role: "bride_family" | "groom_family" | "bridesmaid" | "groomsman" | "sponsor" | "other"; name: string; title: string; order: number };
export type Faq = { id: string; question: string; answer: string; order: number };

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
};
export type TableName = keyof TableMap;
export const TABLES: TableName[] = ["wedding_info", "schedule", "budget", "guests", "vendors", "checklist", "attire", "entourage", "faq"];
/** Tables the public site may read without logging in. */
export const PUBLIC_TABLES: TableName[] = ["wedding_info", "schedule", "attire", "entourage", "faq"];
