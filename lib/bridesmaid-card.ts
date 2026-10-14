/**
 * The bridesmaid card — an A4 thank-you note, drawn in the browser in the keepsake's paper and
 * inks, with her jewel cut in her colour at the top.
 *
 * The page is laid out in a 1500-wide logical space and scaled to A4 at 300 dpi (2480 × 3508),
 * so a 28px line here prints at about 11pt. The card is measured once without drawing: if the
 * couple's words run long the type steps down a little (never below 78%), and any air left over
 * is shared between the sections so the page reads as a whole rather than bunching at the top.
 */
import { INK, MOCHA, TAUPE, WINE, caps, capsWidth, diamondRule, drawLines, loadCardFonts, paper, savePng, script, serif, text, wrapLines } from "./card-draw";
import { inkOf, parseHex, shade } from "./jewels";
import type { BridesmaidCard, GemCut } from "./types";

/** A4 portrait at 300 dpi. */
export const CARD_W = 2480;
export const CARD_H = 3508;
const W = 1500;
const S = CARD_W / W;
const H = CARD_H / S;
const CX = W / 2;
const LEFT = 250;              // the letter's left edge
const MEASURE = W - 2 * LEFT;  // 1000 — about 78 italic characters a line
const TOP = 132;               // first baseline
const BOTTOM = H - 118;        // the footer's baseline

type Ctx = CanvasRenderingContext2D;

export type CardRender = { canvas: HTMLCanvasElement; fits: boolean; scale: number };

/* ─────────────────────────── the stone ─────────────────────────── */

type Pt = { x: number; y: number };

/** The stone's outline as a closed polygon around (0, 0), `w` wide and `h` tall. */
function outline(cut: GemCut, w: number, h: number): Pt[] {
  const pts: Pt[] = [];
  const n = 96;
  if (cut === "pear") {
    // a circle at the foot, two tangents rising to the point
    const r = w / 2;
    const cy = h / 2 - r;                 // the circle's centre, below the middle
    const apex = -h / 2;
    const d = cy - apex;                  // apex to centre
    const t = Math.acos(r / d);           // tangent angle from the apex direction
    const start = -Math.PI / 2 + t;       // where the right tangent meets the circle
    const end = -Math.PI / 2 - t + Math.PI * 2;
    pts.push({ x: 0, y: apex });
    for (let i = 0; i <= n; i++) {
      const a = start + (end - start) * (i / n);
      pts.push({ x: r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return pts;
  }
  if (cut === "emerald") {
    const c = Math.min(w, h) * 0.22;      // the corner cut
    const x = w / 2, y = h / 2;
    return [
      { x: -x + c, y: -y }, { x: x - c, y: -y }, { x, y: -y + c }, { x, y: y - c },
      { x: x - c, y }, { x: -x + c, y }, { x: -x, y: y - c }, { x: -x, y: -y + c },
    ];
  }
  const e = cut === "cushion" ? 2 / 3.2 : 1; // superellipse exponent → rounded square
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    pts.push({ x: (w / 2) * Math.sign(c) * Math.abs(c) ** e, y: (h / 2) * Math.sign(s) * Math.abs(s) ** e });
  }
  return pts;
}

/** Where a ray from the centre at `angle` leaves the polygon. */
function rayHit(poly: Pt[], angle: number): Pt {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let best: Pt | null = null;
  let bestT = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (a.x * ey - a.y * ex) / den;            // distance along the ray
    const u = (a.x * dy - a.y * dx) / den;            // position along the edge
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6 && t > bestT) { bestT = t; best = { x: dx * t, y: dy * t }; }
  }
  return best ?? { x: 0, y: 0 };
}

const scalePt = (p: Pt, k: number): Pt => ({ x: p.x * k, y: p.y * k });

function poly(g: Ctx, pts: Pt[]) {
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
}

function facet(g: Ctx, pts: Pt[], fill: string, edge: string) {
  poly(g, pts);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 1;
  g.stroke();
}

/** A faceted stone seen from above, `w` × `h`, centred on (cx, cy), in the colour `hex`. */
export function drawGem(g: Ctx, cx: number, cy: number, w: number, h: number, hex: string, cut: GemCut) {
  const base = parseHex(hex) ? hex : "#6E1F2E";
  const edge = `${shade(base, 0.55)}B3`;
  const out = outline(cut, w, h);
  g.save();
  g.translate(cx, cy);

  // the shadow it throws on the paper, then a solid base so the facets never show the page through
  g.save();
  g.shadowColor = "rgba(51, 39, 31, 0.28)";
  g.shadowBlur = 22;
  g.shadowOffsetY = 10;
  poly(g, out);
  g.fillStyle = shade(base, -0.1);
  g.fill();
  g.restore();

  if (cut === "emerald") {
    // step cut: three concentric tiers of trapezoids, each tier a little lighter, the table on top
    const tiers = [1, 0.84, 0.68, 0.54];
    for (let t = 0; t < tiers.length - 1; t++) {
      const o = out.map((p) => scalePt(p, tiers[t]));
      const i = out.map((p) => scalePt(p, tiers[t + 1]));
      for (let k = 0; k < o.length; k++) {
        const k2 = (k + 1) % o.length;
        const long = k % 2 === 1;                           // the long sides vs. the cut corners
        const tone = long ? (k % 4 === 1 ? 0.02 : -0.16) : -0.3;
        facet(g, [o[k], o[k2], i[k2], i[k]], shade(base, tone + t * 0.08), edge);
      }
    }
    facet(g, out.map((p) => scalePt(p, tiers[tiers.length - 1])), shade(base, 0.22), edge);
  } else {
    // brilliant-style crown: an eight-sided table, eight kites to the girdle, stars between them
    const mains = Array.from({ length: 8 }, (_, k) => -Math.PI / 2 + (k * Math.PI) / 4);
    const halves = mains.map((a) => a + Math.PI / 8);
    const girdle = (a: number) => rayHit(out, a);
    const at = (a: number, k: number) => scalePt(girdle(a), k);
    const TABLE = 0.52, MID = 0.8;
    for (let k = 0; k < 8; k++) {
      const a = mains[k], aNext = mains[(k + 1) % 8];
      const aHalf = halves[k], aPrev = halves[(k + 7) % 8];
      // upper-girdle facets: the dark rim
      facet(g, [at(aHalf, MID), girdle(a), girdle(aHalf)], shade(base, -0.26), edge);
      facet(g, [at(aHalf, MID), girdle(aHalf), girdle(aNext)], shade(base, -0.12), edge);
      // the kite from the table's corner to the girdle
      facet(g, [at(a, TABLE), at(aHalf, MID), girdle(a), at(aPrev, MID)], shade(base, k % 2 ? 0.0 : -0.1), edge);
      // the star facet between two kites
      facet(g, [at(a, TABLE), at(aNext, TABLE), at(aHalf, MID)], shade(base, k % 2 ? 0.18 : 0.26), edge);
    }
    facet(g, mains.map((a) => at(a, TABLE)), shade(base, 0.3), edge);
  }

  // light falling from the top left
  poly(g, out);
  g.clip();
  const sheen = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  sheen.addColorStop(0, "rgba(255,255,255,0.42)");
  sheen.addColorStop(0.42, "rgba(255,255,255,0.05)");
  sheen.addColorStop(0.7, "rgba(0,0,0,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.18)");
  g.fillStyle = sheen;
  g.fillRect(-w, -h, 2 * w, 2 * h);
  g.restore();

  // a hairline round the girdle and one sparkle
  g.save();
  g.translate(cx, cy);
  poly(g, out);
  g.strokeStyle = shade(base, -0.35);
  g.lineWidth = 1.5;
  g.stroke();
  sparkle(g, -w * 0.2, -h * 0.22, Math.min(w, h) * 0.085);
  g.restore();
}

function sparkle(g: Ctx, x: number, y: number, r: number) {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.22 : r;
    const px = x + rr * Math.cos(a), py = y + rr * Math.sin(a);
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.closePath();
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fill();
}

/** The stone's footprint for each cut — pears and ovals stand taller than they are wide. */
function gemBox(cut: GemCut, size: number): [number, number] {
  switch (cut) {
    case "oval": return [size * 0.82, size];
    case "pear": return [size * 0.8, size];
    case "emerald": return [size * 0.76, size];
    case "cushion": return [size * 0.92, size * 0.92];
    default: return [size * 0.94, size * 0.94];
  }
}

/* ─────────────────────────── lettering ─────────────────────────── */

/**
 * Letter-spaced capitals, wrapped by hand — the role title can run to two lines. With `balance`,
 * a two-line title breaks nearest the middle rather than leaving one word stranded on the second.
 */
function capsLines(g: Ctx, s: string, size: number, maxW: number, track: number, balance = false): string[] {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const tryLine = cur ? `${cur} ${w}` : w;
    if (capsWidth(g, tryLine, size, track) <= maxW || !cur) cur = tryLine;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (!balance || lines.length !== 2) return lines;
  let best = lines;
  let bestW = Math.max(...lines.map((l) => capsWidth(g, l, size, track)));
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const w = Math.max(capsWidth(g, a, size, track), capsWidth(g, b, size, track));
    if (w <= maxW && w < bestW) { bestW = w; best = [a, b]; }
  }
  return best;
}

/** Wrap a short line; when it breaks in two, break it near the middle rather than strand a word. */
function balanced(g: Ctx, s: string, font: string, maxW: number): string[] {
  const lines = wrapLines(g, s, font, maxW);
  if (lines.length !== 2) return lines;
  g.font = font;
  const words = s.split(/\s+/).filter(Boolean);
  let best = lines;
  let bestW = Math.max(...lines.map((l) => g.measureText(l).width));
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const w = Math.max(g.measureText(a).width, g.measureText(b).width);
    if (w <= maxW && w < bestW) { bestW = w; best = [a, b]; }
  }
  return best;
}

/** The script headline with her stone's name picked out in its colour. */
function greeting(g: Ctx, s: string, jewel: string, y: number, size: number, color: string, dry: boolean) {
  const maxW = W - 2 * 150;
  let sz = size;
  g.font = script(sz);
  while (g.measureText(s).width > maxW && sz > 56) { sz -= 2; g.font = script(sz); }
  if (dry) return sz;
  const i = jewel.trim() ? s.toLowerCase().indexOf(jewel.trim().toLowerCase()) : -1;
  if (i < 0) { text(g, s, CX, y, script(sz), WINE); return sz; }
  const parts = [s.slice(0, i), s.slice(i, i + jewel.trim().length), s.slice(i + jewel.trim().length)];
  const widths = parts.map((p) => g.measureText(p).width);
  let x = CX - (widths[0] + widths[1] + widths[2]) / 2;
  g.textAlign = "left";
  parts.forEach((p, k) => {
    g.fillStyle = k === 1 ? color : WINE;
    g.fillText(p, x, y);
    x += widths[k];
  });
  return sz;
}

const paragraphs = (s: string) => s.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
const bulletLines = (s: string) => paragraphs(s).map((l) => l.replace(/^(?:[-•*·]|\d+[.)])\s*/, "")).filter(Boolean);

/* ─────────────────────────── the page ─────────────────────────── */

/**
 * One pass over the card. With `dry` nothing is drawn — the pass only reports how tall each section
 * is at type scale `f`. `air` is the extra space slipped in before the gem, the note, the role block
 * and the sign-off once the measuring pass knows what is left over.
 */
function pass(g: Ctx, c: BridesmaidCard, f: number, air: number[], dry: boolean): number[] {
  const tone = inkOf(c.color);
  const heights: number[] = [];
  const px = (n: number) => Math.round(n * f);
  let y = TOP;

  /* ── 1. kicker, gem, stone, headline ── */
  let start = y;
  if (c.kicker.trim()) { if (!dry) caps(g, c.kicker, CX, y, 22, TAUPE, 0.34); y += 20; }
  y += 36 + air[0];
  const gemSize = 220;
  const [gw, gh] = gemBox(c.cut, gemSize);
  if (!dry) drawGem(g, CX, y + gemSize / 2, gw, gh, c.color, c.cut);
  y += gemSize + 56;
  if (c.jewel.trim()) { if (!dry) caps(g, c.jewel, CX, y, 28, tone, 0.42); y += 30; }
  if (c.greeting.trim()) { y += px(84); greeting(g, c.greeting, c.jewel, y, px(96), tone, dry); y += 10; }
  if (c.subline.trim()) { y += 64; if (!dry) caps(g, c.subline, CX, y, 22, TAUPE, 0.3); }
  y += 46;
  if (!dry) diamondRule(g, CX, y, 220);
  if (c.embodies.trim()) {
    y += 48;
    const lines = balanced(g, c.embodies, serif(px(30), "i500"), MEASURE - 80);
    if (!dry) drawLines(g, lines, CX, y, serif(px(30), "i500"), tone, px(40));
    y += (lines.length - 1) * px(40);
  }
  // the verse: the quotation in italic with its reference in small capitals — on one line when it fits
  const verse = (c.verse ?? "").trim();
  if (verse) {
    const m = /^(.*?)\s+[—–-]\s+([^—–-]+)$/.exec(verse);
    const quote = m ? m[1].trim() : verse;
    const ref = m ? m[2].trim() : "";
    const font = serif(px(28), "i400");
    y += c.embodies.trim() ? 46 : 52;
    g.font = font;
    const quoteW = g.measureText(quote).width;
    const refW = ref ? capsWidth(g, ref, 17, 0.34) : 0;
    const gap = 26;
    if (ref && quoteW + gap + refW <= MEASURE - 60) {
      const x0 = CX - (quoteW + gap + refW) / 2;
      if (!dry) { text(g, quote, x0, y, font, MOCHA, "left"); caps(g, ref, x0 + quoteW + gap, y, 17, TAUPE, 0.34, "left"); }
    } else {
      const lines = balanced(g, quote, font, MEASURE - 120);
      if (!dry) drawLines(g, lines, CX, y, font, MOCHA, px(38));
      y += (lines.length - 1) * px(38);
      if (ref) { y += 34; if (!dry) caps(g, ref, CX, y, 17, TAUPE, 0.34); }
    }
  }
  heights.push(y - start);

  /* ── 2. her note ── */
  start = y;
  y += air[1];
  const note = paragraphs(c.note);
  if (note.length) {
    y += 44 + px(30);
    const font = serif(px(30), "i400");
    note.forEach((p, i) => {
      const lines = wrapLines(g, p, font, MEASURE);
      if (!dry) drawLines(g, lines, LEFT, y, font, INK, px(42), "left");
      y += (lines.length - 1) * px(42) + (i < note.length - 1 ? px(42) + 14 : 0);
    });
  }
  heights.push(y - start);

  /* ── 3. her role ── */
  start = y;
  y += air[2];
  const role = c.role_title.trim() || c.mission.trim() || c.duties.trim() || c.tagline.trim() || c.pro_tip.trim();
  if (role) {
    y += 56;
    if (!dry) diamondRule(g, CX, y, 220);
    if (c.role_kicker.trim()) { y += 52; if (!dry) caps(g, c.role_kicker, CX, y, 20, TAUPE, 0.34); }
    if (c.role_title.trim()) {
      // one line if it can be had by stepping down a little; otherwise two balanced lines
      let size = px(34);
      while (capsWidth(g, c.role_title, size, 0.22) > MEASURE && size > px(29)) size -= 1;
      const lines = capsWidth(g, c.role_title, size, 0.22) <= MEASURE ? [c.role_title] : capsLines(g, c.role_title, (size = px(34)), MEASURE, 0.22, true);
      y += 16 + size;
      if (!dry) lines.forEach((l, i) => caps(g, l, CX, y + i * (size + 14), size, WINE, 0.22));
      y += (lines.length - 1) * (size + 14);
    }
    if (c.tagline.trim()) {
      const font = serif(px(31), "i500");
      const lines = balanced(g, `“${c.tagline.trim().replace(/^["“]|["”]$/g, "")}”`, font, MEASURE - 60);
      y += 18 + px(31);
      if (!dry) drawLines(g, lines, CX, y, font, MOCHA, px(40));
      y += (lines.length - 1) * px(40);
    }
    const body = serif(px(28), "400");
    const lead = px(38);
    if (c.mission.trim()) {
      y += 50;
      if (!dry) caps(g, "Your mission", LEFT, y, 20, tone, 0.34, "left");
      const ps = paragraphs(c.mission);
      ps.forEach((p, i) => {
        const lines = wrapLines(g, p, body, MEASURE);
        y += (i ? 10 : 20) + px(28);
        if (!dry) drawLines(g, lines, LEFT, y, body, INK, lead, "left");
        y += (lines.length - 1) * lead;
      });
    }
    const duties = bulletLines(c.duties);
    if (duties.length) {
      y += 46;
      if (!dry) caps(g, "The duties", LEFT, y, 20, tone, 0.34, "left");
      y += 20 + px(28);
      duties.forEach((d, i) => {
        const lines = wrapLines(g, d, body, MEASURE - 44);
        if (!dry) {
          g.save();
          g.translate(LEFT + 9, y - px(9));
          g.rotate(Math.PI / 4);
          g.fillStyle = tone;
          g.fillRect(-5, -5, 10, 10);
          g.restore();
          drawLines(g, lines, LEFT + 44, y, body, INK, lead, "left");
        }
        y += (lines.length - 1) * lead + (i < duties.length - 1 ? lead + 4 : 0);
      });
    }
    if (c.pro_tip.trim()) {
      y += 46;
      const labelW = capsWidth(g, "Pro tip", 20, 0.34);
      const x = LEFT + labelW + 22;
      const font = serif(px(28), "i400");
      const lines = wrapLines(g, c.pro_tip, font, MEASURE - labelW - 22);
      y += px(28) - 6;
      if (!dry) { caps(g, "Pro tip", LEFT, y, 20, tone, 0.34, "left"); drawLines(g, lines, x, y, font, MOCHA, lead, "left"); }
      y += (lines.length - 1) * lead;
    }
  }
  heights.push(y - start);

  /* ── 4. the sign-off ── */
  start = y;
  y += air[3];
  if (c.closing.trim()) {
    y += 48 + px(60);
    let sz = px(60);
    g.font = script(sz);
    while (g.measureText(c.closing).width > MEASURE && sz > 40) { sz -= 2; g.font = script(sz); }
    if (!dry) text(g, c.closing, CX, y, script(sz), WINE);
  }
  if (c.footer.trim()) { y += 46; if (!dry) caps(g, c.footer, CX, y, 20, TAUPE, 0.34); }
  heights.push(y - start);
  return heights;
}

/**
 * Draw the card. Measures first; steps the type down if the words run long (to 78% at most),
 * then shares any room left over between the sections so the page sits evenly.
 */
export function renderBridesmaidCard(c: BridesmaidCard, canvas?: HTMLCanvasElement): CardRender {
  const el = canvas ?? document.createElement("canvas");
  el.width = CARD_W;
  el.height = CARD_H;
  const g = el.getContext("2d");
  if (!g) throw new Error("canvas unavailable");
  g.setTransform(S, 0, 0, S, 0, 0);

  const room = BOTTOM - TOP;
  let f = 1;
  let heights = pass(g, c, f, [0, 0, 0, 0], true);
  let total = heights.reduce((a, b) => a + b, 0);
  while (total > room && f > 0.78) {
    f = Math.round((f - 0.03) * 100) / 100;
    heights = pass(g, c, f, [0, 0, 0, 0], true);
    total = heights.reduce((a, b) => a + b, 0);
  }
  const spare = Math.max(0, room - total);
  // most of the air goes around the note; some before the sign-off; a little lifts the gem
  const air = [spare * 0.12, spare * 0.33, spare * 0.33, spare * 0.22];

  paper(g, W, H);
  pass(g, c, f, air, false);
  return { canvas: el, fits: total <= room, scale: f };
}

/** A small PNG of the card for the binder's preview — the same drawing, scaled down. */
export function previewDataUrl(c: BridesmaidCard, width = 620): { url: string; fits: boolean; scale: number } {
  const full = renderBridesmaidCard(c);
  const small = document.createElement("canvas");
  small.width = width;
  small.height = Math.round((width * CARD_H) / CARD_W);
  const g = small.getContext("2d");
  if (!g) return { url: "", fits: full.fits, scale: full.scale };
  g.imageSmoothingQuality = "high";
  g.drawImage(full.canvas, 0, 0, small.width, small.height);
  return { url: small.toDataURL("image/png"), fits: full.fits, scale: full.scale };
}

export function cardFilename(c: BridesmaidCard) {
  const slug = [c.name, c.jewel].map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).filter(Boolean).join("-");
  return `${slug || "bridesmaid"}-card-a4.png`;
}

/** Hand the finished A4 PNG to the couple. Resolves false if the browser refused the download. */
export async function downloadBridesmaidCard(c: BridesmaidCard): Promise<boolean> {
  await loadCardFonts([
    'italic 400 30px "Cormorant Garamond"',
    'italic 500 31px "Cormorant Garamond"',
    '600 34px "Cormorant Garamond"',
    '60px "Pinyon Script"',
  ]);
  const { canvas } = renderBridesmaidCard(c);
  return savePng(canvas, cardFilename(c));
}
