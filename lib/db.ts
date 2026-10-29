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
let sessionPromise: Promise<{ mode: Mode; admin: boolean }> | null = null;
function getSession(): Promise<{ mode: Mode; admin: boolean }> {
  if (!sessionPromise)
    sessionPromise = fetch("/api/mode")
      .then((r) => r.json())
      .then((j) => ({ mode: (j.mode as Mode) || "local", admin: Boolean(j.admin) }))
      .catch(() => ({ mode: "local" as Mode, admin: false }));
  return sessionPromise;
}
export function getMode(): Promise<Mode> {
  return getSession().then((s) => s.mode);
}
export function getAdmin(): Promise<boolean> {
  return getSession().then((s) => s.admin);
}

const KEY = (t: TableName) => `jsos:${t}`;
const EVT = "jsos:change";

/** Bump when the default program/entourage/FAQ/story change so browsers pick up the new defaults once. */
const SEED_VERSION = "19"; // round 25: the bridesmaids' palette — Amethyst retired; Ruby stays with Turquoise, Citrine and Sapphire
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

/**
 * In-memory cache + in-flight request deduplication for remote tables.
 * Prevents duplicate multi-megabyte fetches (e.g. PrintBinder + active tab mounting together,
 * switching tabs in the Binder, or jsos:change reloading after an upsert).
 */
const remoteCache = new Map<string, unknown[]>();
const inflight = new Map<string, Promise<unknown[]>>();

const isMissingTableError = (msg: string) =>
  /Could not find the table|relation .* does not exist|schema cache/i.test(msg);

function saveLocalRows<T extends TableName>(t: T, incoming: TableMap[T][]): TableMap[T][] {
  const cur = localRead(t) as (TableMap[T] & { id: string })[];
  for (const r of incoming as (TableMap[T] & { id: string })[]) {
    const i = cur.findIndex((x) => x.id === r.id);
    if (i >= 0) cur[i] = r; else cur.push(r);
  }
  localStorage.setItem(KEY(t), JSON.stringify(cur));
  return cur;
}

function clearTableCache(t: TableName) {
  for (const k of Array.from(remoteCache.keys())) {
    if (k === t || k.startsWith(`${t}:`)) remoteCache.delete(k);
  }
}

/** Force a live reload of one or more tables from the backing store (e.g. fresh link opens & RSVPs). */
export function refreshTables(...tables: TableName[]) {
  if (!tables.length) return;
  for (const t of tables) clearTableCache(t);
  if (typeof window !== "undefined") {
    for (const t of tables) window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
  }
}

if (typeof window !== "undefined") {
  let lastFocusRefresh = 0;
  const onFocusOrVisible = () => {
    if (document.visibilityState === "hidden") return;
    const now = Date.now();
    if (now - lastFocusRefresh < 4000) return;
    lastFocusRefresh = now;
    void getSession().then((s) => {
      if (s.admin) refreshTables("messages", "guests");
    });
  };
  window.addEventListener("focus", onFocusOrVisible);
  document.addEventListener("visibilitychange", onFocusOrVisible);
}

export async function list<T extends TableName>(t: T, code = ""): Promise<TableMap[T][]> {
  // The public site passes the guest's invitation code along: the server answers with the
  // private pages (venue, programme, FAQ) only for a code it actually issued. The binder
  // doesn't need it — its cookie already says who you are.
  const cacheKey = `${t}:${code}`;
  if (remoteCache.has(cacheKey)) return remoteCache.get(cacheKey) as TableMap[T][];
  if (inflight.has(cacheKey)) return inflight.get(cacheKey) as Promise<TableMap[T][]>;

  const q = code ? `?code=${encodeURIComponent(code)}` : "";
  const task = (async () => {
    // Probe the mode AND request the rows at the same time — a fresh tab would otherwise
    // wait for /api/mode before the data request even starts (two serial round trips).
    // In local mode the stray request 503s quietly on the server; the browser never throws.
    const remote = fetch(`/api/data/${t}${q}`, { cache: "no-store" }).then(
      async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }),
      () => ({ ok: false, data: {} }),
    );
    if ((await getMode()) === "local") return localRead(t);
    const r = await remote;
    if (!r.ok) {
      const errMsg = (r.data as { error?: string }).error || "failed to load";
      // If a newer binder table (e.g. message_templates, messages, bridesmaid_cards) hasn't been
      // created in Supabase yet, fall back to localStorage so edits still persist across tabs.
      if (isMissingTableError(errMsg)) {
        const local = localRead(t);
        remoteCache.set(cacheKey, local);
        return local;
      }
      throw new Error(errMsg);
    }
    const rows = r.data as TableMap[T][];
    // If the remote table was just created and is empty, carry over any rows saved locally before the SQL ran.
    if (!rows.length && (t === "message_templates" || t === "messages" || t === "bridesmaid_cards")) {
      const local = localRead(t);
      if (local.length) {
        remoteCache.set(cacheKey, local);
        void fetch(`/api/data/${t}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(local) }).catch(() => {});
        return local;
      }
    }
    // Empty remote table on first run → fall back to seed for public display tables
    const result = rows.length || t === "guests" ? rows : (SEED[t] as TableMap[T][]);
    remoteCache.set(cacheKey, result);
    return result;
  })();

  inflight.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inflight.delete(cacheKey);
  }
}

export async function upsert<T extends TableName>(t: T, row: TableMap[T] | TableMap[T][]) {
  const rows = Array.isArray(row) ? row : [row];
  if ((await getMode()) === "local") {
    const cur = saveLocalRows(t, rows);
    localWrite(t, cur);
    return;
  }
  const r = await fetch(`/api/data/${t}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
  if (!r.ok) {
    const errMsg = ((await r.json().catch(() => ({}))) as { error?: string }).error || r.statusText;
    if (isMissingTableError(errMsg)) {
      const cur = saveLocalRows(t, rows);
      remoteCache.set(`${t}:`, cur);
      window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
      return;
    }
    clearTableCache(t);
    throw new Error(errMsg);
  }
  if (t === "message_templates" || t === "messages" || t === "bridesmaid_cards") {
    saveLocalRows(t, rows);
  }
  for (const [k, cached] of Array.from(remoteCache.entries())) {
    if (k === t || k.startsWith(`${t}:`)) {
      const cur = [...(cached as (TableMap[T] & { id: string })[])];
      for (const item of rows as (TableMap[T] & { id: string })[]) {
        const i = cur.findIndex((x) => x.id === item.id);
        if (i >= 0) cur[i] = item; else cur.push(item);
      }
      remoteCache.set(k, cur);
    }
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
}

export async function remove(t: TableName, id: string) {
  if ((await getMode()) === "local") {
    localWrite(t, (localRead(t) as { id: string }[]).filter((x) => x.id !== id) as never);
    return;
  }
  const r = await fetch(`/api/data/${t}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!r.ok) {
    const errMsg = ((await r.json().catch(() => ({}))) as { error?: string }).error || r.statusText;
    if (isMissingTableError(errMsg)) {
      const next = (localRead(t) as { id: string }[]).filter((x) => x.id !== id);
      localStorage.setItem(KEY(t), JSON.stringify(next));
      remoteCache.set(`${t}:`, next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
      return;
    }
    clearTableCache(t);
    throw new Error(errMsg);
  }
  if (t === "message_templates" || t === "messages" || t === "bridesmaid_cards") {
    const next = (localRead(t) as { id: string }[]).filter((x) => x.id !== id);
    localStorage.setItem(KEY(t), JSON.stringify(next));
  }
  for (const [k, cached] of Array.from(remoteCache.entries())) {
    if (k === t || k.startsWith(`${t}:`)) {
      remoteCache.set(k, (cached as { id: string }[]).filter((x) => x.id !== id));
    }
  }
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
import { DEMO_CODE, codeMatches, hasReplied, isReply, MAX_RSVP_SEATS, planParty, seatCapFor, whoIsItFor } from "./guests";
import type { MessageLog } from "./types";
export { DEMO_CODE, isReply };
const DEMO_HOUSEHOLD = "The Demo Household";
const demoReplyKey = "jsos:demo-reply";
const readDemoReply = (): InviteReply | null => {
  try { return JSON.parse(localStorage.getItem(demoReplyKey) || "null"); } catch { return null; }
};

const VISIT_DEDUP_MS = 5 * 60_000;
function claimVisitTracking(key: string): boolean {
  if (!key || typeof window === "undefined") return false;
  try {
    const sk = `jsos:visit:${key}`;
    const prev = Number(sessionStorage.getItem(sk) || 0);
    if (prev && Date.now() - prev < VISIT_DEDUP_MS) return false;
    sessionStorage.setItem(sk, String(Date.now()));
  } catch { /* private mode without sessionStorage — allow once */ }
  return true;
}

function recordLocalMessageOpen(opts: {
  messageId?: string;
  guest?: Guest;
  guestId?: string;
  code?: string;
  via?: "rsvp" | "invite";
}) {
  const msgId = (opts.messageId || "").trim();
  const guest = opts.guest;
  const guestId = (opts.guestId || guest?.id || "").trim();
  const via = opts.via === "rsvp" ? "rsvp" : "invite";
  const now = new Date().toISOString();
  const msgs = localRead("messages") as MessageLog[];
  let changed = false;
  if (msgId) {
    const next = msgs.map((m) => {
      if (m.id !== msgId) return m;
      changed = true;
      return { ...m, link_opens: (Number(m.link_opens) || 0) + 1, opened_at: now };
    });
    if (changed) {
      localWrite("messages", next);
      return;
    }
  }
  if (guestId) {
    const matching = msgs
      .filter((m) => m.recipient_id === `gst_${guestId}` && m.sent && !m.id.startsWith("link_"))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    if (matching.length) {
      const unopened = matching.filter((m) => !(Number(m.link_opens) > 0));
      const targetIds = new Set((unopened.length ? unopened : [matching[0]]).map((m) => m.id));
      localWrite(
        "messages",
        msgs.map((m) => (targetIds.has(m.id) ? { ...m, link_opens: (Number(m.link_opens) || 0) + 1, opened_at: now } : m)),
      );
      return;
    }
    const autoId = `link_${via}_${guestId}`;
    const existingAuto = msgs.find((m) => m.id === autoId);
    if (existingAuto) {
      localWrite(
        "messages",
        msgs.map((m) => (m.id === autoId ? { ...m, link_opens: (Number(m.link_opens) || 0) + 1, opened_at: now, created_at: now } : m)),
      );
    } else if (guest) {
      const canonical = (opts.code || guest.code || "").trim().toUpperCase();
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const fullLink = canonical ? `${base}/${canonical}${via === "rsvp" ? "#rsvp" : ""}` : base;
      localWrite("messages", [
        ...msgs,
        {
          id: autoId,
          template_id: via === "rsvp" ? "distributed_rsvp_link" : "distributed_invite_link",
          template_name: via === "rsvp" ? "RSVP Link (#rsvp)" : "Invitation Link",
          original_body: "",
          body: fullLink,
          recipient_id: `gst_${guestId}`,
          recipient_name: whoIsItFor(guest) || guest.name || canonical,
          recipient_phone: guest.phone || "",
          category: via === "rsvp" ? "RSVP Link (#rsvp)" : "Invitation Link",
          sent: true,
          responded: isReply(guest) || guest.attending !== "pending",
          link_opens: 1,
          opened_at: now,
          sent_at: guest.sent_at || guest.created_at || now,
          created_at: now,
        },
      ]);
    }
  }
}

/**
 * Record an open when a recipient opens a link carrying `?m=<messageId>` on any public page
 * (e.g. `/?m=…`, `/preview?m=…` or `/rsvp?m=…`). Works identically in Supabase and Local modes.
 */
export function trackMessageLinkVisit(messageId?: string | null) {
  if (typeof window === "undefined") return;
  const m = (messageId ?? new URLSearchParams(window.location.search).get("m") ?? "").trim();
  if (!m) return;
  const run = async () => {
    if (!claimVisitTracking(`msg:${m}`)) return;
    try {
      const r = await fetch(`/api/rsvp?m=${encodeURIComponent(m)}&track=1`, { cache: "no-store" });
      if (r.ok) return;
    } catch { /* fall through to local mode */ }
    recordLocalMessageOpen({ messageId: m });
  };
  if (document.visibilityState === "visible") {
    void run();
  } else {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        document.removeEventListener("visibilitychange", onVis);
        void run();
      }
    };
    document.addEventListener("visibilitychange", onVis);
  }
}

/**
 * Open a personal invitation link. The server answers for Supabase projects; local
 * (browser-only) mode validates against this device's list so the couple can rehearse.
 * A guest may type the whole code (`JS-7KQF`) or just the last four characters of their link
 * (`7KQF`) in any case — and the answer always carries the household's canonical code, so a
 * reply typed at /rsvp lands on the same row the link would have used.
 */
export type InviteFound = { state: InviteState; code: string };
export type InviteResult = { ok: true; found: InviteFound } | { ok: false; error: string };

export async function resolveInvite(code: string, messageId?: string, via?: "rsvp" | "invite"): Promise<InviteResult> {
  const cc = code.trim().toUpperCase();
  const hashStr = typeof window !== "undefined" ? window.location.hash : "";
  const hashMsgMatch = hashStr.match(/[?&]m=([A-Za-z0-9_-]+)/);
  const m = (
    messageId ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("m") || (hashMsgMatch ? hashMsgMatch[1] : "")
      : "")
  ).trim();
  const entry: "rsvp" | "invite" =
    via ?? (hashStr.toLowerCase().startsWith("#rsvp") ? "rsvp" : "invite");
  if (cc.length < 3) return { ok: false, error: "That code is too short — check the four characters at the end of your link." };
  if (cc === DEMO_CODE) {
    if (m && claimVisitTracking(`msg:${m}`)) {
      fetch(`/api/rsvp?m=${encodeURIComponent(m)}&track=1`, { cache: "no-store" }).catch(() => {});
      recordLocalMessageOpen({ messageId: m });
    }
    const reply = readDemoReply();
    // the test household is invited with the card's full range, so the couple can rehearse 3 and 4 seats
    return { ok: true, found: { code: DEMO_CODE, state: { name: DEMO_HOUSEHOLD, label: DEMO_HOUSEHOLD, pax: MAX_RSVP_SEATS, reply, code: DEMO_CODE, demo: true } } };
  }
  const shouldTrack = claimVisitTracking(m ? `msg:${m}` : `code:${cc}:${entry}`);
  if (shouldTrack) {
    // Also mark both plain & entry code keys so `/rsvp` → `/JS-XXXX#rsvp` never double-counts
    claimVisitTracking(`code:${cc}:rsvp`);
    claimVisitTracking(`code:${cc}:invite`);
  }
  try {
    const params = new URLSearchParams({ code: cc, via: entry, track: shouldTrack ? "1" : "0" });
    if (m) params.set("m", m);
    const r = await fetch(`/api/rsvp?${params.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      if (j.code) {
        claimVisitTracking(`code:${String(j.code).toUpperCase()}:rsvp`);
        claimVisitTracking(`code:${String(j.code).toUpperCase()}:invite`);
      }
      return { ok: true, found: { code: (j.code as string) || cc, state: { name: j.name as string, label: (j.label as string) || (j.name as string) || "", pax: seatCapFor(j.pax), reply: (j.reply as InviteReply) || null, code: (j.code as string) || cc } } };
    }
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
  const target = invite ?? reply!;
  claimVisitTracking(`code:${hits[0]}:rsvp`);
  claimVisitTracking(`code:${hits[0]}:invite`);
  if (shouldTrack) {
    const now = new Date().toISOString();
    localWrite("guests", rows.map((g) => (g.id === target.id ? { ...g, viewed_at: now } : g)));
    recordLocalMessageOpen({ messageId: m, guest: target, guestId: target.id, code: hits[0], via: entry });
  }
  return {
    ok: true,
    found: {
      code: hits[0],
      state: {
        name: invite?.name ?? reply!.name,
        label: whoIsItFor(invite ?? reply!),
        pax: seatCapFor(invite?.pax ?? reply?.pax),
        // a code that has been opened is stamped, so the binder's ledger shows it as "opened"
        code: hits[0],
        reply: reply
          ? { name: reply.name, attending: reply.attending === "no" ? "no" : "yes", pax: reply.pax, plus_one: reply.plus_one || "", approved: reply.approved ?? null, dietary: reply.dietary || "", song_request: reply.song_request || "", message: reply.message || "" }
          : null,
      },
    },
  };
}

/** The invitation a personal link unlocks — `null` when the code isn't one the couple issued. */
export async function fetchInvite(code: string, messageId?: string, via?: "rsvp" | "invite"): Promise<InviteState | null> {
  const r = await resolveInvite(code, messageId, via);
  if (!r.ok) return null;
  return r.found.state;
}

export async function submitRsvp(g: Omit<Guest, "id" | "source" | "created_at"> & { code?: string; plus_one?: string }): Promise<{ approved: boolean | null; already: boolean }> {
  if ((g.code || "").toUpperCase() === DEMO_CODE) {
    // throwaway loop: seal a demo reply in this browser only, so reopen shows the welcome card
    if (readDemoReply()) return { approved: null, already: true };
    const declinedDemo = g.attending === "no";
    const demo = planParty(g.pax, MAX_RSVP_SEATS, g.plus_one, declinedDemo);
    if (demo.missingNames > 0) throw new Error(`Please add a name for each of your ${demo.needed} guest${demo.needed === 1 ? "" : "s"}.`);
    const reply: InviteReply = { name: g.name || "Demo Guest", attending: declinedDemo ? "no" : "yes", pax: demo.pax, plus_one: demo.plusOne, approved: demo.approved, dietary: g.dietary || "", song_request: g.song_request || "", message: g.message || "" };
    try { localStorage.setItem(demoReplyKey, JSON.stringify(reply)); } catch {}
    return { approved: demo.approved, already: false };
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
  // the same arithmetic the server runs: invitation cap, four-seat ceiling, a name per extra seat
  const party = planParty(g.pax, invite?.pax, g.plus_one, declined);
  if (party.missingNames > 0) throw new Error(`Please add a name for each of your ${party.needed} guest${party.needed === 1 ? "" : "s"}.`);
  const { pax, approved } = party;
  const nowIso = new Date().toISOString();
  const row: Guest = { ...invite, ...g, pax, plus_one: party.plusOne, id: invite?.id ?? crypto.randomUUID(), code: canonical, source: "RSVP form", created_at: nowIso, viewed_at: invite?.viewed_at ?? nowIso, approved } as Guest;
  const i = cur.findIndex((x) => x.id === row.id);
  if (i >= 0) cur[i] = row; else cur.push(row);
  localWrite("guests", cur);
  if (invite?.id) {
    const msgs = localRead("messages") as MessageLog[];
    if (msgs.some((m) => m.recipient_id === `gst_${invite.id}` && !m.responded)) {
      localWrite(
        "messages",
        msgs.map((m) =>
          m.recipient_id === `gst_${invite.id}`
            ? { ...m, responded: true, link_opens: Math.max(1, Number(m.link_opens) || 0), opened_at: m.opened_at || nowIso }
            : m,
        ),
      );
    }
  }
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

/** Update the official family shades and guest dress-code note while preserving all other attire edits. */
export async function refreshFamilyAttireColors(): Promise<number> {
  const stored = await listStored("attire");
  const attireSeeds = (SEED.attire as TableMap["attire"][]).filter((row) =>
    row.group === "shai_family" || row.group === "jeg_family" || row.group === "guests",
  );
  const updates = attireSeeds.map((seed) => {
    const current = stored.find((row) => row.id === seed.id);
    if (!current) return seed;
    if (seed.group === "guests") return { ...current, notes: seed.notes };
    return { ...current, colors: seed.colors };
  });
  await upsert("attire", updates);
  return updates.filter((row) => row.group !== "guests").length;
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
    // nothing to push for a table the code seeds empty (bridesmaid cards, messages) — and skipping
    // it means a project that hasn't re-run schema.sql for a newer table still gets everything else
    if (!(SEED[t] as unknown[]).length) continue;
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
