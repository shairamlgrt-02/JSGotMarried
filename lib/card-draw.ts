/**
 * Canvas lettering for the guest's downloadable cards — the same paper, inks and typefaces as the
 * invitation site, so a saved PNG looks like a page torn from it.
 *
 * Everything here takes an explicit x / width, so a card can set a line in a column, a box or a
 * two-up grid; the keepsake (lib/keepsake.ts) predates this file and keeps its own centred helpers.
 */

export const INK = "#33271F";
export const MOCHA = "#46362C";
export const TAUPE = "#6F5B4C";
export const WINE = "#6E1F2E";
export const PAPER = "#FCFAF5";
export const LACE = "#F3E8D6";
export const EDGE = "#BCA994";

export type SerifStyle = "300" | "400" | "500" | "600" | "i300" | "i400" | "i500" | "i600";

export const serif = (size: number, style: SerifStyle = "400") =>
  style.startsWith("i")
    ? `italic ${style.slice(1)} ${size}px "Cormorant Garamond", Georgia, serif`
    : `${style} ${size}px "Cormorant Garamond", Georgia, serif`;
export const script = (size: number) => `${size}px "Pinyon Script", "Cormorant Garamond", cursive`;

type Ctx = CanvasRenderingContext2D;
type Align = "left" | "center" | "right";

/** Width of letter-spaced uppercase text (so it can be centred or right-aligned by hand). */
export function capsWidth(g: Ctx, text: string, size: number, track = 0.28, weight: SerifStyle = "600") {
  g.font = serif(size, weight);
  const t = [...text.toUpperCase()];
  return t.reduce((sum, ch) => sum + g.measureText(ch).width, 0) + size * track * (t.length - 1);
}

/** Uppercase, letter-spaced — tracking done by hand so it looks the same in every browser. */
export function caps(g: Ctx, text: string, x: number, y: number, size: number, color: string, track = 0.28, align: Align = "center", weight: SerifStyle = "600") {
  const width = capsWidth(g, text, size, track, weight);
  g.font = serif(size, weight);
  g.fillStyle = color;
  g.textAlign = "left";
  let cx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  const gap = size * track;
  for (const ch of [...text.toUpperCase()]) {
    g.fillText(ch, cx, y);
    cx += g.measureText(ch).width + gap;
  }
  return width;
}

export function text(g: Ctx, s: string, x: number, y: number, font: string, color: string, align: Align = "center") {
  g.font = font;
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(s, x, y);
}

/** Break `s` into lines no wider than `maxW` in `font` (a single over-long word stands alone). */
export function wrapLines(g: Ctx, s: string, font: string, maxW: number): string[] {
  g.font = font;
  const lines: string[] = [];
  let cur = "";
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const tryLine = cur ? `${cur} ${w}` : w;
    if (g.measureText(tryLine).width <= maxW || !cur) cur = tryLine;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Draw pre-wrapped lines from baseline `y`; returns the baseline of the LAST line drawn. */
export function drawLines(g: Ctx, lines: string[], x: number, y: number, font: string, color: string, leading: number, align: Align = "center") {
  g.font = font;
  g.fillStyle = color;
  g.textAlign = align;
  lines.forEach((l, i) => g.fillText(l, x, y + i * leading));
  return y + Math.max(0, lines.length - 1) * leading;
}

/** Wrap and draw in one go; returns the baseline of the LAST line drawn. */
export function wrap(g: Ctx, s: string, x: number, y: number, font: string, color: string, leading: number, maxW: number, align: Align = "center") {
  return drawLines(g, wrapLines(g, s, font, maxW), x, y, font, color, leading, align);
}

/** Fit `s` on one line within `maxW` by stepping the size down (never below `minSize`). */
export function fit(g: Ctx, s: string, x: number, y: number, startSize: number, makeFont: (size: number) => string, color: string, maxW: number, align: Align = "center", minSize = 24) {
  let size = startSize;
  g.font = makeFont(size);
  while (g.measureText(s).width > maxW && size > minSize) { size -= 2; g.font = makeFont(size); }
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(s, x, y);
  return size;
}

/** The invitation's rule: a hairline either side of a small tilted square. */
export function diamondRule(g: Ctx, cx: number, y: number, half = 300, color = EDGE) {
  g.strokeStyle = color;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(cx - half, y); g.lineTo(cx - 24, y);
  g.moveTo(cx + 24, y); g.lineTo(cx + half, y);
  g.stroke();
  g.save();
  g.translate(cx, y);
  g.rotate(Math.PI / 4);
  g.strokeRect(-8, -8, 16, 16);
  g.restore();
}

export function roundRect(g: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + w - rr, y);
  g.quadraticCurveTo(x + w, y, x + w, y + rr);
  g.lineTo(x + w, y + h - rr);
  g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  g.lineTo(x + rr, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - rr);
  g.lineTo(x, y + rr);
  g.quadraticCurveTo(x, y, x + rr, y);
  g.closePath();
}

/** A numbered wine disc — the map's pins and the legend's bullets share it. */
export function pin(g: Ctx, n: number | string, cx: number, cy: number, r = 15) {
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = WINE;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = PAPER;
  g.stroke();
  g.font = serif(Math.round(r * 1.35), "600");
  g.fillStyle = PAPER;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(n), cx, cy + 1);
  g.textBaseline = "alphabetic";
}

/** Paper, then the invitation's double rule — the frame every card sits in. */
export function paper(g: Ctx, w: number, h: number) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = WINE; g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68);
  g.strokeStyle = EDGE; g.lineWidth = 1.2; g.strokeRect(50, 50, w - 100, h - 100);
}

/** Wait for the exact faces a card uses — `fonts.ready` alone only covers what the page has shown. */
export async function loadCardFonts(extra: string[] = []) {
  try {
    await Promise.all([
      document.fonts.load('96px "Pinyon Script"'),
      document.fonts.load('600 26px "Cormorant Garamond"'),
      document.fonts.load('500 44px "Cormorant Garamond"'),
      document.fonts.load('400 30px "Cormorant Garamond"'),
      document.fonts.load('italic 400 30px "Cormorant Garamond"'),
      document.fonts.load('italic 500 30px "Cormorant Garamond"'),
      ...extra.map((f) => document.fonts.load(f)),
    ]);
    await document.fonts.ready;
  } catch { /* older browsers: the system serif still reads fine */ }
}

/** Hand a finished canvas to the guest as a PNG download. Resolves false if the browser refused. */
export async function savePng(c: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
