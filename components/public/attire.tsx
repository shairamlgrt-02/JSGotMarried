"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Attire } from "@/lib/types";
import { EASE } from "./fx";
import { FlipHint, useFlip } from "./stickers";

/** A watercolour figure drawn straight onto the paper, recoloured in satin: transparent art + masked multiply tint + soft white shine. */
function TinFigure({ kind, color, className = "" }: { kind: "man" | "woman"; color: string; className?: string }) {
  const mask = `url(/img/attire-${kind}-mask.png)`;
  return (
    <div className={`relative inline-block ${className}`}>
      <img src={`/img/attire-${kind}.webp`} alt="" className="h-full w-auto pointer-events-none select-none" draggable={false} />
      <motion.div initial={false} animate={{ backgroundColor: color }} transition={{ duration: 0.8, ease: EASE }}
        className="absolute inset-0 mix-blend-multiply pointer-events-none"
        style={{ WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
      <img src={`/img/attire-${kind}-hl.webp`} alt="" draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none select-none" />
    </div>
  );
}

const AVOID = [
  ["Black", "the groom’s"], ["White & ivory", "the bride’s"],
  ["Burgundy & teal", "our families’"], ["Pastels", "save for brunch"],
  ["Jeans & casual", "black tie only"], ["Mini skirts", "floor-length, please"],
  ["Ball gowns & trains", "keep it slim"], ["Sneakers & sandals", "dress shoes only"],
] as const;

/** Black-tie attire guide: tap a colour and both sketches change; flip for what to avoid. */
export function AttireGuide({ guests }: { guests?: Attire }) {
  const colors = guests?.colors?.length ? guests.colors : [{ name: "Olive", hex: "#5B5B2E" }];
  const [pick, setPick] = useState(0);
  const c = colors[Math.min(pick, colors.length - 1)];
  const { flip, toggle } = useFlip();
  return (
    <div className="col mt-8 md:mt-10 [perspective:1800px]">
      <motion.div animate={flip ? { rotateY: 180 } : { rotateY: 0 }} transition={{ duration: 1, ease: EASE }}
        className="grid [transform-style:preserve-3d]">
        {/* FRONT — the look */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] paper-card deckle relative px-5 md:px-12 py-8 md:py-10 text-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="micro text-wine">Black tie · in earth tones</p>
          <p className="font-serif italic text-mocha text-body mt-3 max-w-xl mx-auto text-pretty">Floor-length column, sheath or slim A-line dresses · tuxedos or dark suits with a tie. Bring a light wrap or scarf — evenings can get cool.</p>
          <div className="flex justify-center items-end gap-5 md:gap-16 mt-6">
            <div>
              <TinFigure kind="man" color={c.hex} className="h-64 md:h-[26rem]" />
              <p className="micro text-taupe tracking-[0.12em] text-balance mt-2">Tuxedo / dark suit</p>
            </div>
            <div>
              <TinFigure kind="woman" color={c.hex} className="h-64 md:h-[26rem]" />
              <p className="micro text-taupe tracking-[0.12em] text-balance mt-2">Column dress · with a wrap</p>
            </div>
          </div>
          <p className="script text-wine text-script-sm mt-4 h-[1.25em]">{c.name}</p>
          <p className="micro text-taupe mt-2 mb-4">Tap a colour to try it on</p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {colors.map((col, i) => (
              <motion.button key={col.name} type="button" onClick={() => setPick(i)} whileTap={{ scale: 0.9 }} animate={{ y: pick === i ? -6 : 0 }} aria-label={col.name}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full shadow-[0_6px_12px_-4px_rgba(61,47,38,.5)] ring-offset-2 ring-offset-[#FBF8F2] transition-shadow ${pick === i ? "ring-2 ring-wine" : "ring-1 ring-black/10"}`}
                style={{ backgroundColor: col.hex, backgroundImage: "linear-gradient(135deg,rgba(255,255,255,.25),transparent 55%)" }} />
            ))}
          </div>
          <div className="mt-6"><button type="button" onClick={toggle}><FlipHint label="Need help? Tap to see what to avoid" /></button></div>
        </div>
        {/* BACK — kindly avoid */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] paper-card deckle relative px-5 md:px-12 py-8 md:py-10 text-center flex flex-col justify-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="micro text-wine">Kindly avoid</p>
          <p className="script text-wine text-script-sm mt-2">A little help</p>
          <div className="grid sm:grid-cols-2 gap-2 md:gap-3 mt-6 max-w-2xl mx-auto w-full text-left">
            {AVOID.map(([what, why], i) => (
              <motion.div key={what} initial={false} animate={flip ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} transition={{ delay: flip ? 0.5 + i * 0.05 : 0, duration: 0.4 }}
                className="flex items-center gap-3 bg-[#FBF6EE] border border-taupe/25 rounded-full pl-2 pr-4 py-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-wine text-lace grid place-items-center text-sm leading-none">✕</span>
                <span className="leading-tight"><span className="block font-serif text-body text-ink">{what}</span><span className="block font-serif italic text-fine text-taupe">{why}</span></span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6"><button type="button" onClick={toggle}><FlipHint label="Back to the look" /></button></div>
        </div>
      </motion.div>
    </div>
  );
}
