import { CHANGE_EVENT, getMode, list as listTable } from "./db";
import { SEED } from "./seed";
import { DEFAULT_REGISTRY_NOTE, type GiftItem } from "./types";

/**
 * The public gift registry (/gifts and the Hub tile).
 *
 * Supabase mode: reads and guest claims go through /api/gifts (service-role route; anon has no
 * table grants — see supabase/schema.sql). Local mode (no Supabase configured): the board lives
 * in this browser's localStorage, seeded from SEED, so the whole flow still works in demo mode.
 *
 * Claims are deliberately public (no invitation code): every guest should be able to mark a
 * present bought. Once confirmed, only the couple may release a claim from the authenticated binder.
 */

const ITEMS_KEY = "jsos:gift_items";
const NOTE_KEY = "jsos:registry-note";

export type GiftBoard = {
  items: GiftItem[];
  note: string;
  /** Public BenefitPay number/account (mirrors the sealed Details field, served via /api/gifts). */
  benefit: string;
  /** Public IBAN for bank transfers, same source of truth as the sealed invitation fields. */
  iban: string;
};

/** The cheap polling payload — claim state only, never notes or pictures. */
export type GiftState = Pick<GiftItem, "id" | "claimed" | "claimed_at"> & { claimed_by?: string };
export type GiftActionResult = { ok: boolean; error?: string };

/** Display order everywhere: the couple's `order`, then title. */
export const sortGifts = (rows: GiftItem[]): GiftItem[] =>
  [...rows].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

function readLocalItems(): GiftItem[] {
  if (typeof localStorage === "undefined") return SEED.gift_items as GiftItem[];
  const raw = localStorage.getItem(ITEMS_KEY);
  if (raw) {
    try {
      return sortGifts(JSON.parse(raw) as GiftItem[]);
    } catch {
      /* corrupted row — reseed below */
    }
  }
  const seeded = SEED.gift_items as GiftItem[];
  localStorage.setItem(ITEMS_KEY, JSON.stringify(seeded));
  return sortGifts(seeded);
}

function writeLocalItems(rows: GiftItem[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: "gift_items" }));
}

function readLocalNote(): string {
  return (typeof localStorage !== "undefined" && localStorage.getItem(NOTE_KEY)) || "";
}

/**
 * The board as guests see it: ordered items plus the public monetary-gift note.
 * Returns null when a Supabase-mode fetch fails, so callers can keep what's already on screen
 * instead of blanking the transfer card mid-visit. Local/demo mode always resolves a board.
 */
export async function listGifts(): Promise<GiftBoard | null> {
  const fallback = async (): Promise<GiftBoard> => {
    const rows = await listTable("wedding_info");
    const info = rows[0] ?? SEED.wedding_info[0];
    const defaults = SEED.wedding_info[0];
    return {
      items: readLocalItems(),
      note: readLocalNote() || DEFAULT_REGISTRY_NOTE,
      // In local/demo mode the wedding-info table is the source of truth for transfer details.
      // Merge old saved rows with current defaults so legacy browser data doesn't flash values
      // from SEED and then replace them with an incomplete row.
      benefit: String(info.benefitpay_number ?? defaults.benefitpay_number ?? "").trim(),
      iban: String(info.benefitpay_iban ?? defaults.benefitpay_iban ?? "").trim(),
    };
  };
  if ((await getMode()) === "local") return fallback();
  try {
    const r = await fetch("/api/gifts", { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: GiftItem[]; note?: string; benefit?: string; iban?: string };
    const items = j.items?.length ? sortGifts(j.items) : readLocalItems();
    return {
      items,
      note: j.note || DEFAULT_REGISTRY_NOTE,
      benefit: (j.benefit || "").trim(),
      iban: (j.iban || "").trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Lightweight live refresh: claim state only. The page calls this every few seconds so crossed-off
 * items appear on other guests' phones without re-downloading the (possibly image-heavy) board.
 */
export async function pollGiftState(): Promise<GiftState[]> {
  if ((await getMode()) === "local") {
    return readLocalItems().map((g) => ({
      id: g.id,
      claimed: g.claimed,
      claimed_by: g.claimed_by,
      claimed_at: g.claimed_at ?? null,
    }));
  }
  try {
    const r = await fetch("/api/gifts?light=1", { cache: "no-store" });
    if (!r.ok) return [];
    const j = (await r.json()) as { items?: GiftState[] };
    return j.items ?? [];
  } catch {
    return [];
  }
}

/** Binder only: save the public wording above the list. */
export async function saveRegistryNote(note: string): Promise<void> {
  const trimmed = note.trim();
  if ((await getMode()) === "local") {
    localStorage.setItem(NOTE_KEY, trimmed);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: "gift_items" }));
    return;
  }
  const r = await fetch("/api/gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "note", note: trimmed }),
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || "Couldn't save the note — please try again.");
  }
}

/** Mark a gift bought. The server's conditional update settles two-guest races; 409 = lost the race. */
export async function claimGift(id: string, name: string): Promise<GiftActionResult> {
  const who = name.trim().slice(0, 120);
  if (!who) return { ok: false, error: "Please add your name before choosing a gift." };
  if ((await getMode()) === "local") {
    const rows = readLocalItems();
    const target = rows.find((g) => g.id === id);
    if (!target) return { ok: false, error: "That gift is no longer on the list." };
    if (target.claimed)
      return {
        ok: false,
        error: `“${target.title}” is no longer available.`,
      };
    const now = new Date().toISOString();
    writeLocalItems(rows.map((g) => (g.id === id ? { ...g, claimed: true, claimed_by: who, claimed_at: now } : g)));
    return { ok: true };
  }
  try {
    const r = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim", id, name: who }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return { ok: false, error: j.error || "That didn't go through — please try again." };
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: "gift_items" }));
    return { ok: true };
  } catch {
    return { ok: false, error: "You seem to be offline — please try again in a little while." };
  }
}
