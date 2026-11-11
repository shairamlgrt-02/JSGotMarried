import type { WeddingInfo } from "./types";

const WINE = "#681a2c";
const WINE_DARK = "#3c101c";
const PAPER = "#f6f0e5";
const GOLD = "#b39a68";
const INK = "#302620";

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.5, h * 0.9);
  glow.addColorStop(0, "rgba(255,255,255,.7)");
  glow.addColorStop(1, "rgba(213,198,172,.17)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  // Delicate woven paper grain, intentionally subtle so the type remains crisp when printed.
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.strokeStyle = "#8c7559";
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 18) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

function frame(ctx: CanvasRenderingContext2D, w: number, h: number, inset: number, radius = 3) {
  ctx.save();
  ctx.strokeStyle = WINE;
  ctx.lineWidth = 7;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset + 13, inset + 13, w - (inset + 13) * 2, h - (inset + 13) * 2);
  ctx.strokeStyle = "rgba(104,26,44,.24)";
  ctx.lineWidth = 1;
  ctx.strokeRect(inset + 21, inset + 21, w - (inset + 21) * 2, h - (inset + 21) * 2);
  ctx.restore();
  void radius;
}

function flourish(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(30, -35, 64, -25, 49, -7);
  ctx.bezierCurveTo(40, 4, 22, -4, 30, -15);
  ctx.bezierCurveTo(37, -24, 52, -13, 43, -8);
  ctx.moveTo(1, 0);
  ctx.bezierCurveTo(-12, 20, 2, 32, 15, 21);
  ctx.bezierCurveTo(27, 11, 15, 4, 9, 11);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(1, 0, 3, 0, Math.PI * 2); ctx.fillStyle = WINE; ctx.fill();
  ctx.restore();
}

function ornamentLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.stroke();
  ctx.fillStyle = WINE;
  ctx.beginPath(); ctx.arc(x + width / 2, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + width / 2 - 19, y); ctx.lineTo(x + width / 2, y - 7); ctx.lineTo(x + width / 2 + 19, y); ctx.lineTo(x + width / 2, y + 7); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function centered(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, maxWidth?: number) {
  ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = color; ctx.font = font;
  ctx.fillText(text, ctx.canvas.width / 2, y, maxWidth); ctx.restore();
}

function fitName(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, family = '"Cormorant Garamond", Georgia, serif') {
  let size = start;
  do { ctx.font = `500 ${size}px ${family}`; size -= 2; } while (ctx.measureText(text).width > maxWidth && size > 28);
  return ctx.font;
}

export function drawInvitation(info: WeddingInfo) {
  const c = canvasOf(1500, 2100);
  const ctx = c.getContext("2d")!;
  paper(ctx, c.width, c.height);
  frame(ctx, c.width, c.height, 48);
  frame(ctx, c.width, c.height, 76);
  flourish(ctx, 124, 130, 1.25); flourish(ctx, 1378, 130, -1.25); flourish(ctx, 124, 1970, 1.25); flourish(ctx, 1378, 1970, -1.25);

  centered(ctx, "WITH JOY IN OUR HEARTS", 305, '500 32px "Cormorant Garamond", Georgia, serif', WINE);
  centered(ctx, "AND GRATITUDE TO GOD", 355, '500 25px "Jost", Arial, sans-serif', INK);
  ornamentLine(ctx, 370, 410, 760);

  const names = `${info.bride}  &  ${info.groom}`;
  ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = WINE; ctx.font = fitName(ctx, names, 1120, 116); ctx.fillText(names, 750, 640, 1120); ctx.restore();
  centered(ctx, "request the pleasure of your company", 733, 'italic 43px "Cormorant Garamond", Georgia, serif', INK);
  centered(ctx, "AS WE CELEBRATE OUR WEDDING", 810, '500 27px "Jost", Arial, sans-serif', WINE);
  ornamentLine(ctx, 500, 880, 500);

  const date = new Date(info.date);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Asia/Bahrain" }).format(date).toUpperCase();
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "Asia/Bahrain" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "Asia/Bahrain" }).format(date).toUpperCase();
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "Asia/Bahrain" }).format(date);
  centered(ctx, weekday, 1000, '500 32px "Jost", Arial, sans-serif', INK);
  centered(ctx, `${day}  ·  ${month}  ·  ${year}`, 1082, '500 47px "Cormorant Garamond", Georgia, serif', WINE);
  centered(ctx, "CEREMONY  ·  4:30 PM     |     RECEPTION  ·  7:00 PM", 1170, '500 25px "Jost", Arial, sans-serif', INK);

  // A fine vintage botanical divider rather than photo frames: this file is designed as a clean prop for portrait and flat-lay photographs.
  ctx.save(); ctx.strokeStyle = "rgba(104,26,44,.35)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(380, 1300); ctx.bezierCurveTo(550, 1260, 620, 1420, 750, 1350); ctx.bezierCurveTo(880, 1280, 970, 1260, 1120, 1300); ctx.stroke();
  for (const [x, y, r] of [[530, 1304, 12], [600, 1333, 8], [970, 1328, 10], [1048, 1301, 7]] as number[][]) {
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r, -0.6, 0, Math.PI * 2); ctx.fillStyle = "rgba(179,154,104,.35)"; ctx.fill();
  }
  ctx.restore();

  centered(ctx, info.venue_name.toUpperCase(), 1510, '500 48px "Cormorant Garamond", Georgia, serif', WINE);
  centered(ctx, info.venue_address, 1570, '400 28px "Jost", Arial, sans-serif', INK, 1080);
  centered(ctx, "CEREMONY  ·  FELLOWSHIP  ·  RECEPTION", 1740, '500 24px "Jost", Arial, sans-serif', WINE);
  centered(ctx, "A day of faith, family & the beginning of forever", 1810, 'italic 34px "Cormorant Garamond", Georgia, serif', INK);
  centered(ctx, "11 · 11 · 2026", 1900, '500 28px "Jost", Arial, sans-serif', GOLD);
  return c;
}

export function drawPhotobooth(info: WeddingInfo) {
  const c = canvasOf(1800, 1200);
  const ctx = c.getContext("2d")!;
  paper(ctx, c.width, c.height);
  // Deep burgundy mat and a double gilt hairline make the strip look intentional in guests' hands.
  ctx.fillStyle = WINE_DARK; ctx.fillRect(0, 0, 1800, 1200);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(26, 26, 1748, 1148);
  ctx.strokeStyle = "rgba(255,244,225,.35)"; ctx.lineWidth = 1; ctx.strokeRect(38, 38, 1724, 1124);
  flourish(ctx, 60, 58, 0.75); flourish(ctx, 1740, 58, -0.75); flourish(ctx, 60, 1142, 0.75); flourish(ctx, 1740, 1142, -0.75);
  centered(ctx, `${info.bride.toUpperCase()}  &  ${info.groom.toUpperCase()}`, 101, '500 43px "Cormorant Garamond", Georgia, serif', PAPER, 1400);
  centered(ctx, "A LITTLE LOVE, A LITTLE LAUGHTER, A LIFETIME TOGETHER", 143, '500 17px "Jost", Arial, sans-serif', "#d5c49a");
  const left = 118, gap = 36, frameW = 484, top = 190, frameH = 740;
  const captions = ["A LITTLE ROMANCE", "A BIG LAUGH", "ONE FOR THE BOOKS"];
  for (let i = 0; i < 3; i++) {
    const x = left + i * (frameW + gap);
    ctx.fillStyle = PAPER; ctx.fillRect(x - 12, top - 12, frameW + 24, frameH + 24);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(x - 12, top - 12, frameW + 24, frameH + 24);
    // Clear the windows so photos from a booth camera show through when this PNG is layered over them.
    ctx.clearRect(x, top, frameW, frameH);
    // Fine gilt and wine lines frame each opening without covering faces.
    ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(x + 7, top + 7, frameW - 14, frameH - 14); ctx.restore();
    ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = "#e9ddc4"; ctx.font = '500 17px "Jost", Arial, sans-serif';
    ctx.fillText(captions[i], x + frameW / 2, top + frameH + 43); ctx.restore();
  }
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" }).format(new Date(info.date));
  centered(ctx, `${date.toUpperCase()}  ·  ${info.venue_name.toUpperCase()}  ·  #JSGOTMARRIED`, 1010, '500 19px "Jost", Arial, sans-serif', PAPER, 1550);
  ornamentLine(ctx, 690, 1068, 420);
  centered(ctx, "KEEP THIS LITTLE PIECE OF OUR DAY", 1125, 'italic 27px "Cormorant Garamond", Georgia, serif', "#e9ddc4");
  return c;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
