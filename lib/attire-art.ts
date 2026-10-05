export type FigureStyle = {
  label: string;
  src: string;
  mask: string;
  highlights?: string;
  blendMode?: "multiply" | "color";
};

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
