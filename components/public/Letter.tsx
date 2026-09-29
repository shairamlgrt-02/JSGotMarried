"use client";
import { LaceEdge } from "./ornaments";

/** Faint real-looking stains & fold lines scattered over the letter. */
const STAINS: { top: string; left: string; size: string; kind: "ring" | "blot" | "fox" }[] = [
  { top: "4%", left: "78%", size: "180px", kind: "ring" },
  { top: "17%", left: "6%", size: "260px", kind: "blot" },
  { top: "31%", left: "84%", size: "120px", kind: "fox" },
  { top: "46%", left: "10%", size: "150px", kind: "ring" },
  { top: "58%", left: "70%", size: "300px", kind: "blot" },
  { top: "72%", left: "4%", size: "110px", kind: "fox" },
  { top: "86%", left: "80%", size: "200px", kind: "ring" },
  { top: "93%", left: "30%", size: "240px", kind: "blot" },
];
const stainBg = {
  ring: "radial-gradient(circle, transparent 58%, rgba(150,110,70,.13) 62%, rgba(150,110,70,.05) 66%, transparent 71%)",
  blot: "radial-gradient(ellipse at 40% 45%, rgba(170,130,85,.09), rgba(170,130,85,.04) 45%, transparent 70%)",
  fox: "radial-gradient(circle, rgba(140,95,55,.14), rgba(140,95,55,.05) 35%, transparent 60%)",
};

/** The long vintage love letter that everything below the envelope is printed on. */
export default function Letter({ children, under, over }: { children: React.ReactNode; under?: React.ReactNode; over?: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[86%] md:w-[84%] max-w-5xl mt-10 mb-24">
      {under}
      {/* lace peeking above the letter */}
      <LaceEdge flip className="relative z-[6] -mb-4 md:-mb-6 scale-x-[1.02]" />
      {/* soft cast shadow (cheap: separate blurred layer, no filters on the big sheet) */}
      <div aria-hidden className="absolute z-[4] inset-x-2 top-12 bottom-6 bg-[#5A463A]/25 blur-2xl rounded-[30px] translate-y-3" />
      <div className="relative z-[5] deckle-long bg-[#FBF8F1] overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[url('/img/paper.webp')] bg-[length:100%_auto] bg-repeat-y opacity-90" />
        <div aria-hidden className="absolute inset-0 paper-card opacity-70 mix-blend-normal" style={{ backgroundColor: "transparent" }} />
        {/* fold creases */}
        {[33.3, 66.6].map((t) => (
          <div key={t} aria-hidden className="absolute inset-x-0 h-6" style={{ top: `${t}%`, background: "linear-gradient(180deg, transparent, rgba(120,95,75,.07) 45%, rgba(255,255,255,.6) 52%, transparent)" }} />
        ))}
        {STAINS.map((st, i) => (
          <div key={i} aria-hidden className="absolute rounded-full pointer-events-none" style={{ top: st.top, left: st.left, width: st.size, height: st.size, background: stainBg[st.kind], transform: `rotate(${i * 37}deg) scaleX(${1 + (i % 3) * 0.12})` }} />
        ))}
        {/* edge ageing */}
        <div aria-hidden className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(150,115,80,.18),inset_0_0_8px_rgba(150,115,80,.25)]" />
        <div className="relative z-[1]">{children}</div>
      </div>
      <LaceEdge className="relative z-[6] -mt-4 md:-mt-6 scale-x-[1.02]" />
      {over}
    </div>
  );
}

/**
 * A realistic wedding object lying flat ON the letter, fixed to its spot (no floating / drifting).
 * - `edge` / `edgeMobile`: fraction of the object's width that sits OUTSIDE the letter edge
 *   (large values = only the tip rests on the paper; the rest is off to the side / off-screen).
 * - Tight contact shadow so it reads as lying on the paper, not hovering.
 */
export function Peek({ src, alt = "", side, top, width, rotate = 0, edge = 0.5, edgeMobile, flip = false, mobile = true }: {
  src: string; alt?: string; side: "left" | "right"; top: string; width: string; rotate?: number; edge?: number; edgeMobile?: number; flip?: boolean; mobile?: boolean;
}) {
  const dir = side === "left" ? -1 : 1;
  const vars = { "--e": `${dir * edge * 100}%`, "--em": `${dir * (edgeMobile ?? Math.min(0.9, edge + 0.15)) * 100}%` } as React.CSSProperties;
  return (
    <div aria-hidden style={{ top, [side]: 0, width, ...vars }} className={`peek absolute z-[20] pointer-events-none ${mobile ? "" : "hidden md:block"}`}>
      <img src={src} alt={alt} loading="lazy" draggable={false}
        style={{ transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})` }}
        className="w-full h-auto select-none [filter:drop-shadow(1px_2px_1.5px_rgba(51,39,31,.45))_drop-shadow(3px_8px_8px_rgba(51,39,31,.18))]" />
    </div>
  );
}
