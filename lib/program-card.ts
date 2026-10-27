import { EDGE, LACE, MOCHA, PAPER, TAUPE, WINE, caps, diamondRule, drawLines, fit, loadCardFonts, paper, pin, roundRect, savePng, script, serif, text, wrap, wrapLines } from "./card-draw";
import { ARRIVAL_NOTES, GUEST_ARRIVAL_GUIDE, PROGRAM_HEADLINE, PROGRAM_HEADLINE_DETAIL, type ProgramStop } from "./program";
import { MAP_H, MAP_W, PARKING_NOTE, VENUE_MAP_LEGEND, drawVenueMap } from "./venue-map";

/**
 * The programme card — the guest's downloadable "how the day works" PNG, drawn in their own browser
 * the moment they ask for it (no server, no upload), a sister to the invitation keepsake.
 *
 * Where the keepsake is about *them* (their seats, their code), this card is about *the day*, and it
 * leads with the one thing guests keep getting wrong: nobody has to be there at 4:00 PM. In order:
 *   1. one panel to read first — the headline, the ceremony in two sentences, and under a hairline
 *      the two notes side by side: the entourage & wedding team (3:30, reserved seats, wait for the
 *      cue) and every other guest (5:30 at the majlis, reception at 7:00);
 *   2. the plan of the venue with its one-line legend, and beside it the wayfinding notes — where to
 *      go if you arrive at another hour (early for the ceremony, or while it is under way) and where
 *      the cars go — so "the majlis" and "the hall" are places, not words;
 *   3. the order of the day — the facts as short tags beside the stops, the warm lines under the
 *      two hours that hold the evening — the dress code in one line, and the couple's sign-off.
 *
 * The card is a 9:16 portrait — a phone screen, a story — so it is seen whole, never scrolled.
 * Every fact is said once and the card uses its width (two columns wherever two things belong side
 * by side) so that everything fits that frame in type that reads without zooming; whatever room is
 * left over is shared out between the sections as air, so the frame is always full and never
 * crowded. Should the wording ever outgrow it, the card simply grows taller rather than cut a line.
 * All wording comes from lib/program.ts, the same source as the website's Program section.
 */
export type ProgramCardData = {
  groom: string;
  bride: string;
  dateISO: string;
  venue: string;
  address: string;
  program: ProgramStop[];
  dressNote: string;   // one short line, e.g. "Black tie in glossy greens and warm shining browns"
  hashtags: string[];
};

const W = 1500;
const CX = W / 2;
/** 9:16 — the height of a phone screen at this width. The card is never shorter than this. */
const FRAME_H = Math.round((W * 16) / 9);
/** Side margin inside the double border. */
const M = 110;
const INNER = W - 2 * M;
/** The least room above the first line and under the last, inside the border. */
const HEAD = 104;
const FOOT = 104;

/* the order of the day: times end at TIME_R, a dot on the axis, titles start at TITLE_L (as on the keepsake,
   set a little further left here so a tag fits beside its title and a note fits under it in one line) */
const TIME_R = CX - 200;
const AXIS_X = CX - 170;
const TITLE_L = CX - 140;
const TITLE_W = W - 110 - TITLE_L;

/** A soft lace panel with a wine rule — the card's way of saying "this bit matters". */
function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = LACE) {
  roundRect(g, x, y, w, h, 6);
  g.fillStyle = fill; g.fill();
  g.strokeStyle = WINE; g.lineWidth = 1.8; g.stroke();
  roundRect(g, x + 8, y + 8, w - 16, h - 16, 3);
  g.strokeStyle = EDGE; g.lineWidth = 1; g.stroke();
}

function hairline(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  g.strokeStyle = EDGE; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

function dotted(g: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  g.strokeStyle = EDGE; g.lineWidth = 1; g.setLineDash([2, 6]);
  g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
  g.setLineDash([]);
}

/* ── 1. read this first: the headline, the ceremony in two sentences, and who arrives when ── */
function drawHeadline(g: CanvasRenderingContext2D, y: number) {
  const pad = 42;
  const textW = INNER - 2 * pad;
  const bodyFont = serif(29, "i400");
  const body = wrapLines(g, PROGRAM_HEADLINE_DETAIL, bodyFont, textW);
  const bodyLead = 40;
  // the two notes, side by side under a hairline: who · please arrive by · the hour, large · where · what to do
  const gap = 52;
  const colW = (textW - gap) / 2;
  const noteFont = serif(27, "i400");
  const noteLead = 36;
  const notes = [ARRIVAL_NOTES.entourage, ARRIVAL_NOTES.guests].map((n) => ({ ...n, lines: wrapLines(g, n.detail, noteFont, colW - 12) }));
  // the layout, top to bottom
  const kickerY = pad + 22;
  const headY = kickerY + 72;
  const bodyY = headY + 60;
  const ruleY = bodyY + (body.length - 1) * bodyLead + 38;
  const whoY = ruleY + 44;
  const byY = whoY + 36;
  const hourY = byY + 60;
  const whereY = hourY + 42;
  const detailY = whereY + 44;
  const h = detailY + (Math.max(...notes.map((n) => n.lines.length)) - 1) * noteLead + pad + 4;
  panel(g, M, y, INNER, h);

  caps(g, "Please read this first", CX, y + kickerY, 23, WINE, 0.32);
  fit(g, PROGRAM_HEADLINE, CX, y + headY, 54, (s) => serif(s, "600"), WINE, textW);
  drawLines(g, body, CX, y + bodyY, bodyFont, MOCHA, bodyLead);
  hairline(g, M + pad + 40, y + ruleY, W - M - pad - 40, y + ruleY);

  notes.forEach((n, i) => {
    const cx = M + pad + i * (colW + gap) + colW / 2;
    caps(g, n.who, cx, y + whoY, 22, WINE, 0.26);
    caps(g, "please arrive by", cx, y + byY, 19, TAUPE, 0.3);
    text(g, n.time, cx, y + hourY, serif(64, "600"), WINE);
    caps(g, `head to ${n.where}`, cx, y + whereY, 22, MOCHA, 0.24);
    drawLines(g, n.lines, cx, y + detailY, noteFont, MOCHA, noteLead);
  });
  hairline(g, CX, y + whoY - 24, CX, y + h - pad + 4);
  return y + h;
}

/* ── 2. the plan of the venue, and beside it the wayfinding notes: another hour, and the cars ── */
function drawMap(g: CanvasRenderingContext2D, y: number, venue: string) {
  caps(g, `Finding your way at ${venue}`, CX, y, 24, TAUPE, 0.3);
  y += 40;
  const mapW = 660;
  const mapH = Math.round((mapW * MAP_H) / MAP_W);
  const x = M - 24;
  // a thin paper mount around the plan
  roundRect(g, x - 10, y - 10, mapW + 20, mapH + 20, 8);
  g.fillStyle = PAPER; g.fill();
  g.strokeStyle = EDGE; g.lineWidth = 1.2; g.stroke();
  drawVenueMap(g, x, y, mapW, mapH);

  // the legend in one line under the plan — the same numbers as the pins
  const ly = y + mapH + 50;
  const legendFont = serif(26, "600");
  g.font = legendFont;
  const items = VENUE_MAP_LEGEND.map((item) => ({ ...item, w: 40 + g.measureText(item.place).width }));
  const between = 36;
  let lx = x + mapW / 2 - (items.reduce((s, it) => s + it.w, 0) + between * (items.length - 1)) / 2;
  items.forEach((item) => {
    pin(g, item.n, lx + 13, ly - 9, 13);
    text(g, item.place, lx + 40, ly, legendFont, MOCHA, "left");
    lx += item.w + between;
  });

  // beside the plan: where to go if you arrive at some other hour — and where the cars go
  const colL = x + mapW + 50;
  const colW = W - x - colL;
  let cy = y + 24;
  cy = drawLines(g, ["Arriving at another hour?", "Here's where to go"], colL, cy, serif(28, "i500"), WINE, 35, "left");
  cy = wrap(g, `everyone begins at the majlis — the hall rests until 4:00 PM while it is cleaned & prepared`, colL, cy + 34, serif(22, "i400"), TAUPE, 28, colW, "left");
  cy += 54;
  const rows = [...GUEST_ARRIVAL_GUIDE, PARKING_NOTE];
  rows.forEach((row, i) => {
    text(g, row.when, colL, cy, serif(29, "600"), WINE, "left");
    const whenW = g.measureText(row.when).width;
    g.fillStyle = EDGE; g.beginPath(); g.arc(colL + whenW + 18, cy - 10, 3.5, 0, Math.PI * 2); g.fill();
    text(g, row.where, colL + whenW + 34, cy, serif(30, "600"), MOCHA, "left");
    cy = wrap(g, row.detail, colL, cy + 36, serif(25, "i400"), TAUPE, 32, colW, "left");
    if (i < rows.length - 1) {
      cy += 28;
      dotted(g, colL, colL + colW, cy);
      cy += 42;
    }
  });
  return Math.max(ly, cy);
}

/* ── 3. the order of the day: the facts as tags beside the stops, the warm lines under the hours that hold the evening ── */
function drawProgram(g: CanvasRenderingContext2D, y: number, program: ProgramStop[]) {
  caps(g, "The order of the day", CX, y, 25, TAUPE, 0.3);
  y += 60;
  const lead = 48;
  const noteFont = serif(24, "i400");
  program.forEach((p) => {
    text(g, p.time, TIME_R, y, serif(31, "600"), WINE, "right");
    g.fillStyle = EDGE; g.beginPath(); g.arc(AXIS_X, y - 10, 3.5, 0, Math.PI * 2); g.fill();
    text(g, p.title, TITLE_L, y, serif(31, "400"), MOCHA, "left");
    const titleW = g.measureText(p.title).width;
    let last = y; // baseline of the stop's last line
    if (p.tag) {
      // the fact in a few words, beside the title — under it only if the line would run long
      const tag = `— ${p.tag.charAt(0).toLowerCase()}${p.tag.slice(1)}`;
      g.font = noteFont;
      if (titleW + 14 + g.measureText(tag).width <= TITLE_W) text(g, tag, TITLE_L + titleW + 14, y, noteFont, WINE, "left");
      else last = wrap(g, tag.slice(2), TITLE_L, last + 34, noteFont, WINE, 31, TITLE_W, "left");
    }
    if (p.programmeNote) last = wrap(g, p.programmeNote, TITLE_L, last + (last === y ? 34 : 31), noteFont, WINE, 31, TITLE_W, "left");
    y = last + lead;
  });
  return y - lead;
}

/**
 * Draw the whole card. `air` is the room left over inside the 9:16 frame once everything is set;
 * it is shared out — a fifth above the title, a fifth between each pair of sections, a fifth
 * under the sign-off — so the frame is always full. Returns the baseline of the last line.
 */
function draw(g: CanvasRenderingContext2D, d: ProgramCardData, height: number, air = 0) {
  paper(g, W, height);
  const breath = air / 5;

  let y = HEAD + breath;
  caps(g, "J & S · the programme", CX, y, 26, TAUPE, 0.34);
  y += 40;
  text(g, `${d.groom} & ${d.bride}`, CX, y + 70, script(96), WINE);
  y += 124;
  caps(g, "Our wedding day — how it unfolds", CX, y, 25, TAUPE, 0.3);
  y += 54;
  const when = new Date(d.dateISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });
  text(g, when, CX, y + 12, serif(44, "500"), MOCHA);
  y += 58;
  text(g, `${d.venue} · ${d.address}`, CX, y + 4, serif(30, "i400"), TAUPE);
  y += 66;
  diamondRule(g, CX, y);
  y += 46;

  y = drawHeadline(g, y) + 56 + breath;
  y = drawMap(g, y, d.venue) + 60 + breath;
  diamondRule(g, CX, y - 30 - breath / 2);
  y = drawProgram(g, y + 14, d.program) + 52 + breath;

  y = wrap(g, `Dress code — ${d.dressNote}`, CX, y, serif(28, "i400"), TAUPE, 38, W - 300);
  y += 76;
  text(g, "See you there", CX, y, script(72), WINE);
  y += 52;
  caps(g, `with love, ${d.groom} & ${d.bride}`, CX, y, 22, TAUPE, 0.3);
  if (d.hashtags.length) {
    y += 50;
    caps(g, d.hashtags.join(" · "), CX, y, 22, TAUPE, 0.24);
  }
  return y;
}

/**
 * Draw the card onto a fresh canvas: a 9:16 frame, with the room left over shared out as air — or,
 * should the wording ever outgrow the frame, a taller card rather than a cut line. Exported for
 * previews and tests; `downloadProgramCard` is the guest's door.
 */
export function renderProgramCard(d: ProgramCardData): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  if (!g) return null;
  // Two passes: measure on a generous canvas, then draw into the frame with the slack shared out.
  const PROBE = 6000;
  c.width = W; c.height = PROBE;
  const need = Math.ceil(draw(g, d, PROBE) + FOOT);
  const height = Math.max(FRAME_H, need);
  c.height = height; // resizing clears the canvas — draw() sets every style it uses
  draw(g, d, height, height - need);
  return c;
}

/** Draw the programme card and save it as a PNG. Never throws — resolves false if the browser refused. */
export async function downloadProgramCard(d: ProgramCardData) {
  await loadCardFonts(['600 64px "Cormorant Garamond"', '72px "Pinyon Script"']);
  try {
    const c = renderProgramCard(d);
    if (!c) return false;
    return await savePng(c, `programme-${d.groom.toLowerCase()}-${d.bride.toLowerCase()}-11.11.2026.png`);
  } catch {
    return false;
  }
}
