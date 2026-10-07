export type FigureStyle = {
  label: string;
  src: string;
  mask: string;
  highlights?: string;
  blendMode?: "multiply" | "color";
};

/** A guest-palette shade, exactly as the admin binder stores it. */
export type AttireSwatch = { name: string; hex: string; fabric?: string };

/** Shared illustration assets for the live guide and its downloadable PNG. */
export const MEN_STYLES: FigureStyle[] = [
  { label: "Tuxedo", src: "/img/attire-man.webp", mask: "/img/attire-man-mask.png", highlights: "/img/attire-man-hl.webp" },
  { label: "Velvet suit · no tie", src: "/img/attire-man-velvet.webp", mask: "/img/attire-man-velvet-mask.png", highlights: "/img/attire-man-velvet-hl.webp", blendMode: "color" },
  { label: "Vest & tie", src: "/img/attire-man-vest-tie.webp", mask: "/img/attire-man-vest-tie-mask.png", highlights: "/img/attire-man-vest-tie-hl.webp", blendMode: "color" },
];

export const WOMEN_STYLES: FigureStyle[] = [
  { label: "Column · wrap", src: "/img/attire-woman.webp", mask: "/img/attire-woman-mask.png", highlights: "/img/attire-woman-hl.webp" },
  { label: "Off-shoulder slit", src: "/img/attire-woman-velvet-slit.webp", mask: "/img/attire-woman-velvet-slit-mask.png", highlights: "/img/attire-woman-velvet-slit-hl.webp", blendMode: "color" },
  { label: "Long sleeve", src: "/img/attire-woman-long-sleeve.webp", mask: "/img/attire-woman-long-sleeve-mask.png", highlights: "/img/attire-woman-long-sleeve-hl.webp", blendMode: "color" },
];

export const ATTIRE_STYLES = [...MEN_STYLES, ...WOMEN_STYLES];

/* ─────────────────────────────  THE WELCOME MIX  ─────────────────────────────
 * The guide never opens on a single colour: the six illustrations wear six
 * different shades — three glossy greens and three shining browns — so nobody can
 * read the theme as “all green”. Men lead with two browns and a green; women answer
 * with a brown and two greens. A tap on any swatch re-dresses all six in that shade
 * (in the live guide), and one tap on “the mix” brings this opening look back.
 *
 * The split is derived from the guest palette the couple saved, so it keeps working
 * whatever shades — and how many of them — are in the binder.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ShadeFamily = "green" | "brown" | "other";

function toHsl(hex: string): { h: number; s: number; l: number } | null {
  const raw = (hex || "").trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s, l };
}

/** Greens, warm browns, or something else (greys, blues…) the couple may have added. */
export function shadeFamily(hex: string): ShadeFamily {
  const c = toHsl(hex);
  if (!c || c.s < 0.08 || c.l < 0.04 || c.l > 0.96) return "other";
  if (c.h >= 55 && c.h < 185) return "green";
  if (c.h >= 8 && c.h < 55) return "brown";
  return "other";
}

/** How many greens / browns the guest palette holds — used for the “six greens · six browns” lines. */
export function paletteFamilies(swatches: AttireSwatch[]) {
  let greens = 0, browns = 0, other = 0;
  for (const swatch of swatches || []) {
    const family = shadeFamily(swatch?.hex || "");
    if (family === "green") greens++;
    else if (family === "brown") browns++;
    else other++;
  }
  return { greens, browns, other, total: greens + browns + other };
}

/** Three shades spread across a family (first, middle, last) so the mix reads as varied, not as a gradient. */
function spread<T>(list: T[], count: number): T[] {
  if (list.length <= count) return [...list];
  return Array.from({ length: count }, (_, i) => list[Math.round((i * (list.length - 1)) / (count - 1))]);
}

/** Lead with the spread shades, then everything else — a family only repeats once it has nothing new to give. */
function familyQueue(list: AttireSwatch[]): AttireSwatch[] {
  if (list.length <= 3) return [...list];
  const lead = spread(list, 3);
  return [...lead, ...list.filter((swatch) => !lead.includes(swatch))];
}

/** The figure that asks for brown (two of the three men) or green (two of the three women). */
const wantsBrown = (isMan: boolean, slot: number) => (isMan ? slot !== 1 : slot === 0);

/**
 * Six hexes for the six illustrations — the opening look of the guide and of the printed card.
 * Always three shades of each family when the palette has them; a palette with only one family
 * (or only one shade) still fills all six figures without ever leaving one blank.
 */
export function defaultFigureHexes(swatches: AttireSwatch[], figureCount = ATTIRE_STYLES.length): string[] {
  const valid = (swatches || []).filter((s) => s && shadeFamily(s.hex) !== null && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test((s.hex || "").trim()));
  const palette = valid.length ? valid : [{ name: "Emerald", hex: "#0A5C33" }];
  const queues: Record<ShadeFamily, AttireSwatch[]> = {
    green: familyQueue(palette.filter((s) => shadeFamily(s.hex) === "green")),
    brown: familyQueue(palette.filter((s) => shadeFamily(s.hex) === "brown")),
    other: familyQueue(palette.filter((s) => shadeFamily(s.hex) === "other")),
  };
  const next: Record<ShadeFamily, number> = { green: 0, brown: 0, other: 0 };
  const taken = new Set<string>();
  const menCount = Math.min(MEN_STYLES.length, figureCount);
  const hexes: string[] = [];

  const take = (family: ShadeFamily): string | null => {
    while (next[family] < queues[family].length) {
      const hex = queues[family][next[family]++].hex;
      const key = hex.trim().toLowerCase();
      if (!taken.has(key)) { taken.add(key); return hex; }
    }
    return null;
  };

  for (let i = 0; i < figureCount; i++) {
    const prefers: ShadeFamily = wantsBrown(i < menCount, i % 3) ? "brown" : "green";
    const hex = take(prefers) ?? take("other") ?? take(prefers === "green" ? "brown" : "green")
      // fewer shades than figures (a two-colour palette, say): cycle rather than leave a figure unpainted
      ?? palette[i % palette.length].hex;
    hexes.push(hex);
  }
  return hexes;
}
