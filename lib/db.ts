"use client";
import { SEED } from "./seed";
import { fixRows } from "./content-fix";
import { TABLES } from "./types";
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

/** Bump when the default program/entourage/FAQ/story change so browsers pick up the new defaults once. */
const SEED_VERSION = "17"; // round 23: Our Story rewritten — five chapters on the real timeline, landing on 1 Cor 11:11
const REFRESH: TableName[] = ["schedule", "entourage", "faq", "attire", "story"];
function localRead<T extends TableName>(t: T): TableMap[T][] {
  if (localStorage.getItem("jsos:seedv") !== SEED_VERSION) {
    REFRESH.forEach((r) => localStorage.removeItem(KEY(r)));
    localStorage.setItem("jsos:seedv", SEED_VERSION);
  }
  const raw = localStorage.getItem(KEY(t));
  let stored: TableMap[T][] | null = null;
  if (raw) try { stored = JSON.parse(raw); } catch {}
  // Wording renamed in the code (#JSWeDo → #JSSayIDo) is repaired here too, and written back once,
  // so a browser that seeded before the rename shows the current copy without a reset.
  const { rows, patches } = fixRows(t, stored ?? (SEED[t] as TableMap[T][]));
  if (!stored || patches.length) localStorage.setItem(KEY(t), JSON.stringify(rows));
  return rows;
}
function localWrite<T extends TableName>(t: T, rows: TableMap[T][]) {
  localStorage.setItem(KEY(t), JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
}

export async function list<T extends TableName>(t: T, code = ""): Promise<TableMap[T][]> {
  // The public site passes the guest's invitation code along: the server answers with the
  // private pages (venue, programme, FAQ) only for a code it actually issued. The binder
  // doesn't need it — its cookie already says who you are.
  const q = code ? `?code=${encodeURIComponent(code)}` : "";
  // Probe the mode AND request the rows at the same time — a fresh tab would otherwise
  // wait for /api/mode before the data request even starts (two serial round trips).
  // In local mode the stray request 503s quietly on the server; the browser never throws.
  const remote = fetch(`/api/data/${t}${q}`, { cache: "no-store" }).then(
    async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }),
    () => ({ ok: false, data: {} }),
  );
  if ((await getMode()) === "local") return localRead(t);
  const r = await remote;
  if (!r.ok) throw new Error((r.data as { error?: string }).error || "failed to load");
  const rows = r.data as TableMap[T][];
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
export type InviteState = { name: string; pax: number; reply: InviteReply | null; demo?: boolean;
  /** The household's full code — what a guest typed at /rsvp is often only its last 4 characters. */
  code?: string;
  /**
   * The couple's own label for this link ("Ana & Ivan") — printed above the reply card. `name` is
   * what pre-fills the form, and it is deliberately left blank so the guest types their own.
   */
  label?: string;
}

/**
 * A guest row is a *reply* once `approved` is set (true = confirmed, false = waiting for the
 * couple). Before that it is the plain invitation row the couple typed by hand. One code,
 * one row: the reply overwrites the invitation instead of adding a second row. And the
 * perpetual test invite JS-DEMO lives with those helpers, so the server routes and the browser
 * agree on one code — demo replies stay in this browser only (localStorage), never reach
 * Supabase and never e-mail the couple.
 */
import { DEMO_CODE, codeMatches, hasReplied, isReply, whoIsItFor } from "./guests";
export { DEMO_CODE, isReply };
const DEMO_HOUSEHOLD = "The Demo Household";
const demoReplyKey = "jsos:demo-reply";
const readDemoReply = (): InviteReply | null => {
  try { return JSON.parse(localStorage.getItem(demoReplyKey) || "null"); } catch { return null; }
};

/**
 * Open a personal invitation link. The server answers for Supabase projects; local
 * (browser-only) mode validates against this device's list so the couple can rehearse.
 * A guest may type the whole code (`JS-7KQF`) or just the last four characters of their link
 * (`7KQF`) in any case — and the answer always carries the household's canonical code, so a
 * reply typed at /rsvp lands on the same row the link would have used.
 */
export type InviteFound = { state: InviteState; code: string };
export type InviteResult = { ok: true; found: InviteFound } | { ok: false; error: string };

export async function resolveInvite(code: string): Promise<InviteResult> {
  const cc = code.trim().toUpperCase();
  if (cc.length < 3) return { ok: false, error: "That code is too short — check the four characters at the end of your link." };
  if (cc === DEMO_CODE) {
    const reply = readDemoReply();
    return { ok: true, found: { code: DEMO_CODE, state: { name: DEMO_HOUSEHOLD, label: DEMO_HOUSEHOLD, pax: 2, reply, code: DEMO_CODE, demo: true } } };
  }
  try {
    const r = await fetch(`/api/rsvp?code=${encodeURIComponent(cc)}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok)
      return { ok: true, found: { code: (j.code as string) || cc, state: { name: j.name as string, label: (j.label as string) || (j.name as string) || "", pax: Number(j.pax) || 1, reply: (j.reply as InviteReply) || null, code: (j.code as string) || cc } } };
    if (j.ambiguous) return { ok: false, error: "That code belongs to more than one invitation — open the personal link the couple sent you." };
    if (r.status !== 503) return { ok: false, error: "We couldn't match that code to an invitation. Try the full code from your link (it looks like JS-7KQF), or ask the couple for it." };
  } catch { /* offline — fall through to the list saved in this browser */ }
  const rows = localRead("guests") as Guest[];
  const hits = Array.from(new Set(rows.map((g) => (g.code || "").trim().toUpperCase()).filter((c) => c && codeMatches(c, cc))));
  if (hits.length > 1) return { ok: false, error: "That code belongs to more than one invitation — open the personal link the couple sent you." };
  const same = rows.filter((g) => (g.code || "").trim().toUpperCase() === hits[0]);
  const invite = same.find((g) => !isReply(g));
  const reply = same.find(isReply);
  if (!invite && !reply) return { ok: false, error: "We couldn't match that code to an invitation on this device. Codes issued here start with JS-." };
  return {
    ok: true,
    found: {
      code: hits[0],
      state: {
        name: invite?.name ?? reply!.name,
        label: whoIsItFor(invite ?? reply!),
        pax: Number(invite?.pax ?? reply?.pax) || 1,
        // a code that has been opened is stamped, so the binder's ledger shows it as "opened"
        code: hits[0],
        reply: reply
          ? { name: reply.name, attending: reply.attending === "no" ? "no" : "yes", pax: reply.pax, plus_one: reply.plus_one || "", approved: reply.approved ?? null, dietary: reply.dietary || "", song_request: reply.song_request || "", message: reply.message || "" }
          : null,
      },
    },
  };
}

if (typeof window !== "undefined") {
  // opening the link is the "they looked at it" signal in local mode too (the server stamps it
  // on its side); written once, quietly.
  window.addEventListener("jsos:invite-opened", ((e: CustomEvent) => {
    const cc = String(e.detail || "");
    const rows = localRead("guests") as Guest[];
    const hit = rows.find((g) => codeMatches(g.code || "", cc) && !hasReplied(g) && !g.viewed_at);
    if (!hit) return;
    localWrite("guests", rows.map((g) => (g.id === hit.id ? { ...g, viewed_at: new Date().toISOString() } : g)));
  }) as EventListener);
}

/** The invitation a personal link unlocks — `null` when the code isn't one the couple issued. */
export async function fetchInvite(code: string): Promise<InviteState | null> {
  const r = await resolveInvite(code);
  if (!r.ok) return null;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("jsos:invite-opened", { detail: code }));
  return r.found.state;
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
  // local mode: mirror the server rules — one code, one row; the reply overwrites the
  // invitation in place (same id) and a second seat waits for the couple's review.
  const cur = localRead("guests") as Guest[];
  const cc = (g.code || "").trim().toUpperCase();
  const canonical = Array.from(new Set(cur.map((x) => (x.code || "").trim().toUpperCase()).filter((c) => c && codeMatches(c, cc))))[0] || cc;
  const same = cc ? cur.filter((x) => (x.code || "").trim().toUpperCase() === canonical) : [];
  if (same.some(isReply)) return { approved: null, already: true };
  const invite = same.find((x) => !isReply(x)) || null;
  const declined = g.attending === "no";
  const wantsPax = g.pax === 2 ? 2 : 1;
  const pax = declined ? 0 : Math.min(wantsPax, Number(invite?.pax) || 1);
  const approved = declined || pax === 1; // a second seat waits for the couple, exactly as on the server
  const row: Guest = { ...g, pax, id: invite?.id ?? crypto.randomUUID(), code: canonical, source: "RSVP form", created_at: new Date().toISOString(), viewed_at: invite?.viewed_at ?? new Date().toISOString(), approved } as Guest;
  const i = cur.findIndex((x) => x.id === row.id);
  if (i >= 0) cur[i] = row; else cur.push(row);
  localWrite("guests", cur);
  return { approved, already: false };
}

export function resetLocal() {
  for (const t of Object.keys(SEED) as TableName[]) localStorage.removeItem(KEY(t));
  window.dispatchEvent(new CustomEvent(EVT, { detail: "*" }));
}

/**
 * Rows exactly as the database holds them — no seed fallback. The safe push must never mistake
 * an empty (or missing) row for a seeded one.
 */
async function listStored<T extends TableName>(t: T): Promise<TableMap[T][]> {
  if ((await getMode()) === "local") return localRead(t);
  const r = await fetch(`/api/data/${t}`, { cache: "no-store" });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
  return (await r.json()) as TableMap[T][];
}

export type SeedPushReport = { added: number; refreshed: string[] };
/** What a copy refresh did: standard rows rewritten in place, plus any that had been deleted and came back. */
export type CopyRefreshReport = { rewritten: number; added: number };

function copyReport(seeded: { id: string }[], stored: { id: string }[]): CopyRefreshReport {
  return {
    rewritten: seeded.filter((s) => stored.some((c) => c.id === s.id)).length,
    added: seeded.filter((s) => !stored.some((c) => c.id === s.id)).length,
  };
}
/**
 * Rewrite the standard FAQ questions with the latest wording from the code. The ordinary
 * "push starter data" only ever fills in *missing* rows, so copy that changed after the
 * binder was first seeded (the dress-code palette, the kids' policy…) would never reach a
 * live project — this is the one-click way. Questions the couple wrote themselves are never
 * touched: only the seeded ids (f0, f1, f2…) are rewritten, and a deleted one comes back.
 */
export async function refreshFaqCopy(): Promise<CopyRefreshReport> {
  const stored = await listStored("faq");
  await upsert("faq", SEED.faq as never);
  window.dispatchEvent(new CustomEvent(EVT, { detail: "faq" }));
  return copyReport(SEED.faq as { id: string }[], stored as { id: string }[]);
}
/**
 * Latest wording of the five Our Story chapters — titles and text only. A chapter's photo is the
 * couple's own upload, so it is carried across instead of being blanked by the starter row.
 */
export async function refreshStoryCopy(): Promise<CopyRefreshReport> {
  type Row = { id: string; photo: string };
  const stored = (await listStored("story")) as Row[];
  const merged = (SEED.story as Row[]).map((s) => ({ ...s, photo: stored.find((c) => c.id === s.id)?.photo || s.photo }));
  await upsert("story", merged as never);
  window.dispatchEvent(new CustomEvent(EVT, { detail: "story" }));
  return copyReport(SEED.story as Row[], stored);
}
/**
 * “Push starter data”, the gentle way:
 *  · guests — never touched: the guest list, the RSVPs and the invite codes stay exactly as they are;
 *  · attire — refreshed fully from the code palette (the swatches live in code);
 *  · every other table, wedding_info included — only rows whose id is missing are added, so the
 *    couple's details, cover photo, gallery, song, schedule, budget, vendors, checklist,
 *    entourage and FAQ are never overwritten.
 */
export async function pushSeedSafely(): Promise<SeedPushReport> {
  const report: SeedPushReport = { added: 0, refreshed: [] };
  for (const t of TABLES) {
    if (t === "guests") continue;
    const stored = (await listStored(t)) as { id: string }[];
    if (t === "attire") {
      const seedRows = SEED.attire as { id: string }[];
      for (const row of stored) if (!seedRows.some((s) => s.id === row.id)) await remove("attire", row.id);
      await upsert("attire", SEED.attire as never);
      report.refreshed.push(t);
      continue;
    }
    const missing = (SEED[t] as { id: string }[]).filter((s) => !stored.some((c) => c.id === s.id));
    if (missing.length) {
      await upsert(t as TableName, missing as never);
      report.added += missing.length;
    }
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: "*" }));
  return report;
}

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const CHANGE_EVENT = EVT;
