/**
 * The guest's downloadable invitation card — a personal keepsake PNG drawn on a canvas the moment
 * they ask for it (no server, no upload: everything happens in their own browser, addressed to
 * *them* by name — nobody confirmed "on their behalf").
 *
 * One picture carries the whole invitation in short: their seats, the date & time, the venue,
 * the programme, arrival guidance, the dress code in one line, the couple's verse —
 * and the couple's photo, oval-framed like the front of the real invitation.
 */
export type KeepsakeData = {
  groom: string;
  bride: string;
  guestName: string;   // the guest's own name — the card speaks to them, not about them
  plusOne?: string;
  dateISO: string;
  venue: string;
  address: string;
  program: { time: string; title: string }[];
  dressNote: string;   // one short line, e.g. "Black tie in glossy greens and warm shining browns"
  hashtags: string[];
  photo?: string;      // data URL / same-origin path (external links are skipped so the file stays downloadable)
};

const VERSE =
  "“In the Lord, neither is woman independent of man, nor man of woman — for as she came from him, so he is born of her. And everything comes from God.”";
const VERSE_REF = "1 CORINTHIANS 11:11–12";
const ARRIVAL_NOTE = "Entourage & family, kindly arrive by 3:30 PM · Guests from 5:00 PM";

const W = 1200;
const H = 2280;
const CX = W / 2;

const INK = "#33271F";
const MOCHA = "#46362C";
const TAUPE = "#6F5B4C";
const WINE = "#6E1F2E";
const PAPER = "#FCFAF5";
const EDGE = "#BCA994";

const serif = (size: number, style: "400" | "500" | "600" | "i400" | "i500" = "400") =>
  style.startsWith("i") ? `italic ${style.slice(1)} ${size}px "Cormorant Garamond", Georgia, serif` : `${style} ${size}px "Cormorant Garamond", Georgia, serif`;
const script = (size: number) => `${size}px "Pinyon Script", "Cormorant Garamond", cursive`;
const TEXT_W = W - 300; // comfortable measure for flowing lines

/** Uppercase, letter-spaced, centred — letterSpacing is done by hand so it looks the same everywhere. */
function caps(g: CanvasRenderingContext2D, text: string, y: number, size: number, color: string, track = 0.28) {
  g.fillStyle = color;
  g.font = serif(size, "600");
  const t = text.toUpperCase();
  const gap = size * track;
  const widths = [...t].map((ch) => g.measureText(ch).width);
  let x = CX - (widths.reduce((a, b) => a + b, 0) + gap * (t.length - 1)) / 2;
  g.textAlign = "left";
  [...t].forEach((ch, i) => {
    g.fillText(ch, x, y);
    x += widths[i] + gap;
  });
}

function line(g: CanvasRenderingContext2D, text: string, y: number, font: string, color: string) {
  g.font = font;
  g.fillStyle = color;
  g.textAlign = "center";
  g.fillText(text, CX, y);
}

/** Wrap centred text within TEXT_W; draws each line, returns the y of the LAST line drawn. */
function wrap(g: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, leading: number) {
  g.font = font;
  g.fillStyle = color;
  g.textAlign = "center";
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const tryLine = cur ? `${cur} ${w}` : w;
    if (g.measureText(tryLine).width <= TEXT_W || !cur) cur = tryLine;
    else { lines.push(cur); cur = w; }
  }
  lines.push(cur);
  lines.forEach((l, i) => g.fillText(l, CX, y + i * leading));
  return y + (lines.length - 1) * leading;
}

/** Fit `text` on one line within TEXT_W by stepping the font size down. */
function fit(g: CanvasRenderingContext2D, text: string, y: number, startSize: number, makeFont: (s: number) => string, color: string) {
  let s = startSize;
  g.font = makeFont(s);
  while (g.measureText(text).width > TEXT_W && s > 24) { s -= 2; g.font = makeFont(s); }
  g.fillStyle = color;
  g.textAlign = "center";
  g.fillText(text, CX, y);
}

function diamond(g: CanvasRenderingContext2D, y: number) {
  g.strokeStyle = EDGE;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(CX - 300, y); g.lineTo(CX - 24, y);
  g.moveTo(CX + 24, y); g.lineTo(CX + 300, y);
  g.stroke();
  g.save();
  g.translate(CX, y);
  g.rotate(Math.PI / 4);
  g.strokeRect(-8, -8, 16, 16);
  g.restore();
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((res) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });

function draw(g: CanvasRenderingContext2D, d: KeepsakeData, photo: HTMLImageElement | null) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, W, H);

  // double rule border, like the invitation's inner frame
  g.strokeStyle = WINE; g.lineWidth = 3; g.strokeRect(34, 34, W - 68, H - 68);
  g.strokeStyle = EDGE; g.lineWidth = 1.2; g.strokeRect(50, 50, W - 100, H - 100);

  let y = 150;
  caps(g, "J & S · the invitation", y, 26, TAUPE, 0.34);
  y += 40;

  // the couple's photo in the carved-oval style
  if (photo) {
    const rx = 216, ry = 264, py = y + ry + 22;
    g.save();
    g.beginPath();
    g.ellipse(CX, py, rx, ry, 0, 0, Math.PI * 2);
    g.clip();
    const s = Math.max((rx * 2) / photo.width, (ry * 2) / photo.height);
    const pw = photo.width * s, ph = photo.height * s;
    g.drawImage(photo, CX - pw / 2, py - ph / 2, pw, ph);
    g.restore();
    g.beginPath(); g.ellipse(CX, py, rx + 7, ry + 7, 0, 0, Math.PI * 2); g.strokeStyle = WINE; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.ellipse(CX, py, rx + 18, ry + 18, 0, 0, Math.PI * 2); g.strokeStyle = EDGE; g.lineWidth = 1; g.stroke();
    y = py + ry + 18 + 62;
    diamond(g, y - 22);
  } else {
    y += 70;
  }

  line(g, `${d.groom} & ${d.bride}`, y + 70, script(96), WINE);
  y += 136;
  caps(g, "A wish come true — we're getting married", y, 25, TAUPE, 0.3);
  y += 60;

  const when = new Date(d.dateISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });
  const at = new Date(d.dateISO).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bahrain" });
  line(g, `${when} · ${at}`, y + 12, serif(44, "500"), MOCHA);
  y += 62;
  line(g, `${d.venue} · ${d.address}`, y + 4, serif(30, "i400"), TAUPE);
  y += 84;

  diamond(g, y);
  y += 68;

  // personal: the card belongs to the guest holding it
  caps(g, "A seat at our table is saved for", y, 25, TAUPE, 0.3);
  y += 84;
  const bothNames = d.plusOne ? `${d.guestName.split(" ")[0]} & ${d.plusOne.split(" ")[0]}` : d.guestName;
  fit(g, bothNames, y, 84, script, WINE);
  y += 62;
  const seatsLine = d.plusOne
    ? `Two seats — for ${d.guestName} & ${d.plusOne} — we can't wait to celebrate with you.`
    : `We can't wait to celebrate with you, ${d.guestName.split(" ")[0]}.`;
  y = wrap(g, seatsLine, y, serif(30, "i400"), MOCHA, 40);
  y += 110;

  // the programme, in short
  caps(g, "The celebration", y, 25, TAUPE, 0.3);
  y += 58;
  d.program.slice(0, 4).forEach((p) => {
    line(g, `${p.time} — ${p.title}`, y, serif(31, "i400"), MOCHA);
    y += 52;
  });
  y += 30;

  y = wrap(g, ARRIVAL_NOTE, y, serif(28, "i400"), TAUPE, 38);
  y += 56;
  y = wrap(g, `Dress code — ${d.dressNote}`, y, serif(28, "i400"), TAUPE, 38);
  y += 78;

  // the couple's verse at the foot of the card
  y = wrap(g, VERSE, y, serif(30, "i500"), WINE, 42);
  y += 58;
  caps(g, VERSE_REF, y, 22, TAUPE, 0.3);
  y += 60;
  if (d.hashtags.length) caps(g, d.hashtags.join(" · "), y, 22, TAUPE, 0.24);
}

async function render(d: KeepsakeData, withPhoto: boolean): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  const photo = withPhoto && d.photo ? await loadImage(d.photo) : null;
  if (withPhoto && d.photo && !photo) return null; // photo wouldn't load — caller retries without it
  draw(g, d, photo);
  return await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
}

/** Draw the card and save it as a PNG named for the guest. Never throws — worst case, no photo on the card. */
export async function downloadKeepsake(d: KeepsakeData) {
  // ask for the exact faces the card uses — fonts.ready alone only waits for what the page already showed
  try {
    await Promise.all([
      document.fonts.load('96px "Pinyon Script"'),
      document.fonts.load('600 26px "Cormorant Garamond"'),
      document.fonts.load('500 44px "Cormorant Garamond"'),
      document.fonts.load('italic 500 30px "Cormorant Garamond"'),
    ]);
    await document.fonts.ready;
  } catch { /* older browsers: system serif still looks fine */ }
  let blob = d.photo ? await render(d, true).catch(() => null) : null;
  if (!blob) blob = await render(d, false).catch(() => null);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const first = d.guestName.split(" ")[0].replace(/[^\w-]+/g, "").toLowerCase() || "guest";
  a.href = url;
  a.download = `${first}-invitation-${d.groom.toLowerCase()}-${d.bride.toLowerCase()}-11.11.2026.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
