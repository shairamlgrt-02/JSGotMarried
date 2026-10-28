import { CHANGE_EVENT, getMode } from "./db";
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
 * present bought. A guest may only release a claim from the same device that made it — the ids
 * are remembered in localStorage — while the binder can release any claim.
 */

const ITEMS_KEY = "jsos:gift_items";
const NOTE_KEY = "jsos:registry-note";
const DEVICE_CLAIMS_KEY = "jsos:gift-claims-v1";

export type GiftBoard = {
  items: GiftItem[];
  note: string;
  /** Public BenefitPay number/account (mirrors the sealed Details field, served via /api/gifts). */
  benefit: string;
  /** Public IBAN for bank transfers, same source of truth as the sealed invitation fields. */
  iban: string;
};
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

/** Ids this device has claimed — the only claims the page shows a release button for. */
export function deviceClaims(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const ids = JSON.parse(localStorage.getItem(DEVICE_CLAIMS_KEY) || "[]");
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isMyClaim(id: string): boolean {
  return deviceClaims().includes(id);
}

function rememberClaim(id: string) {
  localStorage.setItem(DEVICE_CLAIMS_KEY, JSON.stringify([...new Set([...deviceClaims(), id])]));
}

function forgetClaim(id: string) {
  localStorage.setItem(DEVICE_CLAIMS_KEY, JSON.stringify(deviceClaims().filter((x) => x !== id)));
}

/** The board as guests see it: ordered items plus the public monetary-gift note. */
export async function listGifts(): Promise<GiftBoard> {
  const fallback = (): GiftBoard => ({
    items: readLocalItems(),
    note: readLocalNote() || DEFAULT_REGISTRY_NOTE,
    // In local mode the generic table read (the page's useTable) already carries these fields.
    benefit: "",
    iban: "",
  });
  if ((await getMode()) === "local") return fallback();
  try {
    const r = await fetch("/api/gifts", { cache: "no-store" });
    if (!r.ok) return fallback();
    const j = (await r.json()) as { items?: GiftItem[]; note?: string; benefit?: string; iban?: string };
    const items = j.items?.length ? sortGifts(j.items) : readLocalItems();
    return {
      items,
      note: j.note || DEFAULT_REGISTRY_NOTE,
      benefit: (j.benefit || "").trim(),
      iban: (j.iban || "").trim(),
    };
  } catch {
    return fallback();
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
  if ((await getMode()) === "local") {
    const rows = readLocalItems();
    const target = rows.find((g) => g.id === id);
    if (!target) return { ok: false, error: "That gift is no longer on the list." };
    if (target.claimed)
      return {
        ok: false,
        error: target.claimed_by
          ? `“${target.title}” was just bought by ${target.claimed_by}.`
          : `“${target.title}” was just bought by someone else.`,
      };
    const now = new Date().toISOString();
    writeLocalItems(rows.map((g) => (g.id === id ? { ...g, claimed: true, claimed_by: who, claimed_at: now } : g)));
    rememberClaim(id);
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
    rememberClaim(id);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: "gift_items" }));
    return { ok: true };
  } catch {
    return { ok: false, error: "You seem to be offline — please try again in a little while." };
  }
}

/** Put a gift back on the list. Offered on the guest page only for claims made on this device. */
export async function releaseGift(id: string): Promise<GiftActionResult> {
  if ((await getMode()) === "local") {
    const rows = readLocalItems();
    if (!rows.some((g) => g.id === id)) return { ok: false, error: "That gift is no longer on the list." };
    writeLocalItems(rows.map((g) => (g.id === id ? { ...g, claimed: false, claimed_by: "", claimed_at: null } : g)));
    forgetClaim(id);
    return { ok: true };
  }
  try {
    const r = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release", id }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return { ok: false, error: j.error || "That didn't go through — please try again." };
    forgetClaim(id);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: "gift_items" }));
    return { ok: true };
  } catch {
    return { ok: false, error: "You seem to be offline — please try again in a little while." };
  }
}
