import type { Config } from "tailwindcss";
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
      transitionTimingFunction: { lux: "cubic-bezier(0.76, 0, 0.24, 1)" },
    },
  },
  plugins: [],
};
export default config;
