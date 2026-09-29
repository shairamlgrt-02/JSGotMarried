"use client";
import { LaceEdge } from "./ornaments";

type Corner = "tl" | "tr" | "bl" | "br";
/** Which corners of each flat-lay photo hold the objects. */
const PAGES: Record<number, Corner[]> = { 1: ["tl", "br"], 2: ["tr", "bl"], 3: ["tl", "br"], 4: ["tr", "bl"], 5: ["tl", "br"] };

/** One corner of a real flat-lay photo, softly faded into the page's own paper so it reads as one sheet. */
function PhotoCorner({ page, corner }: { page: number; corner: Corner }) {
  const v = corner[0] === "t" ? "top" : "bottom";
  const h = corner[1] === "l" ? "left" : "right";
  const at = `${h === "left" ? "0%" : "100%"} ${v === "top" ? "0%" : "100%"}`;
  const mask = `radial-gradient(ellipse 100% 100% at ${at}, #000 68%, transparent 100%)`;
  return (
    <div aria-hidden className="absolute pointer-events-none w-[clamp(190px,36vw,460px)] aspect-square"
      style={{ [v]: 0, [h]: 0, backgroundImage: `url(/img/page${page}.webp)`, backgroundSize: "182% 182%", backgroundPosition: `${h} ${v}`, WebkitMaskImage: mask, maskImage: mask }} />
  );
}

/** A single page of the love letter: real photographed paper with objects lying in its corners. */
export function Page({ n, children, tilt = 0 }: { n: number; children: React.ReactNode; tilt?: number }) {
  return (
    <div className="relative" style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      <div aria-hidden className="absolute inset-x-3 top-4 -bottom-2 bg-[#5A463A]/25 blur-xl rounded-[20px]" />
      <div className="relative deckle-long overflow-hidden" style={{ backgroundImage: `url(/img/page${n}-tile.webp)`, backgroundSize: "clamp(260px,32vw,420px) auto" }}>
        {PAGES[n].map((c) => <PhotoCorner key={c} page={n} corner={c} />)}
        {/* gentle page lighting + aged edges */}
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(160deg,rgba(255,255,255,.35),transparent_30%,transparent_75%,rgba(120,95,75,.08))]" />
        <div aria-hidden className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(140,110,80,.16)]" />
        <div className="relative z-[1] py-[clamp(40px,7vw,100px)]">{children}</div>
      </div>
    </div>
  );
}

/** The love letter: several stacked pages, a lace ribbon peeking at the top. */
export default function Letter({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[92%] md:w-[84%] max-w-5xl mt-10 mb-24">
      <LaceEdge flip className="relative z-[6] -mb-4 md:-mb-6 scale-x-[1.02]" />
      <div className="relative z-[5] space-y-[-14px] md:space-y-[-20px]">{children}</div>
    </div>
  );
}
