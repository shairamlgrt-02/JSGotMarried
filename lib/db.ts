"use client";
import { SEED } from "./seed";
import type { Guest, TableMap, TableName } from "./types";

/**
 * Data layer shared by the public site and the admin binder.
 * - Supabase mode: every call goes through /api routes (service key stays on the server).
 * - Local mode (no Supabase env): data lives in this browser's localStorage, seeded with SEED.
 */
export type Mode = "supabase" | "local";
let modePromise: Promise<Mode> | null = null;
export function getMode(): Promise<Mode> {
  if (!modePromise)
    modePromise = fetch("/api/mode").then((r) => r.json()).then((j) => j.mode as Mode).catch(() => "local");
  return modePromise;
}

const KEY = (t: TableName) => `jsos:${t}`;
const EVT = "jsos:change";

/** Bump when the default program/entourage/FAQ change so browsers pick up the new defaults once. */
const SEED_VERSION = "4";
const REFRESH: TableName[] = ["schedule", "entourage", "faq", "attire"];
function localRead<T extends TableName>(t: T): TableMap[T][] {
  if (localStorage.getItem("jsos:seedv") !== SEED_VERSION) {
    REFRESH.forEach((r) => localStorage.removeItem(KEY(r)));
    localStorage.setItem("jsos:seedv", SEED_VERSION);
  }
  const raw = localStorage.getItem(KEY(t));
  if (raw) try { return JSON.parse(raw); } catch {}
  const seeded = SEED[t] as TableMap[T][];
  localStorage.setItem(KEY(t), JSON.stringify(seeded));
  return seeded;
}
function localWrite<T extends TableName>(t: T, rows: TableMap[T][]) {
  localStorage.setItem(KEY(t), JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
}

export async function list<T extends TableName>(t: T): Promise<TableMap[T][]> {
  if ((await getMode()) === "local") return localRead(t);
  const r = await fetch(`/api/data/${t}`, { cache: "no-store" });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  const rows = (await r.json()) as TableMap[T][];
  // Empty remote table on first run → fall back to seed for public display tables
  return rows.length || t === "guests" ? rows : (SEED[t] as TableMap[T][]);
}

export async function upsert<T extends TableName>(t: T, row: TableMap[T] | TableMap[T][]) {
  const rows = Array.isArray(row) ? row : [row];
  if ((await getMode()) === "local") {
    const cur = localRead(t) as (TableMap[T] & { id: string })[];
    for (const r of rows as (TableMap[T] & { id: string })[]) {
      const i = cur.findIndex((x) => x.id === r.id);
      if (i >= 0) cur[i] = r; else cur.push(r);
    }
    localWrite(t, cur);
    return;
  }
  const r = await fetch(`/api/data/${t}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
}

export async function remove(t: TableName, id: string) {
  if ((await getMode()) === "local") {
    localWrite(t, (localRead(t) as { id: string }[]).filter((x) => x.id !== id) as never);
    return;
  }
  const r = await fetch(`/api/data/${t}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
}

export type InviteReply = {
  name: string; attending: "yes" | "no"; pax: number; plus_one: string;
  approved: boolean | null; dietary: string; song_request: string; message: string;
};
export type InviteState = { name: string; pax: number; reply: InviteReply | null; demo?: boolean };

/**
 * Perpetual test invite: …/JS-DEMO (or /test) unseals the whole site and runs the full
 * RSVP journey with throwaway data — demo replies live only in the tester's browser
 * (localStorage), never reach Supabase and never e-mail the couple.
 */
export const DEMO_CODE = "JS-DEMO";
const DEMO_HOUSEHOLD = "The Demo Household";
const demoReplyKey = "jsos:demo-reply";
const readDemoReply = (): InviteReply | null => {
  try { return JSON.parse(localStorage.getItem(demoReplyKey) || "null"); } catch { return null; }
};

/**
 * Open a personal invitation link: the server answers for Supabase projects, and local
 * (browser-only) mode validates against this device's list so the couple can rehearse.
 */
export async function fetchInvite(code: string): Promise<InviteState | null> {
  const cc = code.trim().toUpperCase();
  if (cc.length < 4) return null;
  if (cc === DEMO_CODE) return { name: DEMO_HOUSEHOLD, pax: 2, reply: readDemoReply(), demo: true };
  try {
    const r = await fetch(`/api/rsvp?code=${encodeURIComponent(cc)}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      if (j.ok) return { name: j.name as string, pax: Number(j.pax) || 1, reply: (j.reply as InviteReply) || null };
    }
    if (r.status !== 503) return null; // unknown / malformed code
  } catch { /* offline — fall through to local */ }
  const rows = localRead("guests") as Guest[];
  const same = rows.filter((g) => (g.code || "").toUpperCase() === cc);
  const invite = same.find((g) => g.approved === null || g.approved === undefined);
  const reply = same.find((g) => g.approved !== null && g.approved !== undefined);
  if (!invite && !reply) return null;
  return {
    name: invite?.name ?? reply!.name,
    pax: Number(invite?.pax ?? reply?.pax) || 1,
    reply: reply
      ? { name: reply.name, attending: reply.attending === "no" ? "no" : "yes", pax: reply.pax, plus_one: reply.plus_one || "", approved: reply.approved ?? null, dietary: reply.dietary || "", song_request: reply.song_request || "", message: reply.message || "" }
      : null,
  };
}

export async function submitRsvp(g: Omit<Guest, "id" | "source" | "created_at"> & { code?: string; plus_one?: string }): Promise<{ approved: boolean | null; already: boolean }> {
  if ((g.code || "").toUpperCase() === DEMO_CODE) {
    // throwaway loop: seal a demo reply in this browser only, so reopen shows the welcome card
    if (readDemoReply()) return { approved: null, already: true };
    const approved = (g.pax ?? 1) === 1;
    const reply: InviteReply = { name: g.name || "Demo Guest", attending: g.attending === "no" ? "no" : "yes", pax: g.pax ?? 1, plus_one: g.plus_one || "", approved, dietary: g.dietary || "", song_request: g.song_request || "", message: g.message || "" };
    try { localStorage.setItem(demoReplyKey, JSON.stringify(reply)); } catch {}
    return { approved, already: false };
  }
  // The server saves to Supabase and e-mails the couple; the browser keeps a copy only when the server can't be reached.
  try {
    const r = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(g) });
    if (r.status === 409) return { approved: null, already: true };
    if (r.ok) { const j = await r.json().catch(() => ({})); return { approved: typeof j.approved === "boolean" ? j.approved : null, already: false }; }
  } catch { /* offline or dev without env — fall through */ }
  // local mode: mirror the server rules (one code, one reply; a second seat waits for review)
  const cur = localRead("guests") as Guest[];
  const cc = (g.code || "").toUpperCase();
  if (cc && cur.some((x) => (x.code || "").toUpperCase() === cc && x.approved !== null && x.approved !== undefined)) return { approved: null, already: true };
  const invite = cc ? cur.find((x) => (x.code || "").toUpperCase() === cc && (x.approved === null || x.approved === undefined)) : null;
  const approved = invite && (g.pax ?? 1) <= 1 ? true : false;
  cur.push({ ...g, id: crypto.randomUUID(), source: "RSVP form", created_at: new Date().toISOString(), approved } as Guest);
  localWrite("guests", cur);
  return { approved, already: false };
}

export function resetLocal() {
  for (const t of Object.keys(SEED) as TableName[]) localStorage.removeItem(KEY(t));
  window.dispatchEvent(new CustomEvent(EVT, { detail: "*" }));
}

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const CHANGE_EVENT = EVT;
