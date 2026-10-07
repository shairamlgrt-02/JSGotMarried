import { ALL_WELCOME_FROM } from "./program";
import type { WeddingInfo } from "./types";

/**
 * Adding 11.11.2026 to a guest's own calendar, from one tap, on any phone.
 *
 * Everything is derived from the same `wedding_info` row that draws the invitation — the date,
 * the time, the venue (the server blanks the venue for sealed visitors, so the file follows:
 * a preview visitor gets the date, an invited guest gets the whole address) — so the couple
 * can move the event in the binder and every calendar follows with no redeploy.
 *
 * Two doors, because phones are split down the middle:
 *   1. the `.ics` file at /api/calendar — Apple Calendar, Outlook, Samsung, Xiaomi, anything that
 *      reads a calendar file. A real URL, not a blob built in the page: iOS Safari refuses to open
 *      a calendar file that way, but it hands a `text/calendar` response straight to Calendar.
 *   2. the Google Calendar link below — Android phones open it in the Google Calendar app.
 * Both carry the same times and the same day-before reminder.
 */

/** Bahrain runs on Arabian Standard Time all year (UTC+3, no daylight saving). */
export const WEDDING_TZ = "Asia/Bahrain";

/** How long the calendar block runs: the ceremony through to the send-off, not a note on a napkin. */
const CELEBRATION_HOURS = 6;

/** The reminder a guest finds already set on the event — one day before, changeable in their app. */
const REMINDER = "-P1D";

export type WeddingEvent = {
  title: string;
  start: Date;
  end: Date;
  /** "The Heaven, Damistan, Kingdom of Bahrain" — empty while the invitation is still sealed. */
  location: string;
  description: string;
  url: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** The event's date, long and short, read off the Bahrain calendar — never the visitor's device. */
export const eventDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: WEDDING_TZ });
export const eventDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: WEDDING_TZ });
export const eventDay = (iso: string) => new Date(iso).getDate();
export const eventMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", timeZone: WEDDING_TZ }).toUpperCase();
export const eventTimeWords = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: WEDDING_TZ });

/** One event for the couple's day, built from the invitation itself. */
export function weddingEvent(info: WeddingInfo, inviteUrl = ""): WeddingEvent {
  const start = new Date(info.date);
  const end = new Date(start.getTime() + CELEBRATION_HOURS * 3600_000);
  const where = [info.venue_name, info.venue_address].filter((v) => v && v.trim()).join(", ");
  const couple = `${info.groom} & ${info.bride}`;
  // the closed doors: the ceremony's one rule, told where a guest plans their arrival
  const ceremonyAt = eventTimeWords(info.date);
  const lines = [
    `${couple} are getting married — ${eventDateLong(info.date)}.`,
    "",
    `The ceremony begins at ${ceremonyAt}${where ? ` at ${where}` : ""}, and we celebrate into the evening.`,
    `Wish to witness the vows? Please be seated before ${ceremonyAt} — the doors close as the procession begins. Everyone is welcome from ${ALL_WELCOME_FROM} for the Welcome Toast & Snacks, then the reception.`,
  ];
  if (info.venue_map_link) lines.push(`Directions: ${info.venue_map_link}`);
  if (inviteUrl) lines.push(`Your invitation: ${inviteUrl}`);
  if (info.hashtags?.length) lines.push(info.hashtags.filter(Boolean).join(" "));
  return {
    title: `${couple} — Wedding`,
    start,
    end,
    location: where,
    description: lines.join("\n"),
    url: inviteUrl || info.venue_map_link || "",
  };
}

/* ── the .ics file ── */

/** "20261111T130000Z" — the one stamp every calendar app reads the same way, in any time zone. */
export const icsStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/** Escape the characters that carry meaning inside an iCalendar property value. */
const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Fold every line to 75 octets, RFC 5545 style — long descriptions survive Outlook. */
function fold(text: string, limit = 75) {
  const encoder = new TextEncoder();
  return text
    .split("\r\n")
    .map((line) => {
      if (encoder.encode(line).length <= limit) return line;
      const out: string[] = [];
      let cur = "";
      let bytes = 0;
      for (const ch of line) {
        const size = encoder.encode(ch).length;
        const cap = out.length ? limit - 1 : limit; // continuation lines start with a space
        if (bytes + size > cap) { out.push(cur); cur = ""; bytes = 0; }
        cur += ch;
        bytes += size;
      }
      out.push(cur);
      return out.join("\r\n ");
    })
    .join("\r\n");
}

/** The complete invite file — an event with a location, a description and a day-before reminder. */
export function icsText(event: WeddingEvent, host = "jsgotmarried"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JS Wedding OS//Shaira & Jeger 11.11.2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(event.title)}`,
    `X-WR-TIMEZONE:${WEDDING_TZ}`,
    "BEGIN:VEVENT",
    `UID:${icsStamp(event.start)}-${host}@js-wedding`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(event.start)}`,
    `DTEND:${icsStamp(event.end)}`,
    `SUMMARY:${esc(event.title)}`,
    event.location ? `LOCATION:${esc(event.location)}` : "",
    `DESCRIPTION:${esc(event.description)}`,
    event.url ? `URL:${event.url}` : "",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    `TRIGGER:${REMINDER}`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${event.title} — tomorrow!`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `${fold(lines.join("\r\n"))}\r\n`;
}

/* ── the Google Calendar link ── */

/** Google's "add an event" screen, pre-filled — this is the door Android phones walk through. */
export function googleCalendarUrl(event: WeddingEvent) {
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${icsStamp(event.start)}/${icsStamp(event.end)}`,
    details: event.description,
  });
  if (event.location) query.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

/** Filename guests will recognise in their Downloads: "Jeger-and-Shaira-Wedding-2026-11-11.ics". */
export function icsFilename(info: WeddingInfo) {
  const slug = `${info.groom}-and-${info.bride}-Wedding`.replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  return `${slug}-${info.date.slice(0, 10)}.ics`;
}

/**
 * Which door this phone most likely wants — the option the sheet highlights for them.
 * Apple devices (and desktops, where the .ics is what Outlook and Apple Calendar both open)
 * get the file; Android — Google's home turf — gets the Google Calendar link.
 */
export function suggestedCalendar(): "apple" | "google" {
  if (typeof navigator === "undefined") return "apple";
  if (/Android/i.test(navigator.userAgent)) return "google";
  return "apple";
}
