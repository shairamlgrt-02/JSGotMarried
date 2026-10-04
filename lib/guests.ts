import type { Guest } from "./types";

/**
 * A guest row is a *reply* once `approved` is set (true = confirmed, false = waiting for the
 * couple's review). Before that it is the plain invitation row the couple typed by hand —
 * name, phone and how many seats the household is invited to.
 */
export const isReply = (g: { approved?: boolean | null }) => g.approved !== null && g.approved !== undefined;

/**
 * Perpetual test invite: …/JS-DEMO (or /test) unseals the whole site and runs the full
 * RSVP journey with throwaway data — demo replies live only in the tester's browser
 * (localStorage), never reach Supabase and never e-mail the couple.
 */
export const DEMO_CODE = "JS-DEMO";

/** Every household code the app issues starts with this, so a guest can type only the tail. */
export const CODE_PREFIX = "JS-";

/** "  js-7kqf " → "JS-7KQF" — codes are matched case-insensitively, spaces are noise. */
export const cleanCode = (raw: string | undefined | null) => String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");

/**
 * The last four characters of the link are what a guest remembers ("7KQF"), and that is also
 * the whole code with the JS- taken off. Both forms mean the same household.
 */
export const codeCandidates = (raw: string): string[] => {
  const c = cleanCode(raw);
  if (!c) return [];
  return c.startsWith(CODE_PREFIX) ? [c] : [c, `${CODE_PREFIX}${c}`];
};

/** Does a stored invitation code answer to what the guest typed? (exact, or its last 4+) */
export function codeMatches(stored: string, input: string): boolean {
  const s = cleanCode(stored);
  const c = cleanCode(input);
  if (!s || c.length < 3) return false;
  if (s === c) return true;
  if (c.length >= 4 && s.endsWith(c)) return true; // "7KQF" answers to "JS-7KQF"
  return s === `${CODE_PREFIX}${c}`;
}

/* ─────────── the invite-code ledger: statuses ─────────── */
export type InviteStatus =
  | "no_code" | "to_send" | "sent" | "opened" | "needs_review" | "confirmed" | "declined";

/**
 * One label per stage of a household's link, read straight off the row — nothing extra to keep
 * in sync:
 *   no_code      you haven't given this household a link yet
 *   to_send      the code exists, the link hasn't left your phone
 *   sent         you copied / shared it (marked on the Invite codes tab)
 *   opened       they tapped the link but haven't answered yet (stamped by the server)
 *   needs_review they answered "yes" for two seats — you approve the plus-one
 *   confirmed    they answered (or you marked it by hand) and the seats are sealed
 *   declined     they can't make it
 */
export const STATUS: Record<InviteStatus, { label: string; hint: string; tone: "moss" | "wine" | "ink" | "amethyst" | "burgundy" }> = {
  no_code: { label: "no link yet", hint: "Generate a code for this household.", tone: "ink" },
  to_send: { label: "to send", hint: "Code issued — copy the link and send it over.", tone: "ink" },
  sent: { label: "sent", hint: "Shared with the guest; nothing back yet.", tone: "wine" },
  opened: { label: "opened", hint: "They opened the link but haven't replied — a nudge is kind.", tone: "amethyst" },
  needs_review: { label: "needs review", hint: "They asked for a second seat — approve or decline.", tone: "amethyst" },
  confirmed: { label: "confirmed", hint: "Seats are sealed. They're coming.", tone: "moss" },
  declined: { label: "declined", hint: "Declined with love — seat freed for someone else.", tone: "burgundy" },
};

/** "Filled" = the household's answer is in, however it got there (form reply or you typing it). */
export const hasReplied = (g: Guest) => isReply(g) || (g.attending && g.attending !== "pending");

/**
 * The stage one row is at. Rows you added by hand (a phone RSVP, a walk-in) never had a link,
 * so they read as confirmed/declined instead of sitting in the sending queue forever.
 */
export function inviteStatus(g: Guest): InviteStatus {
  if (isReply(g)) {
    if (g.attending === "no") return "declined";
    return g.approved === true ? "confirmed" : "needs_review";
  }
  if (g.attending === "no") return "declined";
  if (g.attending === "yes") return "confirmed";
  if (!cleanCode(g.code || "")) return "no_code";
  if (g.viewed_at) return "opened";
  if (g.sent_at) return "sent";
  return "to_send";
}

/** Rows that belong on the Guests & RSVP list: an answer is in, or the row never had a link. */
export const onGuestList = (g: Guest) => hasReplied(g) || !cleanCode(g.code || "");
/** Rows that belong on the Invite codes tab: the ones you hand out as links. */
export const onInviteLedger = (g: Guest) => !onGuestList(g) || hasReplied(g);

export type InviteTally = {
  total: number; codes: number; filled: number; seats: number; pendingSeats: number;
} & Record<InviteStatus, number>;
/** Counts for the whole ledger — the stat strip and the Overview card. */
export function tallyInvites(rows: Guest[]): InviteTally {
  const t = { total: rows.length, codes: 0, filled: 0, seats: 0, pendingSeats: 0 } as InviteTally;
  for (const s of ["no_code", "to_send", "sent", "opened", "needs_review", "confirmed", "declined"] as InviteStatus[]) t[s] = 0;
  for (const g of rows) {
    if (cleanCode(g.code || "")) t.codes++;
    t[inviteStatus(g)]++;
    if (hasReplied(g)) t.filled++;
    if (g.attending === "yes") t.seats += Number(g.pax) || 0;
    if (!hasReplied(g)) t.pendingSeats += Number(g.pax) || 0;
  }
  return t;
}

/* ─────────── issuing codes ─────────── */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — kind to tired eyes reading it off WhatsApp

/** Four characters a guest can read over the phone, checked against the codes you already hold. */
export function genCode(taken: Iterable<string>): string {
  const have = new Set(Array.from(taken, (x) => cleanCode(x)));
  have.add(DEMO_CODE);
  const burst = (n: number) => {
    const bytes =
      typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
        ? Array.from(crypto.getRandomValues(new Uint8Array(n)))
        : Array.from({ length: n }, () => Math.floor(Math.random() * 256));
    return bytes.map((b) => ALPHABET[b % ALPHABET.length]).join("");
  };
  for (let i = 0; i < 400; i++) {
    const c = `${CODE_PREFIX}${burst(4)}`;
    if (!have.has(c)) return c;
  }
  return `${CODE_PREFIX}${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

/** The next free code for this row set. */
export const genCodeFor = (rows: Guest[]) => genCode(rows.map((r) => r.code || ""));

/**
 * The personal invitation link. `…/JS-7KQF` is the one you send; `…/?rsvp=JS-7KQF` still
 * works and simply lands on the same page, so links you sent earlier never die.
 */
export const inviteLink = (code: string, origin = "") => `${origin}/${cleanCode(code)}`;
/** The reply card on its own: the code is entered by hand at /rsvp. */
export const rsvpLink = (code: string, origin = "") => `${origin}/rsvp?code=${cleanCode(code)}`;
/** The sealed preview anyone can look at — no venue, no programme, no reply card. */
export const previewLink = (origin = "") => `${origin}/preview`;

/* ─────────── the invitation text ─────────── */

/** One line of the pinned programme, as the invitation prints it. */
export type ProgrammeLine = { time: string; title: string };

/**
 * Everything the invitation message is allowed to know: the household it is going to, and the day
 * it is about. Nothing here is required — with only a code the text still reads as a proper
 * invitation, and every detail the binder can supply makes it read as *theirs*.
 */
export type InviteText = {
  couple: string;                  // "Shaira & Jeger" — the header line and the signature
  day: string;                     // "11.11.2026" — the short date on the header line
  date?: string | null;            // ISO date of the wedding, read out in full in the body
  venue?: string;                  // "The Heaven, Damistan, Kingdom of Bahrain"
  deadline?: string | null;        // ISO reply-by date (Settings → Website & sharing)
  programme?: ProgrammeLine[];     // the pinned schedule, in its order
  dress?: string;                  // the guests' dress note, one line
  name?: string;                   // the household, exactly as typed on the row
  seats?: number;                  // the seats kept for them
};

/** The programme lines for the invitation text: the pinned schedule, in the order it is pinned. */
export const programmeLines = (rows: { time: string; title: string; order: number }[]): ProgrammeLine[] =>
  [...rows].sort((a, b) => a.order - b.order).map(({ time, title }) => ({ time, title }));

/** The guests' dress note trimmed to its first clause — the same one line the reply card shows. */
export const dressLine = (attire: { group: string; notes?: string }[]) =>
  (attire.find((a) => a.group === "guests")?.notes || "").split("—")[0].replace(/\.?\s*$/, "").trim();

/**
 * "2026-11-11T16:00:00+03:00" → "Wednesday, 11 November 2026". Read off the calendar day itself and
 * formatted in UTC, so a binder open in another timezone never shifts the wedding by a day.
 */
export function longDate(iso?: string | null): string {
  const d = String(iso ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  const at = new Date(`${d}T12:00:00Z`);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** The reply-by date, minus the year when it falls in the wedding year: "25 October". */
export function deadlineText(iso?: string | null, wedding?: string | null): string {
  const d = String(iso ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  const at = new Date(`${d}T12:00:00Z`);
  if (Number.isNaN(at.getTime())) return "";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", timeZone: "UTC" };
  if (String(wedding ?? "").slice(0, 4) !== d.slice(0, 4)) opts.year = "numeric";
  return at.toLocaleDateString("en-GB", opts);
}

/** Card-table rows are labelled "Household 7" — greet those as friends, not by their label. */
const PLACEHOLDER_NAME = /^(household|guest|family|party|table|seat|new guest|tbd|to be announced|unknown)\s*#?\d*$/i;
export function greetingFor(name?: string): string {
  const n = String(name ?? "").trim().replace(/\s+/g, " ");
  return !n || PLACEHOLDER_NAME.test(n) ? "Dear friend," : `Dear ${n},`;
}

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/**
 * Written asides, matched to the programme row each belongs to — a row that isn't there takes its
 * aside with it. These are the parts of the message that are prose rather than data, so edit them
 * here (and nowhere else) if the shape of the day changes.
 */
const ASIDES: [RegExp, string][] = [
  [/ceremony|vows|church/i, "please be seated by 3:45 PM, the doors close then"],
  [/cocktail|mingling|hour/i, "come and find us here for photos"],
  [/reception|dinner|party|dance/i, "dinner, our film on the big screen, games and dancing"],
];

/**
 * The WhatsApp text a household receives — a letter, not a link drop. It greets the household by
 * the name on their row, says how many seats are theirs, walks them through the three things to do
 * with the link, lays out the day, gives the reply-by date, and keeps the code at the end in case
 * the link ever misbehaves.
 */
export function inviteMessage(code: string, t: InviteText, origin = ""): string {
  const c = cleanCode(code);
  const when = longDate(t.date) || t.day;
  const seats = Math.max(0, Math.round(Number(t.seats) || 0));
  const byWhen = deadlineText(t.deadline, t.date);

  const aboutDay = [
    t.venue ? `✦ ${t.venue}` : "",
    ...(t.programme ?? []).map((p) => {
      const aside = ASIDES.find(([re]) => re.test(p.title))?.[1];
      return `✦ ${p.time} · ${p.title}${aside ? ` — ${aside}` : ""}`;
    }),
    t.dress ? `✦ Dress code: ${t.dress} — every shade is swatched inside your invitation` : "",
  ].filter(Boolean);

  return [
    `✦ ${t.couple} · ${t.day}`,
    greetingFor(t.name),
    `We have news we've been holding on to for a while: ${when ? `on ${when}, ` : ""}we're getting married — and the day wouldn't be the same without you in the room. You've been part of how we got here, and we would love for you to be part of this too.`,

    `Your invitation, made for your household:\n${inviteLink(c, origin)}`,

    `What to do with it:\n` +
    `1. Tap the link. It opens your invitation — our story, the venue and its map, the full programme, the dress code and your reply card.\n` +
    `2. Scroll down to the reply card and answer: yes or no, who's coming with you, anything we should know about food, and one song you'd like to dance to.\n` +
    `3. That's the whole thing. Your answer reaches us the moment you send it, and the same link stays yours — open it again any time to re-read the details or change your reply.`,

    [
      seats ? `We've kept ${seats === 1 ? "a seat" : `${COUNT_WORDS[seats] ?? seats} seats`} for you.` : "",
      byWhen ? `Kindly reply by ${byWhen}, so we can settle the tables and the catering.` : "Kindly reply soon, so we can settle the tables and the catering.",
      `A “no” is completely alright too — we'd much rather know, and we'd still love you.`,
    ].filter(Boolean).join(" "),

    aboutDay.length ? `About the day:\n${aboutDay.join("\n")}` : "",

    `If the link ever misbehaves, open ${rsvpLink("", origin).replace("?code=", "")} and type your code: ${c}`,

    `Thank you for being here for us. We cannot wait to see you there. 🤍`,

    `With love,\n${t.couple}`,
  ].filter(Boolean).join("\n\n");
}

/** One-tap WhatsApp share, straight to the guest when we have their number. */
export function inviteHref(code: string, phone: string, t: InviteText, origin = location.origin) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(inviteMessage(code, t, origin))}`;
}

/* ─────────── bulk paste → households ─────────── */
export type NewHousehold = { name: string; phone: string; pax: number; note: string };

/**
 * Turn a pasted list into households, one per line. Tolerant on purpose — you'll be typing this
 * off a notebook:
 *   Ana & Ivan                       → 1 seat
 *   Ana & Ivan, 2 pax                  → 2 seats
 *   Ana & Ivan +2, 973 1234 5678       → 2 seats + their number
 *   Faisal — 3, uncle                  → name "Faisal — 3", note "uncle" (a bare 3 after a dash isn't a seat count)
 */
export function parseGuestLines(text: string): NewHousehold[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((line) => {
      const parts = line.split(/[,;\t|]+/).map((p) => p.trim()).filter(Boolean);
      let name = parts.shift() || "";
      let phone = "";
      let pax = 1;
      const note: string[] = [];
      // a seat count written inside the name: "Ana & Ivan +2", "Ana (2 pax)", "Ana ×2", "Layla (3 pax)"
      const tail = name.match(/\s*[[(]?\s*(?:\+\s*([1-9])\s*|(?:pax|seats?|guests?)\s*([1-9])|([1-9])\s*(?:pax|seats?|guests?))\s*[)\]]?\s*$/i);
      if (tail) {
        pax = Number(tail[1] ?? tail[2] ?? tail[3]);
        name = name.slice(0, tail.index).trim();
      }
      for (const p of parts) {
        if (!phone && /^[\d+][\d\s()-]{6,}$/.test(p)) { phone = p; continue; }
        const seats = p.match(/^([1-9])\s*(pax|seats?|guests?)?$/i);
        if (seats) { pax = Number(seats[1]); continue; }
        note.push(p);
      }
      return { name, phone, pax: Math.max(1, Math.min(9, pax)), note: note.join(" · ") };
    })
    .filter((h) => h.name);
}

/** One line per household for pasting into WhatsApp or a document: `Ana & Ivan — JS-7KQF — link`. */
export function inviteSheet(rows: Guest[], origin = ""): string {
  return rows
    .filter((g) => cleanCode(g.code || ""))
    .map((g) => `${g.name}${g.note ? ` (${g.note})` : ""} — ${cleanCode(g.code!)} — ${inviteLink(g.code!, origin)}`)
    .join("\n");
}

export type HouseholdMerge = { keep: Guest; drop: Guest[] };

/**
 * Every row sharing one invitation code is the same household. Older builds wrote the reply
 * as a *second* row with the same code, which doubled the guest list; `planHouseholdMerges`
 * finds those groups and decides which row survives: the reply when there is one (it holds
 * the guest's actual answer), otherwise the newest row.
 */
export function planHouseholdMerges(rows: Guest[]): HouseholdMerge[] {
  const byCode = new Map<string, Guest[]>();
  for (const g of rows) {
    const code = (g.code || "").trim().toUpperCase();
    if (!code) continue;
    const group = byCode.get(code) || [];
    group.push(g);
    byCode.set(code, group);
  }
  const plans: HouseholdMerge[] = [];
  for (const group of byCode.values()) {
    if (group.length < 2) continue;
    const newestFirst = [...group].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    const keep = newestFirst.find(isReply) ?? newestFirst[0];
    plans.push({ keep, drop: newestFirst.filter((g) => g.id !== keep.id) });
  }
  return plans;
}

/**
 * Fold the household's leftover rows into the survivor: the kept row wins on every value it
 * already has, and anything it left blank (a phone, a dietary note, the plus-one's name…) is
 * rescued from the rows being merged away.
 */
export function mergeHousehold(keep: Guest, others: Guest[]): Guest {
  return others.reduce((acc, g) => {
    const patch: Partial<Guest> = {};
    for (const k of ["name", "phone", "dietary", "message", "song_request", "plus_one", "note"] as const)
      if (!acc[k] && g[k]) patch[k] = g[k];
    if (acc.attending === "pending" && g.attending !== "pending") patch.attending = g.attending;
    if (!acc.pax && g.pax) patch.pax = g.pax;
    return { ...acc, ...patch };
  }, { ...keep });
}
