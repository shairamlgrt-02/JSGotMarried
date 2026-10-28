/**
 * The Social Studio — a registry of downloadable Instagram templates rendered on canvas in the
 * wedding's own paper/wine/Cormorant/Pinyon aesthetic, so every story and feed post looks like a
 * page torn from the invitation site.
 *
 * Two formats:
 *   · story — 1080 × 1920 (9:16). A topic with more to say is a SERIES: one template renders
 *     several pages (cover + content pages), each its own PNG, posted in order;
 *   · post  — 1080 × 1080 square, for the feed and for Instagram highlight covers (the app
 *     crops a square cover to a circle, so cover art keeps every mark inside the centre 70%).
 *
 * The templates read the live binder data — programme constants, the attire palette, the FAQ
 * rows, the couple's handle and hashtags — so an edit in the binder changes the next download.
 */
import {
  EDGE,
  INK,
  PAPER,
  TAUPE,
  WINE,
  caps,
  diamondRule,
  drawLines,
  fit,
  paper,
  roundRect,
  savePng,
  script,
  serif,
  wrapLines,
} from "./card-draw";
import { shortDate } from "./guests";
import { STORY_W, STORY_H, loadIgFonts } from "./ig-stories";
import {
  ALL_WELCOME_FROM,
  ARRIVAL_NOTES,
  CEREMONY_DOORS_CLOSE,
  ENTOURAGE_CALL_TIME,
  RECEPTION_AT,
  WEDDING_PROGRAM_STOPS,
} from "./program";
import type { Attire, Faq, WeddingInfo } from "./types";

export const POST_W = 1080;
/** Instagram portrait feed format — 4:5, the tallest size the grid accepts without cropping. */
export const POST_H = 1350;
/** Highlight covers stay square: Instagram crops them to a circle. */
export const COVER_SIZE = 1080;
const LACE = "#F3E8D6";
const MOSS = "#5E6B3A";

const MOCHA = "#46362C";
const sans = (size: number, weight: 300 | 400 | 500 = 400) => `${weight} ${size}px Jost, system-ui, sans-serif`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ───────────────────────── context ───────────────────────── */

export type SocialContext = {
  couple: string;
  bride: string;
  groom: string;
  /** "11.11.2026" */
  dateLabel: string;
  /** "Wednesday, 11 November 2026" */
  fullDateLabel: string;
  handle: string;
  hashtags: string[];
  venueName: string;
  /** Whole days remaining — 0 on the day, negative afterwards, null if no date. */
  daysToGo: number | null;
  /**
   * Studio override for the Countdown card: when true the big number is left blank (a dashed ring
   * marks the spot) so the couple can drop Instagram's own live countdown sticker on top.
   */
  countdownBlank?: boolean;
  /** Studio override forcing a specific days-to-go number; null/undefined means "use daysToGo". */
  countdownNumber?: number | null;
  attire: Attire[];
  faqs: Faq[];
  /** Decoded QR data URL image for the /upload page, preloaded so renderers stay synchronous. */
  qrImage: HTMLImageElement | null;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function buildSocialContext(
  info: WeddingInfo | undefined,
  attire: Attire[],
  faqs: Faq[],
  qrDataUrl: string | null,
): Promise<SocialContext> {
  const bride = info?.bride || "Shaira";
  const groom = info?.groom || "Jeger";
  let daysToGo: number | null = null;
  let fullDateLabel = "";
  if (info?.date) {
    daysToGo = Math.ceil((new Date(info.date).getTime() - Date.now()) / 86_400_000);
    fullDateLabel = new Date(info.date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Bahrain",
    });
  }
  return {
    couple: `${groom} & ${bride}`,
    bride,
    groom,
    dateLabel: shortDate(info?.date) || "11.11.2026",
    fullDateLabel,
    handle: info?.instagram?.trim() || "@shaiandjeg",
    hashtags: (info?.hashtags ?? []).filter(Boolean),
    venueName: info?.venue_name || "The Heaven",
    daysToGo,
    attire,
    faqs: [...faqs].sort((a, b) => a.order - b.order),
    qrImage: qrDataUrl ? await loadImage(qrDataUrl) : null,
  };
}

/* ───────────────────────── canvas primitives ───────────────────────── */

type Ctx = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; g: Ctx } {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("Could not prepare the social template canvas.");
  return { canvas, g };
}

const storyCanvas = () => makeCanvas(STORY_W, STORY_H);
/** 4:5 portrait feed post. */
const postCanvas = () => makeCanvas(POST_W, POST_H);
/** 1:1 highlight cover. */
const coverCanvas = () => makeCanvas(COVER_SIZE, COVER_SIZE);

function wineFill(g: Ctx, w: number, h: number) {
  g.fillStyle = WINE;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(252,250,245,0.55)";
  g.lineWidth = 2;
  g.strokeRect(52, 52, w - 104, h - 104);
  g.strokeStyle = "rgba(252,250,245,0.28)";
  g.lineWidth = 1;
  g.strokeRect(70, 70, w - 140, h - 140);
}

/** Standard paper-story header: kicker, script names, date, diamond rule. Returns the next free y. */
function paperHeader(g: Ctx, ctx: SocialContext, kicker: string, y = 172): number {
  const cx = STORY_W / 2;
  caps(g, kicker, cx, y, 34, WINE, 0.4);
  fit(g, ctx.couple, cx, y + 122, 108, (s) => script(s), WINE, 840);
  caps(g, ctx.dateLabel, cx, y + 190, 30, TAUPE, 0.34);
  diamondRule(g, cx, y + 240, 240, EDGE);
  return y + 280;
}

function wineHeader(g: Ctx, ctx: SocialContext, kicker: string, y = 172): number {
  const cx = STORY_W / 2;
  caps(g, kicker, cx, y, 34, PAPER, 0.4);
  fit(g, ctx.couple, cx, y + 122, 104, (s) => script(s), PAPER, 840);
  caps(g, ctx.dateLabel, cx, y + 190, 28, "rgba(252,250,245,0.72)", 0.34);
  return y + 240;
}

function socialFooter(g: Ctx, ctx: SocialContext, onWine: boolean, w = STORY_W, y = 1758) {
  const cx = w / 2;
  const main = onWine ? PAPER : WINE;
  const sub = onWine ? "rgba(252,250,245,0.72)" : TAUPE;
  caps(g, ctx.handle, cx, y, 28, main, 0.3);
  if (ctx.hashtags.length) {
    g.font = serif(34, "600");
    g.fillStyle = main;
    g.textAlign = "center";
    g.fillText(ctx.hashtags.join("  "), cx, y + 52);
  }
  g.font = sans(22, 400);
  g.fillStyle = sub;
  g.textAlign = "center";
  g.fillText(ctx.fullDateLabel, cx, y + 92);
}

function pageBadge(g: Ctx, n: number, total: number) {
  if (total <= 1) return;
  roundRect(g, STORY_W - 232, 118, 124, 46, 23);
  g.fillStyle = WINE;
  g.fill();
  g.font = sans(22, 500);
  g.fillStyle = PAPER;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(`${n} / ${total}`, STORY_W - 170, 142);
  g.textBaseline = "alphabetic";
}

/** Wrap text, stepping the font down until it fits `maxLines` (or the minimum size is reached). */
function adaptiveWrap(g: Ctx, text: string, maxWidth: number, maxLines: number, startSize: number, minSize: number, makeFont: (s: number) => string) {
  let size = startSize;
  let lines = wrapLines(g, text, makeFont(size), maxWidth);
  while (lines.length > maxLines && size > minSize) {
    size -= 2;
    lines = wrapLines(g, text, makeFont(size), maxWidth);
  }
  return { lines, size };
}

function sparkle(g: Ctx, cx: number, cy: number, r: number, color: string) {
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.quadraticCurveTo(cx, cy, cx + r, cy);
  g.quadraticCurveTo(cx, cy, cx, cy + r);
  g.quadraticCurveTo(cx, cy, cx - r, cy);
  g.quadraticCurveTo(cx, cy, cx, cy - r);
  g.closePath();
  g.fill();
  g.restore();
}

/* ───────────────────────── template registry ───────────────────────── */

export type SocialCategory =
  | "Announcements"
  | "Programme"
  | "Attire"
  | "FAQ"
  | "Reminders"
  | "Instructions"
  | "Feed posts"
  | "Highlight covers";

export const SOCIAL_CATEGORIES: SocialCategory[] = [
  "Announcements",
  "Programme",
  "Attire",
  "FAQ",
  "Reminders",
  "Instructions",
  "Feed posts",
  "Highlight covers",
];

export type SocialFormat = "story" | "post" | "cover";

export type SocialTemplate = {
  id: string;
  title: string;
  category: SocialCategory;
  /** story = 1080×1920 (9:16) · post = 1080×1350 (4:5 feed) · cover = 1080×1080 (1:1, circle-cropped) */
  format: SocialFormat;
  blurb: string;
  render: (ctx: SocialContext) => HTMLCanvasElement | HTMLCanvasElement[];
};

/** Normalize a renderer's output to a page array (single-page templates return one canvas). */
function pagesOf(t: SocialTemplate, ctx: SocialContext): HTMLCanvasElement[] {
  const out = t.render(ctx);
  return Array.isArray(out) ? out : [out];
}

const slug = (id: string, n: number, total: number, format: "story" | "post" | "cover") =>
  format === "story"
    ? `social-${id}-${String(n).padStart(2, "0")}-of-${String(total).padStart(2, "0")}-1080x1920.png`
    : format === "post"
      ? `social-${id}-1080x1350.png`
      : `social-${id}-1080x1080.png`;

/* ── Announcements ── */

function saveTheDateStory(ctx: SocialContext): HTMLCanvasElement {
  const { canvas, g } = storyCanvas();
  paper(g, STORY_W, STORY_H);
  const cx = STORY_W / 2;
  caps(g, "Save the Date", cx, 250, 40, WINE, 0.42);
  fit(g, ctx.couple, cx, 430, 130, (s) => script(s), WINE, 880);
  diamondRule(g, cx, 510, 260);
  g.font = serif(148, "600");
  g.fillStyle = INK;
  g.textAlign = "center";
  g.fillText("11.11", cx, 760);
  caps(g, "TWO THOUSAND TWENTY-SIX", cx, 850, 36, TAUPE, 0.4);
  g.font = serif(46, "i400");
  g.fillStyle = MOCHA;
  g.fillText(ctx.fullDateLabel, cx, 950);
  caps(g, ctx.venueName.toUpperCase(), cx, 1080, 34, WINE, 0.36);
  g.font = sans(28, 400);
  g.fillStyle = TAUPE;
  g.fillText("Kingdom of Bahrain", cx, 1140);
  sparkle(g, cx - 320, 690, 16, MOSS);
  sparkle(g, cx + 320, 690, 16, MOSS);
  socialFooter(g, ctx, false);
  return canvas;
}

function countdownStory(ctx: SocialContext): HTMLCanvasElement {
  const { canvas, g } = storyCanvas();
  wineFill(g, STORY_W, STORY_H);
  const cx = STORY_W / 2;
  // The studio can blank the number (for Instagram's native sticker) or force one; otherwise it
  // ticks automatically from the wedding date and the device clock.
  const blank = ctx.countdownBlank === true;
  const override =
    typeof ctx.countdownNumber === "number" && Number.isFinite(ctx.countdownNumber) ? ctx.countdownNumber : null;
  const value = blank ? null : override ?? ctx.daysToGo;
  const headline =
    value === null
      ? "The countdown is on"
      : value > 1
        ? `${value} days to go`
        : value === 1
          ? "One day to go"
          : value === 0
            ? "Today is the day"
            : "Just married";
  caps(g, "Counting every moment", cx, 330, 34, "rgba(252,250,245,0.78)", 0.4);
  fit(g, ctx.couple, cx, 500, 104, (s) => script(s), PAPER, 860);
  if (value !== null && value > 0) {
    g.font = serif(360, "600");
    g.fillStyle = PAPER;
    g.textAlign = "center";
    g.fillText(String(value), cx, 1010);
  } else if (value === 0 || (value !== null && value < 0)) {
    g.font = script(220);
    g.fillStyle = PAPER;
    g.textAlign = "center";
    g.fillText(value === 0 ? "today ♡" : "forever ♡", cx, 980);
  } else {
    // Blank mode: an elegant dashed ring marks where Instagram's own live countdown sticker goes.
    g.save();
    g.strokeStyle = "rgba(252,250,245,0.45)";
    g.lineWidth = 3;
    g.setLineDash([14, 16]);
    g.beginPath();
    g.arc(cx, 900, 235, 0, Math.PI * 2);
    g.stroke();
    g.restore();
    g.font = script(150);
    g.fillStyle = "rgba(252,250,245,0.85)";
    g.textAlign = "center";
    g.fillText("♡", cx, 952);
  }
  caps(g, headline.toUpperCase(), cx, 1180, 40, LACE, 0.34);
  caps(g, ctx.dateLabel, cx, 1280, 32, "rgba(252,250,245,0.75)", 0.34);
  socialFooter(g, ctx, true);
  return canvas;
}

/* ── Programme series ── */

function programmeSeries(ctx: SocialContext): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  const cx = STORY_W / 2;

  // page 1 — cover
  {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "The Order of the Day");
    g.font = script(150);
    g.fillStyle = WINE;
    g.textAlign = "center";
    g.fillText("the programme", cx, 880);
    g.font = serif(40, "i400");
    g.fillStyle = TAUPE;
    g.fillText("everything that happens, and when to be where", cx, 980);
    diamondRule(g, cx, 1080, 260);
    caps(g, "SWIPE FOR THE FULL DAY →", cx, 1240, 28, WINE, 0.3);
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  // page 2 — timeline
  {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "The Order of the Day");
    let y = 540;
    WEDDING_PROGRAM_STOPS.forEach((stop) => {
      caps(g, stop.time, cx - 300, y, 34, WINE, 0.12, "left");
      g.font = serif(46, "500");
      g.fillStyle = INK;
      g.textAlign = "left";
      g.fillText(stop.title, cx - 300, y + 58);
      if (stop.tag) {
        g.font = sans(24, 400);
        g.fillStyle = TAUPE;
        g.fillText(stop.tag, cx - 300, y + 96);
      }
      g.strokeStyle = "rgba(188,169,148,0.5)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(cx - 300, y + 118);
      g.lineTo(cx + 300, y + 118);
      g.stroke();
      y += 178;
    });
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  // page 3 — who arrives when
  {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "Who Arrives When");
    const notes = [ARRIVAL_NOTES.entourage, ARRIVAL_NOTES.guests];
    let y = 540;
    notes.forEach((note) => {
      roundRect(g, 110, y, STORY_W - 220, 360, 24);
      g.fillStyle = "rgba(233,223,206,0.45)";
      g.fill();
      caps(g, note.who.toUpperCase(), STORY_W / 2, y + 62, 30, WINE, 0.3);
      caps(g, note.time.toUpperCase(), STORY_W / 2, y + 128, 44, WINE, 0.26);
      const brief = adaptiveWrap(g, note.brief, STORY_W - 320, 4, 32, 24, (s) => serif(s, "i400"));
      drawLines(g, brief.lines, STORY_W / 2, y + 200, serif(brief.size, "i400"), MOCHA, brief.size * 1.42);
      caps(g, note.where.toUpperCase(), STORY_W / 2, y + 330, 26, TAUPE, 0.3);
      y += 404;
    });
    g.font = sans(24, 400);
    g.fillStyle = TAUPE;
    g.textAlign = "center";
    g.fillText(`Doors close at ${CEREMONY_DOORS_CLOSE} · reception from ${RECEPTION_AT}`, cx, y + 10);
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  pages.forEach((_, i) => pageBadge(pages[i].getContext("2d")!, i + 1, pages.length));
  return pages;
}

/* ── Attire series ── */

function attireSeries(ctx: SocialContext): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  const cx = STORY_W / 2;
  const guestAttire = ctx.attire.find((a) => a.group === "guests");
  const guestColors = guestAttire?.colors ?? [];
  const reserved = ctx.attire.filter((a) => a.reserved && a.group !== "guests" && a.colors.length);

  // page 1 — cover + the dress note
  {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "What to Wear");
    g.font = script(140);
    g.fillStyle = WINE;
    g.textAlign = "center";
    g.fillText("glossy greens", cx, 760);
    g.font = serif(44, "i400");
    g.fillStyle = TAUPE;
    g.fillText("& shining browns", cx, 840);
    diamondRule(g, cx, 920, 240);
    const note = guestAttire?.notes || "Black tie in glossy greens and warm shining browns.";
    const firstSentence = note.split("—")[0].trim();
    const wrapped = adaptiveWrap(g, firstSentence, STORY_W - 260, 7, 38, 26, (s) => serif(s, "i400"));
    drawLines(g, wrapped.lines, cx, 1060, serif(wrapped.size, "i400"), MOCHA, wrapped.size * 1.5);
    caps(g, "THE FULL PALETTE IS ON THE NEXT PAGE →", cx, 1480, 26, WINE, 0.24);
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  // page 2 — the guest palette
  if (guestColors.length) {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "Our Guests' Palette");
    const perRow = 4;
    const gap = 40;
    const gridW = STORY_W - 220;
    const r = (gridW - gap * (perRow - 1)) / perRow / 2;
    const startX = 110 + r;
    const startY = 580;
    guestColors.slice(0, 12).forEach((c, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = startX + col * (r * 2 + gap);
      const y = startY + row * (r * 2 + 150);
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = c.hex;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "rgba(51,39,31,0.18)";
      g.stroke();
      const nameLines = wrapLines(g, c.name, sans(24, 500), r * 2 - 8);
      g.font = sans(24, 500);
      g.fillStyle = INK;
      g.textAlign = "center";
      nameLines.slice(0, 2).forEach((line, li) => g.fillText(line, x, y + r + 38 + li * 28));
      if (c.fabric) {
        g.font = sans(20, 400);
        g.fillStyle = TAUPE;
        g.fillText(c.fabric, x, y + r + 38 + nameLines.slice(0, 2).length * 28 + 4);
      }
    });
    g.font = sans(24, 400);
    g.fillStyle = TAUPE;
    g.textAlign = "center";
    g.fillText("Shine welcome: satin, velvet, silk, fine suit wool or liquid poly", cx, 1560);
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  // page 3 — reserved colours
  if (reserved.length) {
    const { canvas, g } = storyCanvas();
    wineFill(g, STORY_W, STORY_H);
    wineHeader(g, ctx, "Reserved for the Family");
    let y = 520;
    reserved.slice(0, 4).forEach((a) => {
      caps(g, a.label.toUpperCase(), cx, y, 30, PAPER, 0.28);
      const dots = a.colors.slice(0, 6);
      const dotR = 34;
      const span = dots.length * (dotR * 2 + 24) - 24;
      let x = cx - span / 2 + dotR;
      dots.forEach((c) => {
        g.beginPath();
        g.arc(x, y + 78, dotR, 0, Math.PI * 2);
        g.fillStyle = c.hex;
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = "rgba(252,250,245,0.5)";
        g.stroke();
        x += dotR * 2 + 24;
      });
      y += 200;
    });
    diamondRule(g, cx, y + 10, 220, "rgba(252,250,245,0.4)");
    g.font = serif(40, "i500");
    g.fillStyle = LACE;
    g.textAlign = "center";
    g.fillText("kindly avoid these shades", cx, y + 110);
    g.fillText("so the family stands out", cx, y + 168);
    socialFooter(g, ctx, true);
    pages.push(canvas);
  }

  pages.forEach((c, i) => pageBadge(c.getContext("2d")!, i + 1, pages.length));
  return pages;
}

/* ── FAQ series ── */

function faqSeries(ctx: SocialContext): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  const cx = STORY_W / 2;
  const faqs = ctx.faqs.slice(0, 8);

  {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "Good to Know");
    g.font = script(150);
    g.fillStyle = WINE;
    g.textAlign = "center";
    g.fillText("questions,", cx, 840);
    g.fillText("answered", cx, 990);
    diamondRule(g, cx, 1080, 260);
    caps(g, `${faqs.length} ANSWERS · SWIPE THROUGH →`, cx, 1260, 28, WINE, 0.26);
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  faqs.forEach((f, i) => {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, `Question ${i + 1} of ${faqs.length}`);
    const q = adaptiveWrap(g, f.question, STORY_W - 240, 3, 52, 34, (s) => serif(s, "600"));
    let y = drawLines(g, q.lines, cx, 560, serif(q.size, "600"), WINE, q.size * 1.28);
    diamondRule(g, cx, y + 60, 200, EDGE);
    const a = adaptiveWrap(g, f.answer, STORY_W - 240, 16, 40, 26, (s) => serif(s, "i400"));
    drawLines(g, a.lines, cx, y + 130, serif(a.size, "i400"), MOCHA, a.size * 1.5);
    socialFooter(g, ctx, false);
    pages.push(canvas);
  });

  pages.forEach((c, i) => pageBadge(c.getContext("2d")!, i + 1, pages.length));
  return pages;
}

/* ── Instructions series ── */

function instructionsSeries(ctx: SocialContext): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];
  const cx = STORY_W / 2;

  {
    const { canvas, g } = storyCanvas();
    paper(g, STORY_W, STORY_H);
    paperHeader(g, ctx, "Know Before You Go");
    const bullets = [
      `Everyone gathers at the majlis first — the hall is prepared until ${CEREMONY_DOORS_CLOSE}.`,
      `Wedding team: please be at the majlis by ${ENTOURAGE_CALL_TIME} for your briefing.`,
      `Doors close at ${CEREMONY_DOORS_CLOSE}. Running late? Watch the livestream at the majlis with refreshments.`,
      "The ceremony is adults-only and behind closed doors — little ones are welcome from the reception, and can watch along at the majlis.",
      `After the ceremony we join you at the majlis, and at ${RECEPTION_AT} everyone walks into the hall together.`,
    ];
    let y = 540;
    bullets.forEach((b) => {
      g.beginPath();
      g.arc(130, y - 12, 9, 0, Math.PI * 2);
      g.fillStyle = WINE;
      g.fill();
      const wrapped = adaptiveWrap(g, b, STORY_W - 300, 4, 34, 26, (s) => serif(s, "400"));
      drawLines(g, wrapped.lines, 165, y, serif(wrapped.size, "400"), INK, wrapped.size * 1.45, "left");
      y += wrapped.lines.length * wrapped.size * 1.45 + 44;
    });
    socialFooter(g, ctx, false);
    pages.push(canvas);
  }

  {
    const { canvas, g } = storyCanvas();
    wineFill(g, STORY_W, STORY_H);
    wineHeader(g, ctx, "Share the Day With Us");
    caps(g, "TAKE ALL THE PHOTOS & VIDEOS", cx, 520, 32, LACE, 0.26);
    g.font = serif(46, "i500");
    g.fillStyle = PAPER;
    g.textAlign = "center";
    g.fillText(`Tag ${ctx.handle}`, cx, 640);
    g.font = serif(40, "600");
    g.fillText(ctx.hashtags.join("  "), cx, 710);
    if (ctx.qrImage) {
      const size = 560;
      roundRect(g, cx - size / 2 - 30, 780, size + 60, size + 60, 28);
      g.fillStyle = PAPER;
      g.fill();
      g.drawImage(ctx.qrImage, cx - size / 2, 810, size, size);
      caps(g, "SCAN TO UPLOAD YOUR PHOTOS · UP TO 25", cx, 1450, 26, PAPER, 0.2);
    } else {
      g.font = serif(38, "i400");
      g.fillStyle = "rgba(252,250,245,0.85)";
      g.fillText("Upload your memories from the link on your invitation", cx, 900);
    }
    socialFooter(g, ctx, true);
    pages.push(canvas);
  }

  pages.forEach((c, i) => pageBadge(c.getContext("2d")!, i + 1, pages.length));
  return pages;
}

/* ── Single-page wine reminders ── */

function wineReminder(kicker: string, bigLines: string[], subLines: string[]): (ctx: SocialContext) => HTMLCanvasElement {
  return (ctx) => {
    const { canvas, g } = storyCanvas();
    wineFill(g, STORY_W, STORY_H);
    const cx = STORY_W / 2;
    caps(g, kicker, cx, 360, 34, "rgba(252,250,245,0.78)", 0.4);
    diamondRule(g, cx, 430, 220, "rgba(252,250,245,0.4)");
    let y = 680;
    bigLines.forEach((line) => {
      const size = fit(g, line, cx, y, 96, (s) => serif(s, "600"), PAPER, 880);
      y += size + 46;
    });
    y += 30;
    subLines.forEach((line) => {
      const wrapped = adaptiveWrap(g, line, 820, 3, 36, 26, (s) => serif(s, "i400"));
      y = drawLines(g, wrapped.lines, cx, y, serif(wrapped.size, "i400"), LACE, wrapped.size * 1.45) + 56;
    });
    sparkle(g, cx - 330, 560, 15, LACE);
    sparkle(g, cx + 330, 560, 15, LACE);
    socialFooter(g, ctx, true);
    return canvas;
  };
}

/** A single wine story built around the guest-upload QR (falls back to an invitation-line if no QR). */
function uploadQrStory(ctx: SocialContext): HTMLCanvasElement {
  const { canvas, g } = storyCanvas();
  wineFill(g, STORY_W, STORY_H);
  wineHeader(g, ctx, "Share the Day With Us");
  const cx = STORY_W / 2;
  caps(g, "SEND US YOUR PHOTOS & VIDEOS", cx, 520, 30, LACE, 0.24);
  if (ctx.qrImage) {
    const size = 620;
    roundRect(g, cx - size / 2 - 32, 600, size + 64, size + 64, 30);
    g.fillStyle = PAPER;
    g.fill();
    g.drawImage(ctx.qrImage, cx - size / 2, 632, size, size);
    caps(g, "SCAN · UPLOAD UP TO 25 MEMORIES", cx, 1370, 26, PAPER, 0.18);
  } else {
    g.font = serif(40, "i400");
    g.fillStyle = "rgba(252,250,245,0.88)";
    g.textAlign = "center";
    const lines = wrapLines(g, "The upload link is on your personal invitation — we cannot wait to see the day through your eyes.", serif(40, "i400"), 820);
    drawLines(g, lines, cx, 760, serif(40, "i400"), PAPER, 58);
  }
  g.font = serif(38, "600");
  g.fillStyle = LACE;
  g.textAlign = "center";
  g.fillText(ctx.handle, cx, 1500);
  socialFooter(g, ctx, true);
  return canvas;
}

/* ── 4:5 portrait feed posts (1080 × 1350) ── */

/** Handle + hashtags anchored to the bottom of whichever canvas height is passed. */
function postChrome(g: Ctx, ctx: SocialContext, onWine: boolean, h = POST_H) {
  const main = onWine ? PAPER : WINE;
  const cx = POST_W / 2;
  caps(g, ctx.handle, cx, h - 180, 28, main, 0.3);
  g.font = serif(34, "600");
  g.fillStyle = main;
  g.textAlign = "center";
  if (ctx.hashtags[0]) g.fillText(ctx.hashtags.join("  "), cx, h - 115);
}

function saveTheDatePost(ctx: SocialContext): HTMLCanvasElement[] {
  const { canvas, g } = postCanvas();
  paper(g, POST_W, POST_H);
  const cx = POST_W / 2;
  caps(g, "Save the Date", cx, 200, 34, WINE, 0.4);
  fit(g, ctx.couple, cx, 400, 104, (s) => script(s), WINE, 880);
  diamondRule(g, cx, 480, 220);
  g.font = serif(128, "600");
  g.fillStyle = INK;
  g.textAlign = "center";
  g.fillText("11.11.2026", cx, 720);
  g.font = serif(38, "i400");
  g.fillStyle = MOCHA;
  g.fillText(ctx.fullDateLabel, cx, 808);
  caps(g, ctx.venueName.toUpperCase(), cx, 930, 30, WINE, 0.34);
  g.font = sans(26, 400);
  g.fillStyle = TAUPE;
  g.fillText("Kingdom of Bahrain", cx, 990);
  postChrome(g, ctx, false);
  return [canvas];
}

function programmePost(ctx: SocialContext): HTMLCanvasElement[] {
  const { canvas, g } = postCanvas();
  paper(g, POST_W, POST_H);
  const cx = POST_W / 2;
  caps(g, "The Programme", cx, 160, 32, WINE, 0.38);
  fit(g, ctx.couple, cx, 280, 76, (s) => script(s), WINE, 860);
  let y = 420;
  WEDDING_PROGRAM_STOPS.forEach((stop) => {
    caps(g, stop.time, 150, y, 30, WINE, 0.08, "left");
    g.font = serif(38, "500");
    g.fillStyle = INK;
    g.textAlign = "left";
    g.fillText(stop.title, 430, y);
    g.strokeStyle = "rgba(188,169,148,0.5)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(150, y + 26);
    g.lineTo(930, y + 26);
    g.stroke();
    y += 118;
  });
  postChrome(g, ctx, false);
  return [canvas];
}

function attirePost(ctx: SocialContext): HTMLCanvasElement[] {
  const { canvas, g } = postCanvas();
  paper(g, POST_W, POST_H);
  const cx = POST_W / 2;
  const colors = ctx.attire.find((a) => a.group === "guests")?.colors ?? [];
  caps(g, "What to Wear", cx, 160, 32, WINE, 0.38);
  fit(g, ctx.couple, cx, 280, 74, (s) => script(s), WINE, 860);
  const perRow = Math.min(4, Math.max(2, colors.length));
  const shown = colors.slice(0, 8);
  const gap = 36;
  const gridW = 820;
  const r = Math.min(95, (gridW - gap * (perRow - 1)) / perRow / 2);
  const rows = Math.ceil(shown.length / perRow);
  const startX = cx - (perRow * (r * 2) + (perRow - 1) * gap) / 2 + r;
  const startY = 420;
  shown.forEach((c, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = startX + col * (r * 2 + gap);
    const y = startY + row * (r * 2 + 116);
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = c.hex;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = "rgba(51,39,31,0.18)";
    g.stroke();
    g.font = sans(22, 500);
    g.fillStyle = INK;
    g.textAlign = "center";
    g.fillText(c.name, x, y + r + 34);
  });
  g.font = serif(30, "i400");
  g.fillStyle = TAUPE;
  g.textAlign = "center";
  g.fillText("glossy greens & shining browns", cx, startY + rows * (r * 2 + 116) + 14);
  postChrome(g, ctx, false);
  return [canvas];
}

/** A paper post with a dashed 4:5 photo window the couple drops their own picture into. */
function photoFramePost(ctx: SocialContext): HTMLCanvasElement[] {
  const { canvas, g } = postCanvas();
  paper(g, POST_W, POST_H);
  const cx = POST_W / 2;
  // photo window — itself a 4:5 rectangle, so a phone picture fills it without cropping
  roundRect(g, 130, 120, 820, 800, 26);
  g.setLineDash([12, 14]);
  g.strokeStyle = TAUPE;
  g.lineWidth = 2.5;
  g.stroke();
  g.setLineDash([]);
  g.font = script(64);
  g.fillStyle = WINE;
  g.textAlign = "center";
  g.fillText("add your photo", cx, 480);
  g.font = sans(26, 400);
  g.fillStyle = TAUPE;
  g.fillText("(place your 4:5 picture inside this frame)", cx, 532);
  fit(g, ctx.couple, cx, 1030, 78, (s) => script(s), WINE, 880);
  caps(g, ctx.dateLabel, cx, 1100, 28, TAUPE, 0.32);
  postChrome(g, ctx, false);
  return [canvas];
}

function announcementPost(ctx: SocialContext): HTMLCanvasElement[] {
  const { canvas, g } = postCanvas();
  wineFill(g, POST_W, POST_H);
  const cx = POST_W / 2;
  caps(g, "We're getting married", cx, 330, 32, LACE, 0.38);
  fit(g, ctx.couple, cx, 540, 116, (s) => script(s), PAPER, 900);
  diamondRule(g, cx, 630, 220, "rgba(252,250,245,0.4)");
  caps(g, ctx.dateLabel, cx, 790, 36, PAPER, 0.34);
  g.font = serif(34, "i400");
  g.fillStyle = LACE;
  g.textAlign = "center";
  g.fillText(ctx.fullDateLabel, cx, 875);
  caps(g, ctx.venueName.toUpperCase(), cx, 980, 28, LACE, 0.32);
  postChrome(g, ctx, true);
  return [canvas];
}

/* ── Highlight covers (square 1:1; Instagram crops to a circle) ── */

const HIGHLIGHTS: { label: string; glyph: string }[] = [
  { label: "Programme", glyph: "◷" },
  { label: "Dress Code", glyph: "◉" },
  { label: "Venue", glyph: "⌂" },
  { label: "Questions", glyph: "?" },
  { label: "RSVP", glyph: "✉" },
  { label: "Entourage", glyph: "✿" },
  { label: "Gifts", glyph: "♡" },
  { label: "Moments", glyph: "✦" },
];

function highlightCovers(ctx: SocialContext): HTMLCanvasElement[] {
  return HIGHLIGHTS.map(({ label, glyph }) => {
    const { canvas, g } = coverCanvas();
    wineFill(g, COVER_SIZE, COVER_SIZE);
    const cx = COVER_SIZE / 2;
    // keep everything inside the centre 70% — Instagram's circle crop
    g.beginPath();
    g.arc(cx, 430, 150, 0, Math.PI * 2);
    g.strokeStyle = "rgba(252,250,245,0.55)";
    g.lineWidth = 2.5;
    g.stroke();
    g.font = serif(130, "500");
    g.fillStyle = PAPER;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(glyph, cx, 436);
    g.textBaseline = "alphabetic";
    caps(g, label.toUpperCase(), cx, 720, 40, PAPER, 0.3);
    g.font = script(58);
    g.fillStyle = LACE;
    g.textAlign = "center";
    g.fillText(ctx.couple, cx, 830);
    return canvas;
  });
}

/* ── the registry ── */

export const SOCIAL_TEMPLATES: SocialTemplate[] = [
  { id: "save-date-story", title: "Save the Date", category: "Announcements", format: "story", blurb: "The classic announcement — names, 11.11, venue.", render: saveTheDateStory },
  { id: "countdown-story", title: "Countdown", category: "Announcements", format: "story", blurb: "Auto-calculated from today's date — or blank it / set your own number in the countdown control above.", render: countdownStory },
  { id: "programme-series", title: "The Programme (3 stories)", category: "Programme", format: "story", blurb: "Cover, the full timeline, and who arrives when.", render: programmeSeries },
  { id: "attire-series", title: "What to Wear (2–3 stories)", category: "Attire", format: "story", blurb: "Cover with the dress note, the guest palette, and reserved family shades.", render: attireSeries },
  { id: "faq-series", title: "Questions Answered (1 + FAQs)", category: "FAQ", format: "story", blurb: "A cover plus one story per FAQ straight from your binder (first eight).", render: faqSeries },
  { id: "instructions-series", title: "Know Before You Go (2 stories)", category: "Instructions", format: "story", blurb: "Arrival rules, livestream, little ones — plus the tag & upload QR page.", render: instructionsSeries },
  { id: "rem-doors", title: "Reminder · Doors Close 4 PM", category: "Reminders", format: "story", blurb: "The 3:30 wedding-team call time and the 4 PM door close.", render: wineReminder("A gentle timing reminder", [`Doors close at ${CEREMONY_DOORS_CLOSE}`], [`Wedding team: majlis by ${ENTOURAGE_CALL_TIME}`, "After 4 PM, catch the livestream at the majlis with refreshments."]) },
  { id: "rem-majlis", title: "Reminder · 5:30 at the Majlis", category: "Reminders", format: "story", blurb: "Guest arrival: welcome toasts, snacks, then the 7 PM reception.", render: wineReminder("We can't wait to see you", [`${ALL_WELCOME_FROM} at the majlis`], ["Welcome toasts, snacks and photos", `Everyone enters the hall together at ${RECEPTION_AT}`]) },
  { id: "rem-tomorrow", title: "Reminder · Tomorrow!", category: "Reminders", format: "story", blurb: "The-eve hype story with the tag reminder.", render: wineReminder("One more sleep", ["Tomorrow!"], ["Take all the photos and tag us", "See you at the majlis ♡"]) },
  { id: "rem-tag", title: "Reminder · Tag Us", category: "Reminders", format: "story", blurb: "Handle and hashtag call-to-action for the day.", render: wineReminder("One tiny favour", ["Tag every moment"], ["Stories, reels, dance-floor clips — we want them all"]) },
  { id: "rem-kids", title: "Reminder · Adults-Only Ceremony", category: "Reminders", format: "story", blurb: "The closed-door ceremony note; little ones join from the reception.", render: wineReminder("A note about little ones", ["Adults-only ceremony"], ["Children are so welcome at the reception — and can watch the ceremony on the majlis livestream with refreshments."]) },
  { id: "rem-upload", title: "Reminder · Upload Your Photos", category: "Reminders", format: "story", blurb: "QR code story for the /upload album (up to 25 files).", render: (ctx) => [uploadQrStory(ctx)] },
  { id: "post-save-date", title: "Feed · Save the Date", category: "Feed posts", format: "post", blurb: "4:5 portrait announcement for the grid.", render: saveTheDatePost },
  { id: "post-programme", title: "Feed · Programme", category: "Feed posts", format: "post", blurb: "The day at a glance in 4:5 portrait.", render: programmePost },
  { id: "post-attire", title: "Feed · Dress Code Palette", category: "Feed posts", format: "post", blurb: "The guest swatches in one 4:5 post.", render: attirePost },
  { id: "post-photo-frame", title: "Feed · Photo Frame (add your picture)", category: "Feed posts", format: "post", blurb: "Paper frame with a dashed 4:5 window — drop your own photo in.", render: photoFramePost },
  { id: "post-announcement", title: "Feed · Wedding Announcement", category: "Feed posts", format: "post", blurb: "Wine 4:5 post with names and date.", render: announcementPost },
  { id: "highlight-covers", title: "Highlight Covers (set of 8)", category: "Highlight covers", format: "cover", blurb: "Programme, Dress Code, Venue, Questions, RSVP, Entourage, Gifts, Moments — square, circle-safe.", render: highlightCovers },
];

/* ───────────────────────── previews & downloads ───────────────────────── */

export function socialPageCount(t: SocialTemplate, ctx: SocialContext): number {
  return pagesOf(t, ctx).length;
}

export function socialPreviewUrls(t: SocialTemplate, ctx: SocialContext, previewWidth = 240): string[] {
  const pages = pagesOf(t, ctx);
  return pages.map((full) => {
    const scale = previewWidth / full.width;
    const preview = document.createElement("canvas");
    preview.width = previewWidth;
    preview.height = Math.round(full.height * scale);
    const g = preview.getContext("2d");
    if (!g) return full.toDataURL("image/png");
    g.drawImage(full, 0, 0, preview.width, preview.height);
    return preview.toDataURL("image/png");
  });
}

export function socialFilename(t: SocialTemplate, index: number, total: number): string {
  return slug(t.id, index + 1, total, t.format);
}

export async function downloadSocialTemplate(t: SocialTemplate, ctx: SocialContext, onPage?: (n: number, total: number) => void) {
  await loadIgFonts();
  const pages = pagesOf(t, ctx);
  for (let i = 0; i < pages.length; i++) {
    onPage?.(i + 1, pages.length);
    await savePng(pages[i], socialFilename(t, i, pages.length));
    if (i < pages.length - 1) await sleep(700); // browsers drop downloads fired back to back
  }
  return pages.length;
}
