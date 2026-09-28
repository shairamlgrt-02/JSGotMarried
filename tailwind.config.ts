import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F0D0A",
        paper: "#F6F1EB",
        espresso: "#3C2415",
        moss: "#4A5D23",
        burgundy: "#6B1D2A",
        gold: "#C9A86A",
        amethyst: "#5D3A6B",
        teal: "#1F5C5C",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: { lux: "cubic-bezier(0.76, 0, 0.24, 1)" },
    },
  },
  plugins: [],
};
export default config;
