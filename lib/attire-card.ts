import { ATTIRE_STYLES, type FigureStyle } from "./attire-art";

type Swatch = { name: string; hex: string; fabric?: string };
type ReservedGroup = { label: string; colors: Pick<Swatch, "name" | "hex">[] };

export type AttireCardData = {
  couple: string;
  date: string;
  colors: Swatch[];
  selectedColor: Swatch;
  reserved: ReservedGroup[];
};

const WIDTH = 1200;
const HEIGHT = 1500;
const INK = "#3B2A24";
const TAUPE = "#89796D";
const WINE = "#762B35";
const PAPER = "#FBF8F2";
const IMAGE_CACHE = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = IMAGE_CACHE.get(src);
  if (cached) return cached;

  const image = new Image();
  image.decoding = "async";
  image.crossOrigin = "anonymous";
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load attire illustration: ${src}`));
  });
  IMAGE_CACHE.set(src, loaded);
  loaded.catch(() => IMAGE_CACHE.delete(src));
  image.src = src;
  return loaded;
}

function setFont(ctx: CanvasRenderingContext2D, font: string, color = INK, align: CanvasTextAlign = "center") {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color = INK, align: CanvasTextAlign = "center") {
  setFont(ctx, font, color, align);
  ctx.fillText(text, x, y);
}

function drawTextFit(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, maxWidth: number) {
  setFont(ctx, font, color, "left");
  const size = Number(font.match(/(\d+(?:\.\d+)?)px/)?.[1] || 16);
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = font.replace(/\d+(?:\.\d+)?px/, `${Math.max(10, size * maxWidth / width)}px`);
  ctx.fillText(text, x, y);
}

function drawTracked(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, font: string, color = INK, spacing = 2) {
  setFont(ctx, font, color, "left");
  const chars = Array.from(text);
  const width = chars.reduce((total, char) => total + ctx.measureText(char).width, 0) + spacing * Math.max(0, chars.length - 1);
  let x = centerX - width / 2;
  for (const char of chars) {
    ctx.fillText(char, x, y);
    x += ctx.measureText(char).width + spacing;
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function tintFromMask(mask: HTMLImageElement, hex: string): HTMLCanvasElement {
  const layer = document.createElement("canvas");
  layer.width = mask.naturalWidth;
  layer.height = mask.naturalHeight;
  const ctx = layer.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the attire illustration.");
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, layer.width, layer.height);
  ctx.globalCompositeOperation = "source-over";
  return layer;
}

function drawFigure(
  ctx: CanvasRenderingContext2D,
  style: FigureStyle,
  assets: { base: HTMLImageElement; mask: HTMLImageElement; highlights?: HTMLImageElement },
  centerX: number,
  top: number,
  maxHeight: number,
  maxWidth: number,
  color: string,
) {
  const scale = Math.min(maxHeight / assets.base.naturalHeight, maxWidth / assets.base.naturalWidth);
  const width = assets.base.naturalWidth * scale;
  const height = assets.base.naturalHeight * scale;
  const x = centerX - width / 2;
  const y = top + (maxHeight - height) / 2;

  ctx.drawImage(assets.base, x, y, width, height);
  const tint = tintFromMask(assets.mask, color);
  ctx.save();
  ctx.globalCompositeOperation = style.blendMode ?? "multiply";
  ctx.drawImage(tint, x, y, width, height);
  ctx.restore();
  if (assets.highlights) ctx.drawImage(assets.highlights, x, y, width, height);
}

function drawSwatch(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, size: number) {
  roundedRect(ctx, x, y, size, size, 8);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  roundedRect(ctx, x, y, size, size, 8);
  ctx.clip();
  const sheen = ctx.createLinearGradient(x, y, x + size, y + size);
  sheen.addColorStop(0, "rgba(255,255,255,.34)");
  sheen.addColorStop(0.42, "rgba(255,255,255,.03)");
  sheen.addColorStop(1, "rgba(0,0,0,.16)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, size, size);
  ctx.restore();
  roundedRect(ctx, x, y, size, size, 8);
  ctx.strokeStyle = "rgba(59,42,36,.22)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function uniqueReservedColors(groups: ReservedGroup[]) {
  const seen = new Set<string>();
  return groups.flatMap((group) => group.colors).filter((color) => {
    const key = color.name.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paintCard(ctx: CanvasRenderingContext2D, data: AttireCardData, figures: (Awaited<ReturnType<typeof loadFigure>> | null)[]) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(137,121,109,.52)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);
  ctx.strokeStyle = "rgba(137,121,109,.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(39, 39, WIDTH - 78, HEIGHT - 78);

  drawTracked(ctx, "WEDDING ATTIRE", WIDTH / 2, 98, '600 20px "Cormorant Garamond", Georgia, serif', WINE, 4);
  drawText(ctx, `${data.couple} · ${data.date}`, WIDTH / 2, 137, '500 21px "Cormorant Garamond", Georgia, serif', TAUPE);
  drawText(ctx, "What to wear", WIDTH / 2, 232, '82px "Pinyon Script", "Brush Script MT", cursive', WINE);
  drawTracked(ctx, "BLACK TIE · GLOSSY GREENS & SHINING BROWNS", WIDTH / 2, 275, '600 20px "Cormorant Garamond", Georgia, serif', INK, 1.6);
  drawText(ctx, "Men: tuxedo, formal vest or suit & tie.", WIDTH / 2, 315, '500 22px "Cormorant Garamond", Georgia, serif', INK);
  drawText(ctx, "Women: floor-length column, sheath or slim A-line.", WIDTH / 2, 340, '500 22px "Cormorant Garamond", Georgia, serif', INK);
  drawText(ctx, `Figures shown in ${data.selectedColor.name} · all guest-palette shades are welcome`, WIDTH / 2, 366, 'italic 18px "Cormorant Garamond", Georgia, serif', TAUPE);
  ctx.strokeStyle = "rgba(137,121,109,.38)";
  ctx.beginPath(); ctx.moveTo(82, 389); ctx.lineTo(WIDTH - 82, 389); ctx.stroke();

  const columnWidth = (WIDTH - 160) / 6;
  const centers = Array.from({ length: 6 }, (_, column) => 80 + columnWidth * (column + 0.5));
  drawTracked(ctx, "MEN", (centers[0] + centers[2]) / 2, 421, '600 17px "Cormorant Garamond", Georgia, serif', WINE, 3.2);
  drawTracked(ctx, "WOMEN", (centers[3] + centers[5]) / 2, 421, '600 17px "Cormorant Garamond", Georgia, serif', WINE, 3.2);
  ctx.strokeStyle = "rgba(137,121,109,.38)";
  ctx.beginPath(); ctx.moveTo(WIDTH / 2, 402); ctx.lineTo(WIDTH / 2, 720); ctx.stroke();

  ATTIRE_STYLES.forEach((style, index) => {
    const figure = figures[index];
    if (figure) drawFigure(ctx, style, figure, centers[index], 432, 260, columnWidth * 0.78, data.selectedColor.hex);
  });

  ctx.strokeStyle = "rgba(137,121,109,.38)";
  ctx.beginPath(); ctx.moveTo(82, 738); ctx.lineTo(WIDTH - 82, 738); ctx.stroke();
  drawTracked(ctx, "OUR GUEST PALETTE", WIDTH / 2, 777, '600 18px "Cormorant Garamond", Georgia, serif', WINE, 3.2);

  const palette = data.colors.length ? data.colors : [data.selectedColor];
  const columns = 6;
  const paletteWidth = WIDTH - 160;
  const cellWidth = paletteWidth / columns;
  palette.forEach((swatch, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = 80 + column * cellWidth;
    const y = 805 + row * 78;
    drawSwatch(ctx, swatch.hex, x, y, 44);
    drawTextFit(ctx, swatch.name, x + 53, y + 19, '600 20px "Cormorant Garamond", Georgia, serif', INK, cellWidth - 60);
    if (swatch.fabric) drawTextFit(ctx, swatch.fabric, x + 53, y + 39, 'italic 15px "Cormorant Garamond", Georgia, serif', TAUPE, cellWidth - 60);
  });

  const paletteRows = Math.max(1, Math.ceil(palette.length / columns));
  const reservedTitleY = 805 + paletteRows * 78 + 10;
  ctx.strokeStyle = "rgba(137,121,109,.38)";
  ctx.beginPath(); ctx.moveTo(82, reservedTitleY - 18); ctx.lineTo(WIDTH - 82, reservedTitleY - 18); ctx.stroke();
  drawTracked(ctx, "RESERVED SHADES", WIDTH / 2, reservedTitleY, '600 17px "Cormorant Garamond", Georgia, serif', WINE, 3);

  const reserved = uniqueReservedColors(data.reserved);
  const reservedNames = reserved.length ? reserved.map((color) => color.name).join(" · ") : "Black · white & ivory · burgundy · copper";
  setFont(ctx, '500 20px "Cormorant Garamond", Georgia, serif', INK);
  const reservedLines = wrapLines(ctx, reservedNames, WIDTH - 190);
  reservedLines.slice(0, 2).forEach((line, index) => drawText(ctx, line, WIDTH / 2, reservedTitleY + 31 + index * 26, '500 20px "Cormorant Garamond", Georgia, serif', INK));

  const avoidY = reservedTitleY + 105;
  ctx.strokeStyle = "rgba(137,121,109,.38)";
  ctx.beginPath(); ctx.moveTo(82, avoidY - 20); ctx.lineTo(WIDTH - 82, avoidY - 20); ctx.stroke();
  drawTracked(ctx, "KINDLY AVOID", WIDTH / 2, avoidY, '600 17px "Cormorant Garamond", Georgia, serif', WINE, 3);
  const avoid = [
    ["Black", "reserved for the groom"],
    ["White & ivory", "reserved for the bride"],
    ["Burgundy & copper", "reserved for the families"],
    ["Pastels", "save these for brunch"],
    ["T-shirts & jeans", "too casual for black tie"],
    ["Mini skirts", "floor-length looks, please"],
    ["Ball gowns & trains", "choose slim silhouettes"],
    ["Sneakers & sandals", "formal shoes, please"],
  ];
  const avoidColumnWidth = (WIDTH - 180) / 2;
  avoid.forEach(([what, why], index) => {
    const column = index < 4 ? 0 : 1;
    const row = index % 4;
    const x = 94 + column * avoidColumnWidth;
    const y = avoidY + 42 + row * 41;
    drawText(ctx, "×", x, y, '600 24px "Cormorant Garamond", Georgia, serif', WINE, "left");
    drawText(ctx, `${what} — ${why}`, x + 24, y, '500 20px "Cormorant Garamond", Georgia, serif', INK, "left");
  });

  const footerY = avoidY + 224;
  ctx.strokeStyle = "rgba(137,121,109,.38)";
  ctx.beginPath(); ctx.moveTo(82, footerY - 24); ctx.lineTo(WIDTH - 82, footerY - 24); ctx.stroke();
  drawTracked(ctx, "SHINE WELCOME · SATIN · VELVET · SILK · FINE SUIT WOOL · LIQUID POLY", WIDTH / 2, footerY + 2, '600 15px "Cormorant Garamond", Georgia, serif', WINE, 1.6);
  drawText(ctx, "Please skip tulle, chiffon, crepe, mesh & matte cotton.", WIDTH / 2, footerY + 35, 'italic 19px "Cormorant Garamond", Georgia, serif', TAUPE);
  drawText(ctx, "Your presence is the gift.", WIDTH / 2, footerY + 77, '38px "Pinyon Script", "Brush Script MT", cursive', WINE);
}

async function loadFigure(style: FigureStyle) {
  const [base, mask, highlights] = await Promise.all([
    loadImage(style.src),
    loadImage(style.mask),
    style.highlights ? loadImage(style.highlights) : Promise.resolve(undefined),
  ]);
  return { base, mask, highlights };
}

function safeFilename(couple: string) {
  const slug = couple.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "wedding"}-attire-card.png`;
}

/** Render and download a high-resolution, self-contained PNG of the public attire guide. */
export async function downloadAttireCard(data: AttireCardData): Promise<boolean> {
  try {
    await Promise.all([
      document.fonts.load('82px "Pinyon Script"'),
      document.fonts.load('600 23px "Cormorant Garamond"'),
      document.fonts.ready,
    ]);

    const figures = await Promise.all(ATTIRE_STYLES.map(async (style) => {
      try { return await loadFigure(style); }
      catch (error) { console.warn(error); return null; }
    }));

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return false;
    paintCard(context, data, figures);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFilename(data.couple);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error("Could not create the attire card image.", error);
    return false;
  }
}
