"use client";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .36 0 0 0 0 .27 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const FIBRE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .02' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .44 0 0 0 0 .32 0 0 0 .13 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`;

/** One long, continuous vintage love letter — it starts rolled up like a scroll and unrolls when guests reach it. */
export default function Letter({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(1);
  const [done, setDone] = useState(false);
  /* The unroll is tied to the guest's scroll: the rolled edge sits just below the viewport, so the
     letter opens as they read downwards — and softly rolls back when they scroll up. Clip only,
     so the page height never changes. Reduced motion → simply shown open. */
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "end 92%"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, full]);
  const clip = useMotionTemplate`inset(-60px -400px calc(100% - ${y}px) -400px)`;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setFull(el.offsetHeight + 60);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDone(true); return; }
    return scrollYProgress.on("change", (v) => { if (v >= 0.999) setDone(true); });
  }, [scrollYProgress]);
  const spin = useTransform(y, (v) => `${(v / 3) % 360}deg`);

  return (
    <div ref={ref} className="relative mx-auto w-[92%] md:w-[84%] max-w-5xl mt-10 mb-14">
      {/* soft halo: a box-shadow on the clipped wrapper instead of a full-height blur(40px)
          layer — same look at the edges, a fraction of the paint cost. It sits inside the
          clip, so the glow unrolls with the letter. */}
      <motion.div style={{ clipPath: done ? "none" : clip, WebkitClipPath: done ? "none" : clip }} className="relative shadow-[0_14px_38px_6px_rgba(90,70,58,0.22)]">
        <div className="relative z-[5] deckle-long overflow-hidden" style={{ backgroundColor: "#F6F0E4", backgroundImage: `${GRAIN}, ${FIBRE}`, backgroundSize: "220px 220px, 600px 600px" }}>
          <div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(165deg,rgba(255,255,255,.35),transparent_18%,transparent_82%,rgba(120,95,75,.06))]" />
          {STAINS.map((st, i) => (
            <div key={i} aria-hidden className="absolute rounded-full pointer-events-none" style={{ top: st.top, left: st.left, width: st.size, height: st.size, background: stainBg[st.kind], transform: `rotate(${i * 37}deg) scaleX(${1 + (i % 3) * 0.12})` }} />
          ))}
          <div aria-hidden className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(150,115,80,.16),inset_0_0_8px_rgba(150,115,80,.22)]" />
          <div className="relative z-[1] pt-6 md:pt-10 pb-6 md:pb-10">{children}</div>
        </div>
        <div aria-hidden className="lace-trim absolute z-[7] -top-3 md:-top-4 -inset-x-1" style={{ transform: "scaleY(-1)" }} />
        <div aria-hidden className="lace-trim lace-trim-bottom absolute z-[7] -bottom-3 md:-bottom-4 -inset-x-1" />
        {aside}
      </motion.div>

      {/* the paper roll that travels down as the letter unrolls */}
      {!done && (
        <motion.div aria-hidden style={{ top: y }} className="absolute z-[9] -left-[1.5%] -right-[1.5%] -translate-y-1/2 pointer-events-none">
          <div className="relative h-[clamp(30px,5vw,54px)] rounded-[999px] overflow-hidden shadow-[0_12px_16px_-8px_rgba(61,47,38,.38),0_2px_3px_rgba(61,47,38,.2)]"
            style={{ background: "linear-gradient(180deg,#D9CCB6 0%,#F8F3EA 22%,#FFFDF8 38%,#EFE6D6 60%,#CDBDA3 85%,#B8A688 100%)" }}>
            {/* paper grain + the spiral of rolled paper sliding past */}
            <motion.div className="absolute inset-0 opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(120,95,75,.0) 0 22px, rgba(120,95,75,.10) 22px 23px)", backgroundPositionX: spin }} />
            <div className="absolute inset-0" style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px", mixBlendMode: "multiply" }} />
            {/* rolled ends showing the spiral */}
            {(["left", "right"] as const).map((side) => (
              <div key={side} className="absolute top-0 bottom-0 aspect-[0.45] rounded-[50%]" style={{ [side]: 0, background: "repeating-radial-gradient(circle at 50% 50%, #EFE6D6 0 2px, #CDBDA3 2px 3px)", boxShadow: "inset 0 0 6px rgba(61,47,38,.35)" }} />
            ))}
          </div>
          {/* wine ribbon that tied the scroll, loosened */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 md:w-4 h-[115%] bg-wine/85 shadow-[0_2px_3px_rgba(61,47,38,.3)]" />
        </motion.div>
      )}
    </div>
  );
}
