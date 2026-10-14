import { EDGE, LACE, MOCHA, PAPER, TAUPE, WINE, caps, diamondRule, drawLines, fit, loadCardFonts, paper, pin, roundRect, savePng, script, serif, text, wrap, wrapLines } from "./card-draw";
import { ALL_WELCOME_FROM, ARRIVAL_NOTES, ENTOURAGE_CALL_TIME, GUEST_ARRIVAL_GUIDE, PROGRAM_HEADLINE, PROGRAM_HEADLINE_DETAIL, RECEPTION_AT, type ProgramStop } from "./program";
import { MAP_H, MAP_W, VENUE_MAP_LEGEND, drawVenueMap } from "./venue-map";

/**
 * The programme card — the guest's downloadable "how the day works" PNG, drawn in their own browser
 * the moment they ask for it (no server, no upload), a sister to the invitation keepsake.
 *
 * Where the keepsake is about *them* (their seats, their code), this card is about *the day*, and it
 * leads with the one thing guests keep getting wrong: nobody has to be there at 4:00 PM. In order:
 *   1. the headline — you don't need to be there at 4:00 — and the warm reason why;
 *   2. two notes side by side: the entourage & wedding team (3:30, reserved seats, wait for the cue)
 *      and every other guest (5:30 at the majlis, reception at 6:30);
 *   3. for guests, where to go by the hour they arrive — and a small plan of the venue so "the
 *      majlis" and "the hall" are places, not words;
 *   4. the order of the day, the dress code in one line, and the couple's sign-off.
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

const W = 1200;
const CX = W / 2;
/** Side margin inside the double border. */
const M = 92;
const INNER = W - 2 * M;
/** The card is cut to its content and never shorter than this. */
const MIN_HEIGHT = 1800;
/** Room under the last line, inside the border. */
const FOOT = 140;

/* the order of the day: times end at TIME_R, a dot on the axis, titles start at TITLE_L (as on the keepsake) */
const TIME_R = CX - 125;
const AXIS_X = CX - 95;
const TITLE_L = CX - 65;
const TITLE_W = W - 110 - TITLE_L;

/** A soft lace panel with a wine rule — the card's way of saying "this bit matters". */
function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = LACE) {
  roundRect(g, x, y, w, h, 6);
  g.fillStyle = fill; g.fill();
  g.strokeStyle = WINE; g.lineWidth = 1.8; g.stroke();
  roundRect(g, x + 8, y + 8, w - 16, h - 16, 3);
  g.strokeStyle = EDGE; g.lineWidth = 1; g.stroke();
}

/* ── 1. the headline: you don't need to be there at 4:00 PM ── */
function drawHeadline(g: CanvasRenderingContext2D, y: number) {
  const pad = 46;
  const textW = INNER - 2 * pad;
  const bodyFont = serif(29, "i400");
  const body = wrapLines(g, PROGRAM_HEADLINE_DETAIL, bodyFont, textW);
  const bodyLead = 40;
  // the two hours that matter, large, side by side
  const hours: [string, string, string][] = [
    [ALL_WELCOME_FROM, "we expect you by", "welcome toast, snacks & photos · the majlis"],
    [RECEPTION_AT, "then the reception", "dinner, our film, games & dancing · the hall"],
  ];
  // the layout, top to bottom: kicker · headline · body · rule · the two hours (two lines under each)
  const kickerY = pad + 22;
  const headY = kickerY + 72;
  const bodyY = headY + 60;
  const hoursY = bodyY + (body.length - 1) * bodyLead + 66;
  const h = hoursY + 112 + pad;
  panel(g, M, y, INNER, h);

  caps(g, "Please read this first", CX, y + kickerY, 23, WINE, 0.32);
  fit(g, PROGRAM_HEADLINE, CX, y + headY, 54, (s) => serif(s, "600"), WINE, textW);
  drawLines(g, body, CX, y + bodyY, bodyFont, MOCHA, bodyLead);

  // a hairline, then the hours
  const yy = y + hoursY;
  g.strokeStyle = EDGE; g.lineWidth = 1; g.beginPath(); g.moveTo(M + pad + 40, yy - 36); g.lineTo(W - M - pad - 40, yy - 36); g.stroke();
  const colW = (INNER - 2 * pad) / 2;
  hours.forEach(([hour, kicker, where], i) => {
    const cx = M + pad + colW * (i + 0.5);
    caps(g, kicker, cx, yy + 2, 20, TAUPE, 0.3);
    text(g, hour, cx, yy + 66, serif(64, "600"), WINE);
    wrap(g, where, cx, yy + 102, serif(23, "i400"), MOCHA, 30, colW - 40);
  });
  g.strokeStyle = EDGE; g.lineWidth = 1; g.beginPath(); g.moveTo(CX, yy - 10); g.lineTo(CX, yy + 110); g.stroke();
  return y + h;
}

/* ── 2. the two notes: who arrives when, and what to do ── */
function drawArrivalNotes(g: CanvasRenderingContext2D, y: number) {
  const gap = 28;
  const colW = (INNER - gap) / 2;
  const pad = 30;
  const bodyFont = serif(27, "i400");
  const bodyLead = 36;
  const notes = [ARRIVAL_NOTES.entourage, ARRIVAL_NOTES.guests].map((n) => ({ ...n, lines: wrapLines(g, n.detail, bodyFont, colW - 2 * pad) }));
  // the layout under the heading band: kicker · the hour, large · where to go · what to do
  const head = 62;
  const kickerY = head + 44;
  const hourY = kickerY + 68;
  const whereY = hourY + 46;
  const bodyY = whereY + 50;
  const h = bodyY + (Math.max(...notes.map((n) => n.lines.length)) - 1) * bodyLead + pad + 6;

  notes.forEach((n, i) => {
    const x = M + i * (colW + gap);
    const cx = x + colW / 2;
    roundRect(g, x, y, colW, h, 6);
    g.fillStyle = PAPER; g.fill();
    g.strokeStyle = WINE; g.lineWidth = 1.8; g.stroke();
    // the heading band
    g.save();
    roundRect(g, x, y, colW, h, 6); g.clip();
    g.fillStyle = WINE; g.fillRect(x, y, colW, head);
    g.restore();
    caps(g, n.who, cx, y + head / 2 + 8, 22, LACE, 0.26);
    caps(g, "please arrive by", cx, y + kickerY, 19, TAUPE, 0.3);
    text(g, n.time, cx, y + hourY, serif(66, "600"), WINE);
    caps(g, `head to ${n.where}`, cx, y + whereY, 22, MOCHA, 0.24);
    drawLines(g, n.lines, cx, y + bodyY, bodyFont, MOCHA, bodyLead);
  });
  return y + h;
}

/* ── 3a. for guests: where to go, by the hour they arrive ── */
function drawArrivalGuide(g: CanvasRenderingContext2D, y: number) {
  caps(g, "Arriving at another hour? Here's where to go", CX, y, 24, TAUPE, 0.3);
  y += 30;
  text(g, `for our guests — the entourage & wedding team keep their ${ENTOURAGE_CALL_TIME} call time`, CX, y, serif(23, "i400"), TAUPE);
  y += 58;
  const whenR = M + 236;
  const axis = whenR + 26;
  const left = axis + 30;
  const maxW = W - M - left;
  GUEST_ARRIVAL_GUIDE.forEach((row, i) => {
    text(g, row.when, whenR, y, serif(29, "600"), WINE, "right");
    g.fillStyle = EDGE; g.beginPath(); g.arc(axis, y - 10, 3.5, 0, Math.PI * 2); g.fill();
    text(g, row.where, left, y, serif(30, "600"), MOCHA, "left");
    y = wrap(g, row.detail, left, y + 36, serif(25, "i400"), TAUPE, 32, maxW, "left");
    if (i < GUEST_ARRIVAL_GUIDE.length - 1) {
      y += 26;
      g.strokeStyle = EDGE; g.lineWidth = 1; g.setLineDash([2, 6]);
      g.beginPath(); g.moveTo(M + 60, y); g.lineTo(W - M - 60, y); g.stroke();
      g.setLineDash([]);
      y += 40;
    }
  });
  return y;
}

/* ── 3b. the plan of the venue ── */
function drawMap(g: CanvasRenderingContext2D, y: number, venue: string) {
  caps(g, `Finding your way at ${venue}`, CX, y, 24, TAUPE, 0.3);
  y += 40;
  const mapW = 660;
  const mapH = Math.round((mapW * MAP_H) / MAP_W);
  const x = CX - mapW / 2;
  // a thin paper mount around the plan
  roundRect(g, x - 10, y - 10, mapW + 20, mapH + 20, 8);
  g.fillStyle = PAPER; g.fill();
  g.strokeStyle = EDGE; g.lineWidth = 1.2; g.stroke();
  drawVenueMap(g, x, y, mapW, mapH);
  y += mapH + 56;
  // the legend — the same numbers as the pins
  const legendL = M + 60;
  VENUE_MAP_LEGEND.forEach((item) => {
    pin(g, item.n, legendL + 14, y - 9, 14);
    text(g, item.place, legendL + 44, y, serif(28, "600"), MOCHA, "left");
    const placeW = g.measureText(item.place).width;
    y = wrap(g, `— ${item.detail}`, legendL + 44 + placeW + 10, y, serif(25, "i400"), TAUPE, 32, W - M - (legendL + 44 + placeW + 10), "left");
    y += 44;
  });
  return y - 44;
}

/* ── 4. the order of the day (as on the keepsake) ── */
function drawProgram(g: CanvasRenderingContext2D, y: number, program: ProgramStop[]) {
  caps(g, "The order of the day", CX, y, 25, TAUPE, 0.3);
  y += 64;
  program.forEach((p) => {
    text(g, p.time, TIME_R, y, serif(31, "600"), WINE, "right");
    g.fillStyle = EDGE; g.beginPath(); g.arc(AXIS_X, y - 10, 3.5, 0, Math.PI * 2); g.fill();
    text(g, p.title, TITLE_L, y, serif(31, "400"), MOCHA, "left");
    y += 50;
    if (p.note) {
      y = wrap(g, p.note, TITLE_L, y - 14, serif(24, "i400"), WINE, 31, TITLE_W, "left");
      y += 48;
    }
  });
  return y - 50;
}

function draw(g: CanvasRenderingContext2D, d: ProgramCardData, height: number) {
  paper(g, W, height);

  let y = 150;
  caps(g, "J & S · the programme", CX, y, 26, TAUPE, 0.34);
  y += 40;
  text(g, `${d.groom} & ${d.bride}`, CX, y + 70, script(96), WINE);
  y += 136;
  caps(g, "Our wedding day — how it unfolds", CX, y, 25, TAUPE, 0.3);
  y += 60;
  const when = new Date(d.dateISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });
  text(g, when, CX, y + 12, serif(44, "500"), MOCHA);
  y += 62;
  text(g, `${d.venue} · ${d.address}`, CX, y + 4, serif(30, "i400"), TAUPE);
  y += 84;
  diamondRule(g, CX, y);
  y += 60;

  y = drawHeadline(g, y) + 50;
  y = drawArrivalNotes(g, y) + 86;
  y = drawArrivalGuide(g, y) + 90;
  y = drawMap(g, y, d.venue) + 92;
  diamondRule(g, CX, y - 44);
  y = drawProgram(g, y + 12, d.program) + 64;

  y = wrap(g, `Dress code — ${d.dressNote}`, CX, y, serif(28, "i400"), TAUPE, 38, W - 300);
  y += 96;
  text(g, "See you there", CX, y, script(72), WINE);
  y += 56;
  caps(g, `with love, ${d.groom} & ${d.bride}`, CX, y, 22, TAUPE, 0.3);
  if (d.hashtags.length) {
    y += 56;
    caps(g, d.hashtags.join(" · "), CX, y, 22, TAUPE, 0.24);
  }
  return y;
}

/** Draw the card onto a fresh canvas, cut to its content. Exported for previews and tests; `downloadProgramCard` is the guest's door. */
export function renderProgramCard(d: ProgramCardData): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  if (!g) return null;
  // Two passes: measure on a generous canvas, then cut the card to that height so nothing meets the border.
  const PROBE = 6000;
  c.width = W; c.height = PROBE;
  const lastLine = draw(g, d, PROBE);
  const height = Math.max(MIN_HEIGHT, Math.ceil(lastLine + FOOT));
  c.height = height; // resizing clears the canvas — draw() sets every style it uses
  draw(g, d, height);
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
