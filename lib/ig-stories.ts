/**
 * Instagram Story templates, drawn on a 1080 × 1920 canvas — the exact 9:16 story size — in the
 * same paper, wine and Cormorant/Pinyon lettering as the downloadable invitation cards
 * (lib/card-draw.ts), so a saved story looks like a page torn from the wedding site.
 *
 * Three stories ship ready-made, matching the binder's social plan:
 *   · bingo      — the 6-grid wedding bingo guests screenshot and tick off in their own stories;
 *   · outfit     — the "What I Wore to …" vertical arch frame, with empty paper inside for a photo;
 *   · add-yours  — the text prompt for Instagram's own Add Yours sticker ("drop your favourite clip").
 *
 * Every word is editable in the binder (components/admin/ig-stories.tsx); these are only the
 * defaults and the drawing code. Nothing here is sent anywhere — the PNG is saved on the couple's
 * phone, exactly like the keepsake and programme cards.
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
  loadCardFonts,
  roundRect,
  savePng,
  script,
  serif,
  wrapLines,
} from "./card-draw";
import { shortDate } from "./guests";
import type { WeddingInfo } from "./types";

/** The exact Instagram Story / Reel cover canvas size (9:16). */
export const STORY_W = 1080;
export const STORY_H = 1920;

/** A softer lace fill for tiles sitting on the paper story. */
const LACE = "#F3E8D6";
const OAT = "#E9DFCE";
const MOSS = "#5E6B3A";

const sans = (size: number, weight: 300 | 400 | 500 = 400) => `${weight} ${size}px Jost, system-ui, sans-serif`;

export type IgStoryId = "bingo" | "outfit" | "add-yours";

export const IG_STORY_IDS: IgStoryId[] = ["bingo", "outfit", "add-yours"];

export const IG_STORY_META: Record<IgStoryId, { name: string; hint: string; filename: string }> = {
  bingo: {
    name: "Wedding Bingo · 6-grid Add Yours",
    hint: "Guests screenshot it, tick their six moments in Instagram's story editor and repost.",
    filename: "ig-story-wedding-bingo",
  },
  outfit: {
    name: "What I Wore · arch photo frame",
    hint: "A vertical arch frame with empty paper inside — guests add their outfit photo on top.",
    filename: "ig-story-what-i-wore",
  },
  "add-yours": {
    name: "Add Yours · favourite clip prompt",
    hint: "The text card for Instagram's own Add Yours sticker — drop your favourite clip.",
    filename: "ig-story-add-yours-prompt",
  },
};

/** The six bingo moments, in grid order (left → right, top → bottom). */
export const DEFAULT_BINGO_TILES = [
  "My Fit Check",
  "POV From My Seat",
  "The Couple",
  "Cocktail Bites",
  "Tearjerker Moment",
  "After-Party",
];

/** Everything the drawings read — all plain strings so the binder can edit any of it. */
export type IgStoryData = {
  /** "Jeger & Shaira" — the script line under each kicker. */
  couple: string;
  /** "11.11.2026" */
  dateLabel: string;
  /** "@shaiandjeg" — kept with the @, drawn as saved. */
  handle: string;
  /** "#JSGotMarried" — the primary hashtag. */
  hashtag: string;
  /** Secondary hashtags drawn small under the primary one. */
  extraHashtags: string[];
  /** Exactly six bingo tile labels. */
  bingoTiles: string[];
  /** The line above the couple's names on the outfit story. */
  outfitKicker: string;
  /** e.g. "Jeger & Shai's Wedding" — the big capped word on the outfit story. */
  outfitEvent: string;
  /** The Add Yours prompt sentence. */
  addYoursPrompt: string;
  /** The tiny how-to under the Add Yours sticker mock. */
  addYoursHint: string;
};

export function igStoryDataFromInfo(info?: WeddingInfo): IgStoryData {
  const tags = (info?.hashtags ?? []).filter(Boolean);
  return {
    couple: info?.bride && info?.groom ? `${info.groom} & ${info.bride}` : "Jeger & Shaira",
    dateLabel: shortDate(info?.date) || "11.11.2026",
    handle: info?.instagram?.trim() || "@shaiandjeg",
    hashtag: tags[0] || "#JSGotMarried",
    extraHashtags: tags.slice(1),
    bingoTiles: [...DEFAULT_BINGO_TILES],
    outfitKicker: "What I Wore to",
    outfitEvent: `${(info?.groom || "Jeger")} & ${(info?.bride || "Shaira")}'s Wedding`,
    addYoursPrompt: `Drop your favourite clip from ${(info?.groom || "Jeger")} & ${(info?.bride || "Shaira")}'s wedding`,
    addYoursHint: "Screenshot this card, then add Instagram's “Add Yours” sticker on top",
  };
}

/* ───────────────────────── shared drawing bits ───────────────────────── */

type Ctx = CanvasRenderingContext2D;

function newCanvas(): { canvas: HTMLCanvasElement; g: Ctx } {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("Could not prepare the Instagram story canvas.");
  return { canvas, g };
}

/** Paper background with the invitation's double-rule frame. */
function paperFrame(g: Ctx) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, STORY_W, STORY_H);
  g.strokeStyle = WINE;
  g.lineWidth = 3;
  g.strokeRect(48, 48, STORY_W - 96, STORY_H - 96);
  g.strokeStyle = EDGE;
  g.lineWidth = 1.2;
  g.strokeRect(66, 66, STORY_W - 132, STORY_H - 132);
}

/** Full-bleed wine background with a delicate paper hairline frame. */
function wineFrame(g: Ctx) {
  g.fillStyle = WINE;
  g.fillRect(0, 0, STORY_W, STORY_H);
  g.strokeStyle = "rgba(252,250,245,0.55)";
  g.lineWidth = 2;
  g.strokeRect(52, 52, STORY_W - 104, STORY_H - 104);
  g.strokeStyle = "rgba(252,250,245,0.28)";
  g.lineWidth = 1;
  g.strokeRect(70, 70, STORY_W - 140, STORY_H - 140);
}

/** A little line camera glyph, drawn in the current stroke style. */
function cameraIcon(g: Ctx, cx: number, cy: number, size: number, color: string, lineWidth = 3) {
  const w = size;
  const h = size * 0.76;
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lineWidth;
  roundRect(g, cx - w / 2, cy - h / 2, w, h, size * 0.16);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(cx + w * 0.32, cy - h * 0.32, size * 0.06, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  g.restore();
}

/** A four-point sparkle, in the current fill style. */
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

function footer(g: Ctx, d: IgStoryData, onWine = false) {
  const main = onWine ? PAPER : WINE;
  const sub = onWine ? "rgba(252,250,245,0.72)" : TAUPE;
  const cx = STORY_W / 2;
  caps(g, d.handle, cx, 1668, 30, main, 0.3);
  g.font = serif(40, "600");
  g.fillStyle = main;
  g.textAlign = "center";
  g.fillText(d.hashtag, cx, 1736);
  if (d.extraHashtags.length) {
    g.font = sans(26, 400);
    g.fillStyle = sub;
    g.fillText(d.extraHashtags.join("  ·  "), cx, 1786);
  }
}

/* ───────────────────────── story 1 · wedding bingo ───────────────────────── */

function drawBingo(d: IgStoryData): HTMLCanvasElement {
  const { canvas, g } = newCanvas();
  paperFrame(g);
  const cx = STORY_W / 2;

  caps(g, "Wedding Bingo", cx, 178, 36, WINE, 0.42);
  fit(g, d.couple, cx, 300, 118, (s) => script(s), WINE, 820);
  caps(g, d.dateLabel, cx, 372, 30, TAUPE, 0.34);
  diamondRule(g, cx, 424, 250, EDGE);

  // 2 × 3 grid
  const side = 96;
  const gap = 36;
  const top = 486;
  const bottom = 1556;
  const tileW = (STORY_W - side * 2 - gap) / 2;
  const tileH = (bottom - top - gap * 2) / 3;
  const tiles = (d.bingoTiles.length ? d.bingoTiles : DEFAULT_BINGO_TILES).slice(0, 6);

  tiles.forEach((label, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = side + col * (tileW + gap);
    const y = top + row * (tileH + gap);

    roundRect(g, x, y, tileW, tileH, 26);
    g.fillStyle = "#FFFFFF";
    g.fill();
    g.strokeStyle = OAT;
    g.lineWidth = 2;
    g.stroke();

    // empty tick circle — the "bingo square" guests fill in their story editor
    g.beginPath();
    g.arc(x + tileW - 46, y + 46, 19, 0, Math.PI * 2);
    g.strokeStyle = WINE;
    g.lineWidth = 2.5;
    g.stroke();

    // numbered wine disc
    g.beginPath();
    g.arc(x + tileW / 2, y + 86, 32, 0, Math.PI * 2);
    g.fillStyle = WINE;
    g.fill();
    g.font = serif(34, "600");
    g.fillStyle = PAPER;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(i + 1), x + tileW / 2, y + 88);
    g.textBaseline = "alphabetic";

    // label, wrapped to the tile
    const font = serif(46, "500");
    const lines = wrapLines(g, label, font, tileW - 72);
    drawLines(g, lines, x + tileW / 2, y + tileH / 2 + 34, font, INK, 54);
  });

  g.font = sans(26, 400);
  g.fillStyle = TAUPE;
  g.textAlign = "center";
  g.fillText("Screenshot · tick off your six · share to your story", cx, 1612);
  footer(g, d);
  return canvas;
}

/* ───────────────────────── story 2 · what I wore arch ───────────────────────── */

/** A tall arch path (rounded top, square foot), centred on `cx`. */
function archPath(g: Ctx, cx: number, top: number, width: number, height: number) {
  const r = width / 2;
  const left = cx - width / 2;
  g.beginPath();
  g.moveTo(left, top + height);
  g.lineTo(left, top + r);
  g.arc(cx, top + r, r, Math.PI, 0, false);
  g.lineTo(cx + width / 2, top + height);
  g.closePath();
}

function drawOutfit(d: IgStoryData): HTMLCanvasElement {
  const { canvas, g } = newCanvas();
  wineFrame(g);
  const cx = STORY_W / 2;

  caps(g, d.outfitKicker, cx, 208, 34, PAPER, 0.42);
  fit(g, d.couple, cx, 336, 118, (s) => script(s), PAPER, 860);
  caps(g, d.outfitEvent, cx, 414, 52, PAPER, 0.3);
  g.font = sans(28, 300);
  g.fillStyle = "rgba(252,250,245,0.75)";
  g.textAlign = "center";
  g.fillText(d.dateLabel, cx, 470);

  // the photo arch — paper inside so a guest's photo has a bright frame to sit on
  const archW = 640;
  const archTop = 548;
  const archH = 940;
  archPath(g, cx, archTop, archW, archH);
  g.fillStyle = PAPER;
  g.fill();

  // dashed inner arch, the reserved photo area
  g.save();
  archPath(g, cx, archTop + 34, archW - 68, archH - 68);
  g.setLineDash([10, 12]);
  g.strokeStyle = TAUPE;
  g.lineWidth = 2;
  g.stroke();
  g.restore();

  cameraIcon(g, cx, archTop + 360, 96, WINE, 3.5);
  g.font = script(56);
  g.fillStyle = WINE;
  g.textAlign = "center";
  g.fillText("add your photo here", cx, archTop + 480);
  g.font = sans(26, 400);
  g.fillStyle = TAUPE;
  g.fillText("(your outfit of the night)", cx, archTop + 528);
  sparkle(g, cx - archW / 2 + 60, archTop + 120, 14, MOSS);
  sparkle(g, cx + archW / 2 - 60, archTop + 120, 14, MOSS);

  g.font = sans(26, 400);
  g.fillStyle = "rgba(252,250,245,0.78)";
  g.textAlign = "center";
  g.fillText("Screenshot · place your photo inside the arch · tag us", cx, 1612);
  footer(g, d, true);
  return canvas;
}

/* ───────────────────────── story 3 · add yours prompt ───────────────────────── */

function drawAddYours(d: IgStoryData): HTMLCanvasElement {
  const { canvas, g } = newCanvas();
  wineFrame(g);
  const cx = STORY_W / 2;

  sparkle(g, 190, 250, 16, LACE);
  sparkle(g, STORY_W - 190, 250, 16, LACE);
  caps(g, "Add Yours", cx, 268, 40, PAPER, 0.5);
  diamondRule(g, cx, 326, 220, "rgba(252,250,245,0.45)");

  // the prompt itself, generous leading in the middle third
  const promptFont = serif(66, "500");
  const promptLines = wrapLines(g, d.addYoursPrompt, promptFont, 840);
  drawLines(g, promptLines, cx, 560, promptFont, PAPER, 92);

  fit(g, d.hashtag, cx, 1010, 84, (s) => serif(s, "600"), LACE, 860);

  // mock of Instagram's Add Yours sticker: a white pill with a camera glyph
  const pillW = 480;
  const pillH = 118;
  const pillY = 1150;
  roundRect(g, cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
  g.fillStyle = PAPER;
  g.fill();
  cameraIcon(g, cx - 140, pillY + pillH / 2, 44, WINE, 3.4);
  g.font = sans(40, 500);
  g.fillStyle = WINE;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("Add Yours", cx + 34, pillY + pillH / 2 + 2);
  g.textBaseline = "alphabetic";

  const hintFont = sans(28, 400);
  const hintLines = wrapLines(g, d.addYoursHint, hintFont, 760);
  drawLines(g, hintLines, cx, 1380, hintFont, "rgba(252,250,245,0.78)", 38);

  g.font = sans(26, 400);
  g.fillStyle = "rgba(252,250,245,0.65)";
  g.textAlign = "center";
  g.fillText(`${d.handle}  ·  ${d.dateLabel}`, cx, 1560);
  return canvas;
}

/* ───────────────────────── transparent story frames ─────────────────────────
   No paper, no card: just the couple's own typography and ornaments on a fully
   transparent 1080×1920 PNG, so it can be laid on top of any photo inside
   Instagram's own story editor. Every element is optional (see IgFrameElements). */

export type IgFrameLayout = "top" | "bottom" | "center" | "corner";
export type IgFrameSide = "left" | "right";
export type IgFrameColorName = "wine" | "paper" | "ink";

export const IG_FRAME_LAYOUTS: { id: IgFrameLayout; label: string }[] = [
  { id: "top", label: "Top ribbon" },
  { id: "bottom", label: "Bottom ribbon" },
  { id: "center", label: "Centered" },
  { id: "corner", label: "Corner mark" },
];

export const IG_FRAME_COLORS: Record<IgFrameColorName, { label: string; hex: string }> = {
  wine: { label: "Wine", hex: WINE },
  paper: { label: "Paper (white)", hex: PAPER },
  ink: { label: "Ink", hex: INK },
};

export type IgFrameElements = {
  monogram: boolean;
  names: boolean;
  flourish: boolean;
  date: boolean;
  handle: boolean;
  hashtags: boolean;
};

export type IgFrameOptions = {
  layout: IgFrameLayout;
  /** Corner layout only — which corner the compact mark hugs. */
  side: IgFrameSide;
  color: IgFrameColorName;
  elements: IgFrameElements;
};

export const DEFAULT_FRAME_OPTIONS: IgFrameOptions = {
  layout: "bottom",
  side: "right",
  color: "wine",
  elements: { monogram: true, names: true, flourish: true, date: true, handle: true, hashtags: true },
};

/** The flourish divider from components/public/ornaments.tsx, redrawn on canvas (viewBox 240×40). */
function flourishOnCanvas(g: Ctx, cx: number, cy: number, width: number, color: string): number {
  const half =
    "M4 20 H70 M70 20 C84 20 88 10 98 11 C106 12 106 22 99 23 C94 24 92 18 97 17 M70 20 C80 22 84 30 92 29 M58 20 C62 14 68 13 72 15";
  const scale = width / 240;
  g.save();
  g.translate(cx, cy);
  g.scale(scale, scale);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = 1;
  g.lineCap = "round";
  const path = new Path2D(half);
  g.stroke(path);
  g.save();
  g.scale(-1, 1);
  g.stroke(path);
  g.restore();
  g.stroke(new Path2D("M120 8 L127 20 L120 32 L113 20 Z"));
  [
    [120, 20, 2.2],
    [106, 20, 1.3],
    [134, 20, 1.3],
  ].forEach(([x, y, r]) => {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
  return 40 * scale;
}

/** "Jeger & Shaira" → "J&S" (falls back to a plain ampersand mark if names are missing). */
function coupleInitials(couple: string): string {
  const parts = couple.split(/\s*&\s*/).map((p) => p.trim()).filter(Boolean);
  const letters = parts.map((p) => p[0]?.toUpperCase() ?? "").filter(Boolean);
  return letters.length >= 2 ? letters.join("&") : "J&S";
}

/** A thin circular monogram seal with the couple's initials. */
function monogramOnCanvas(g: Ctx, cx: number, cy: number, color: string, initials: string, radius = 86): number {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(cx, cy, radius, 0, Math.PI * 2);
  g.stroke();
  g.font = script(radius * 1.08);
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(initials, cx, cy + radius * 0.08);
  g.textBaseline = "alphabetic";
  g.restore();
  return radius * 2;
}

type BlockSize = { width: number; height: number };

/**
 * Draws one stacked, centred block of the chosen elements. Local origin is the
 * block's top centre, so callers translate/scale it into a ribbon or corner.
 * Returns the block's unscaled size for layout math.
 */
function drawFrameBlock(g: Ctx, d: IgStoryData, options: IgFrameOptions, color: string): BlockSize {
  const els = options.elements;
  let y = 0;
  const widest = 880;

  if (els.monogram) {
    monogramOnCanvas(g, 0, y + 86, color, coupleInitials(d.couple));
    y += 172 + 26;
  }
  if (els.names) {
    fit(g, d.couple, 0, y + 104, 118, (s) => script(s), color, widest, "center", 64);
    y += 104 + 30;
  }
  if (els.flourish) {
    const h = flourishOnCanvas(g, 0, y + 20, 360, color);
    y += h + 34;
  }
  if (els.date) {
    caps(g, d.dateLabel, 0, y + 40, 42, color, 0.34);
    y += 40 + 30;
  }
  if (els.handle) {
    g.font = serif(36, "i500");
    g.fillStyle = color;
    g.textAlign = "center";
    g.fillText(d.handle, 0, y + 34);
    y += 34 + 26;
  }
  if (els.hashtags && d.hashtag) {
    g.font = serif(40, "600");
    g.fillStyle = color;
    g.textAlign = "center";
    g.fillText(d.hashtag, 0, y + 38);
    y += 38 + 8;
    if (d.extraHashtags.length) {
      g.font = sans(28, 400);
      g.fillText(d.extraHashtags.join("  ·  "), 0, y + 30);
      y += 30;
    }
    y += 24;
  }
  return { width: widest, height: Math.max(1, y) };
}

/**
 * The transparent overlay: a fresh canvas with NO background fill, so the exported
 * PNG keeps its alpha channel and drops straight onto a photo in Instagram.
 */
export function renderIgFrame(d: IgStoryData, options: IgFrameOptions): HTMLCanvasElement {
  const { canvas, g } = newCanvas();
  const color = IG_FRAME_COLORS[options.color].hex;
  const isCorner = options.layout === "corner";
  const scale = isCorner ? 0.62 : 1;
  const margin = 110;

  g.save();
  if (isCorner) {
    // Compact mark hugging one top corner; the block is drawn centred on its own origin.
    const halfWidth = (880 / 2) * scale;
    const cx = options.side === "right" ? STORY_W - margin - halfWidth : margin + halfWidth;
    g.translate(cx, 150);
    g.scale(scale, scale);
    drawFrameBlock(g, d, options, color);
  } else {
    const size = drawFrameBlockSize(g, d, options);
    let topY: number;
    if (options.layout === "top") topY = 200;
    else if (options.layout === "bottom") topY = STORY_H - 200 - size.height;
    else topY = (STORY_H - size.height) / 2;
    g.translate(STORY_W / 2, topY);
    drawFrameBlock(g, d, options, color);
  }
  g.restore();
  return canvas;
}

/** Measure a block without drawing — needed to centre/bottom-align the ribbons. */
function drawFrameBlockSize(g: Ctx, d: IgStoryData, options: IgFrameOptions): BlockSize {
  g.save();
  g.translate(-99999, -99999);
  const size = drawFrameBlock(g, d, options, "transparent");
  g.restore();
  return size;
}

export function igFrameFilename(options: IgFrameOptions): string {
  const corner = options.layout === "corner" ? `-${options.side}` : "";
  return `ig-frame-${options.layout}${corner}-${options.color}-1080x1920.png`;
}

/** Scaled transparent PNG for the binder preview. */
export function igFramePreviewDataUrl(d: IgStoryData, options: IgFrameOptions, previewWidth = 300): string {
  const full = renderIgFrame(d, options);
  const scaleP = previewWidth / STORY_W;
  const preview = document.createElement("canvas");
  preview.width = previewWidth;
  preview.height = Math.round(STORY_H * scaleP);
  const g = preview.getContext("2d");
  if (!g) return full.toDataURL("image/png");
  g.drawImage(full, 0, 0, preview.width, preview.height);
  return preview.toDataURL("image/png");
}

export async function downloadIgFrame(d: IgStoryData, options: IgFrameOptions): Promise<boolean> {
  await loadIgFonts();
  const canvas = renderIgFrame(d, options);
  return savePng(canvas, igFrameFilename(options));
}

/* ───────────────────────── public API ───────────────────────── */

export function renderIgStory(id: IgStoryId, data: IgStoryData): HTMLCanvasElement {
  if (id === "bingo") return drawBingo(data);
  if (id === "outfit") return drawOutfit(data);
  return drawAddYours(data);
}

/** Wait for every face the stories use — Jost is the sans used for the small how-to lines. */
export async function loadIgFonts() {
  await loadCardFonts([
    '300 28px "Jost"',
    '400 26px "Jost"',
    '500 40px "Jost"',
    '600 34px "Cormorant Garamond"',
    '500 46px "Cormorant Garamond"',
    '500 66px "Cormorant Garamond"',
    '118px "Pinyon Script"',
  ]);
}

export function igStoryFilename(id: IgStoryId) {
  return `${IG_STORY_META[id].filename}-1080x1920.png`;
}

/** A scaled PNG data URL for the binder preview (the download itself always uses the full 1080×1920). */
export function igStoryPreviewDataUrl(id: IgStoryId, data: IgStoryData, previewWidth = 330): string {
  const full = renderIgStory(id, data);
  const scale = previewWidth / STORY_W;
  const preview = document.createElement("canvas");
  preview.width = previewWidth;
  preview.height = Math.round(STORY_H * scale);
  const g = preview.getContext("2d");
  if (!g) return full.toDataURL("image/png");
  g.drawImage(full, 0, 0, preview.width, preview.height);
  return preview.toDataURL("image/png");
}

export async function downloadIgStory(id: IgStoryId, data: IgStoryData): Promise<boolean> {
  await loadIgFonts();
  const canvas = renderIgStory(id, data);
  return savePng(canvas, igStoryFilename(id));
}
