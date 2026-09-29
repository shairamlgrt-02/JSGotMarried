"use client";
import { LaceEdge } from "./ornaments";

/** Faint, real-looking stains scattered down the letter. */
const STAINS: { top: string; left: string; size: string; kind: "ring" | "blot" | "fox" }[] = [
  { top: "3%", left: "80%", size: "170px", kind: "ring" },
  { top: "14%", left: "4%", size: "240px", kind: "blot" },
  { top: "27%", left: "86%", size: "110px", kind: "fox" },
  { top: "41%", left: "8%", size: "140px", kind: "ring" },
  { top: "55%", left: "72%", size: "280px", kind: "blot" },
  { top: "68%", left: "3%", size: "100px", kind: "fox" },
  { top: "82%", left: "82%", size: "190px", kind: "ring" },
  { top: "93%", left: "28%", size: "230px", kind: "blot" },
];
const stainBg = {
  ring: "radial-gradient(circle, transparent 58%, rgba(150,110,70,.12) 62%, rgba(150,110,70,.05) 66%, transparent 71%)",
  blot: "radial-gradient(ellipse at 40% 45%, rgba(170,130,85,.08), rgba(170,130,85,.035) 45%, transparent 70%)",
  fox: "radial-gradient(circle, rgba(140,95,55,.12), rgba(140,95,55,.045) 35%, transparent 60%)",
};

/** Fine, even paper grain (tiny noise – no visible repeat) and very soft fibre mottling. */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .36 0 0 0 0 .27 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const FIBRE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .02' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .44 0 0 0 0 .32 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`;

/** One long, continuous vintage love letter that everything below the envelope is written on. */
export default function Letter({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[92%] md:w-[84%] max-w-5xl mt-10 mb-24">
      <LaceEdge flip className="relative z-[6] -mb-4 md:-mb-6 scale-x-[1.02]" />
      <div aria-hidden className="absolute z-[4] inset-x-2 top-12 bottom-6 bg-[#5A463A]/25 blur-2xl rounded-[30px] translate-y-3" />
      <div className="relative z-[5] deckle-long overflow-hidden" style={{ backgroundColor: "#F6F0E4", backgroundImage: `${GRAIN}, ${FIBRE}`, backgroundSize: "220px 220px, 600px 600px" }}>
        {/* soft light across the sheet */}
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(165deg,rgba(255,255,255,.35),transparent_18%,transparent_82%,rgba(120,95,75,.06))]" />
        {STAINS.map((st, i) => (
          <div key={i} aria-hidden className="absolute rounded-full pointer-events-none" style={{ top: st.top, left: st.left, width: st.size, height: st.size, background: stainBg[st.kind], transform: `rotate(${i * 37}deg) scaleX(${1 + (i % 3) * 0.12})` }} />
        ))}
        {/* aged edges */}
        <div aria-hidden className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(150,115,80,.16),inset_0_0_8px_rgba(150,115,80,.22)]" />
        <div className="relative z-[1] py-10 md:py-16">{children}</div>
      </div>
      <LaceEdge className="relative z-[6] -mt-4 md:-mt-6 scale-x-[1.02]" />
    </div>
  );
}
