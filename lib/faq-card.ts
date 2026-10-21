import { EDGE, LACE, MOCHA, PAPER, TAUPE, WINE, caps, diamondRule, drawLines, loadCardFonts, paper, roundRect, savePng, script, serif, text, wrap, wrapLines } from "./card-draw";

/**
 * The FAQ card — the guest's downloadable "good to know" PNG, drawn in their own browser the
 * moment they ask for it, a sister to the invitation keepsake and the programme card. It carries
 * the very questions and answers the Questions section shows (binder → Content → FAQ is the one
 * source), so a guest can keep the whole little rulebook on their phone — in the group chat, on
 * the fridge, wherever — without scrolling the site.
 *
 * Same paper, same inks, same 9:16 portrait frame as the programme card: one panel to read whole,
 * never scrolled — and, should the answers ever outgrow the frame, a taller card rather than a
 * cut line. The layout is deliberately plain: one question at a time, the answer under it, a
 * dotted hairline between pairs, and the couple's sign-off at the foot.
 */
export type FaqCardData = {
  groom: string;
  bride: string;
  dateISO: string;
  venue?: string;
  faqs: { question: string; answer: string }[];
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

function dotted(g: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  g.strokeStyle = EDGE; g.lineWidth = 1; g.setLineDash([2, 6]);
  g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
  g.setLineDash([]);
}

/** A soft lace panel with a wine rule — the card's way of saying "this bit matters". */
function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  roundRect(g, x, y, w, h, 6);
  g.fillStyle = LACE; g.fill();
  g.strokeStyle = WINE; g.lineWidth = 1.8; g.stroke();
  roundRect(g, x + 8, y + 8, w - 16, h - 16, 3);
  g.strokeStyle = EDGE; g.lineWidth = 1; g.stroke();
}

/** The whole card, top to bottom. Returns the baseline of the last line drawn. */
function draw(g: CanvasRenderingContext2D, d: FaqCardData, height: number, air = 0) {
  paper(g, W, height);
  const breath = air / 6; // the slack inside the frame, shared out between the sections

  /* ── the header ── */
  let y = HEAD + breath;
  caps(g, "J & S · good to know", CX, y, 26, TAUPE, 0.34);
  y += 40;
  text(g, `${d.groom} & ${d.bride}`, CX, y + 64, script(92), WINE);
  y += 118;
  caps(g, "Questions — everything guests ask", CX, y, 25, TAUPE, 0.3);
  y += 50;
  const when = new Date(d.dateISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });
  text(g, when, CX, y + 8, serif(34, "500"), MOCHA);
  if (d.venue) { y += 44; text(g, d.venue, CX, y + 4, serif(28, "i400"), TAUPE); }
  y += 54;
  diamondRule(g, CX, y);
  y += 60 + breath;

  /* ── the one panel a guest should read first: where to go when they arrive ── */
  const arrival = d.faqs.find((f) => /where do i go|arriv/i.test(f.question));
  if (arrival) {
    const pad = 44;
    const qFont = serif(31, "600");
    const aFont = serif(26, "i400");
    const qLines = wrapLines(g, arrival.question, qFont, INNER - 2 * pad);
    const aLines = wrapLines(g, arrival.answer, aFont, INNER - 2 * pad);
    const h = pad + qLines.length * 40 + 22 + aLines.length * 37 + pad;
    panel(g, M, y, INNER, h);
    drawLines(g, qLines, CX, y + pad + 26, qFont, WINE, 40);
    drawLines(g, aLines, CX, y + pad + qLines.length * 40 + 40, aFont, MOCHA, 37);
    y += h + 52 + breath;
  }

  /* ── the rest of the questions, one at a time ── */
  const qFont = serif(31, "600");
  const aFont = serif(26, "i400");
  const rest = arrival ? d.faqs.filter((f) => f !== arrival) : d.faqs;
  rest.forEach((f, i) => {
    const qLines = wrapLines(g, f.question, qFont, INNER - 40);
    drawLines(g, qLines, CX, y + 26, qFont, WINE, 40);
    y += qLines.length * 40 + 20;
    y = wrap(g, f.answer, CX, y + 26, aFont, MOCHA, 37, INNER);
    y += 46;
    if (i < rest.length - 1) {
      dotted(g, M + 120, W - M - 120, y);
      y += 52;
    }
  });

  /* ── the sign-off ── */
  y += 40 + breath;
  text(g, "See you there", CX, y, script(66), WINE);
  y += 46;
  caps(g, `with love, ${d.groom} & ${d.bride}`, CX, y, 22, TAUPE, 0.3);
  if (d.hashtags.length) {
    y += 48;
    caps(g, d.hashtags.join(" · "), CX, y, 22, TAUPE, 0.24);
  }
  return y;
}

/**
 * Draw the card onto a fresh canvas: a 9:16 frame, with the room left over shared out as air — or,
 * should the answers ever outgrow the frame, a taller card rather than a cut line. Exported for
 * previews and tests; `downloadFaqCard` is the guest's door.
 */
export function renderFaqCard(d: FaqCardData): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  if (!g) return null;
  // Two passes: measure on a generous canvas, then draw into the frame with the slack shared out.
  const PROBE = 8000;
  c.width = W; c.height = PROBE;
  const need = Math.ceil(draw(g, d, PROBE) + FOOT);
  const height = Math.max(FRAME_H, need);
  c.height = height; // resizing clears the canvas — draw() sets every style it uses
  draw(g, d, height, height - need);
  return c;
}

/** Draw the FAQ card and save it as a PNG. Never throws — resolves false if the browser refused. */
export async function downloadFaqCard(d: FaqCardData) {
  await loadCardFonts(['600 64px "Cormorant Garamond"', '72px "Pinyon Script"']);
  try {
    const c = renderFaqCard(d);
    if (!c) return false;
    return await savePng(c, `good-to-know-${d.groom.toLowerCase()}-${d.bride.toLowerCase()}-11.11.2026.png`);
  } catch {
    return false;
  }
}
