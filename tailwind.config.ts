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
       * Deliberately compact: the phone holds the fine print, the desktop stays open and airy.
       *
       *   micro   11.5 → 13    uppercase labels, kickers, buttons, captions
       *   tag     13.5 → 15    the time labels on the programme
       *   fine    15 → 16.5    secondary lines: colour names, titles under names, hints
       *   body    17 → 19.5    paragraphs, programme details, FAQ answers
       *   lead    19 → 22.5    story, invitation wording, list headings
       *   h3      22 → 29.5    card titles, names
       *   display 27 → 47      couple names / venue in capitals, footer date
       *   script-sm 29 → 42    script accents ("and", colour name, postcard)
       *   script  37 → 55      section titles, sign-off names
       *   year    32 → 64      the "2026" under the big date
       *   numeral 72 → 144     the big 11.11
       */
      fontSize: {
        micro: [fluid(11.5, 13), { lineHeight: "1.4" }],
        tag: [fluid(13.5, 15), { lineHeight: "1.3" }],
        fine: [fluid(15, 16.5), { lineHeight: "1.4" }],
        body: [fluid(17, 19.5), { lineHeight: "1.55" }],
        lead: [fluid(19, 22.5), { lineHeight: "1.5" }],
        h3: [fluid(22, 29.5), { lineHeight: "1.15" }],
        display: [fluid(27, 47), { lineHeight: "1.1" }],
        "script-sm": [fluid(29, 42), { lineHeight: "1.1" }],
        script: [fluid(37, 55), { lineHeight: "1.1" }],
        year: [fluid(32, 64), { lineHeight: "1" }],
        numeral: [fluid(72, 144), { lineHeight: "1" }],
      },
      /**
       * SECTION RHYTHM — vertical padding between blocks of the letter (phone → desktop).
       *   sec-lg  the invitation     sec  a normal section     sec-sm  connectors (postcard, photos)
       *   head    title → content    stack  gap between stacked cards
       * Mobile minima are compact so a section can feel like one phone-screen beat where its content allows.
       */
      spacing: {
        "sec-lg": fluid(24, 92),
        sec: fluid(24, 66),
        "sec-sm": fluid(16, 40),
        head: fluid(20, 46),
        stack: fluid(16, 44),
      },
      transitionTimingFunction: { lux: "cubic-bezier(0.76, 0, 0.24, 1)" },
    },
  },
  plugins: [],
};
export default config;
