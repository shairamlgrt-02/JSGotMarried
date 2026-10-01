import type { Config } from "tailwindcss";

/**
 * Fluid size between two viewport widths: `minPx` at 375px (a phone), `maxPx` from 1024px up.
 * Used for the public-site type scale and section rhythm so everything grows together.
 */
const fluid = (minPx: number, maxPx: number, from = 375, to = 1024) => {
  const slope = (maxPx - minPx) / (to - from);
  const base = minPx - slope * from;
  return `clamp(${minPx / 16}rem, ${(base / 16).toFixed(4)}rem + ${(slope * 100).toFixed(3)}vw, ${maxPx / 16}rem)`;
};

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vintage ivory palette
        ivory: "#F7F4EE",
        oat: "#E9DFCE",
        lace: "#FCFAF5",
        taupe: "#6F5B4C",
        mocha: "#46362C",
        wine: "#6E1F2E",
        blush: "#E3CFC6",
        // text + surfaces (kept as tokens used across the app)
        ink: "#33271F",
        paper: "#FCFAF5",
        // dress-code / status colors
        espresso: "#3C2415",
        moss: "#5E6B3A",
        burgundy: "#6B1D2A",
        amethyst: "#5D3A6B",
        teal: "#1F5C5C",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        script: ["var(--font-script)", "cursive"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      /**
       * PUBLIC-SITE TYPE SCALE — every size on the wedding page comes from this list (phone → desktop, fluid).
       * Change a number here and the whole page follows. (The admin binder keeps Tailwind's defaults.)
       *
       *   micro   13 → 14   uppercase labels, kickers, buttons, captions
       *   tag     15 → 16   the time labels on the programme
       *   fine    17 → 18   secondary lines: colour names, titles under names, hints
       *   body    20 → 22   paragraphs, programme details, FAQ answers
       *   lead    22 → 26   story, invitation wording, list headings
       *   h3      26 → 34   card titles, names
       *   display 32 → 56   couple names / venue in capitals, footer date
       *   script-sm 34 → 48 script accents ("and", colour name, postcard)
       *   script  44 → 64   section titles, sign-off names
       *   year    40 → 80   the "2026" under the big date
       *   numeral 88 → 176  the big 11.11
       */
      fontSize: {
        micro: [fluid(13, 14), { lineHeight: "1.4" }],
        tag: [fluid(15, 16), { lineHeight: "1.3" }],
        fine: [fluid(17, 18), { lineHeight: "1.4" }],
        body: [fluid(20, 22), { lineHeight: "1.55" }],
        lead: [fluid(22, 26), { lineHeight: "1.5" }],
        h3: [fluid(26, 34), { lineHeight: "1.15" }],
        display: [fluid(32, 56), { lineHeight: "1.1" }],
        "script-sm": [fluid(34, 48), { lineHeight: "1.1" }],
        script: [fluid(44, 64), { lineHeight: "1.1" }],
        year: [fluid(40, 80), { lineHeight: "1" }],
        numeral: [fluid(88, 176), { lineHeight: "1" }],
      },
      /**
       * SECTION RHYTHM — vertical padding between blocks of the letter (phone → desktop).
       *   sec-lg  the invitation     sec  a normal section     sec-sm  connectors (postcard, photos)
       *   head    title → content    stack  gap between stacked cards
       */
      spacing: {
        "sec-lg": fluid(80, 112),
        sec: fluid(56, 80),
        "sec-sm": fluid(32, 48),
        head: fluid(40, 56),
        stack: fluid(36, 56),
      },
      transitionTimingFunction: { lux: "cubic-bezier(0.76, 0, 0.24, 1)" },
    },
  },
  plugins: [],
};
export default config;
