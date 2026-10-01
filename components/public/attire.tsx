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
  ["Burgundy & copper", "our families’"], ["Pastels", "save for brunch"],
  ["Jeans & casual", "black tie only"], ["Mini skirts", "floor-length, please"],
  ["Ball gowns & trains", "keep it slim"], ["Sneakers & sandals", "dress shoes only"],
] as const;

/** Fabric weaves, painted in CSS so guests know exactly what to ask for in the shop. */
const WEAVE: Record<string, { img: string; size?: string; inset: string }> = {
  velvet: { img: "radial-gradient(circle at 32% 28%, rgba(255,255,255,.30), transparent 52%), radial-gradient(circle at 72% 70%, rgba(255,255,255,.16), transparent 44%), repeating-linear-gradient(90deg, rgba(0,0,0,.20) 0 1px, transparent 1px 3px), linear-gradient(155deg, rgba(255,255,255,.12), rgba(0,0,0,.30))", inset: "inset 0 0 8px rgba(0,0,0,.45), inset 0 -3px 5px rgba(0,0,0,.30)" },
  silk: { img: "repeating-linear-gradient(102deg, rgba(255,255,255,.22) 0 2px, transparent 2px 5px, rgba(0,0,0,.10) 5px 6px, transparent 6px 9px), linear-gradient(120deg, rgba(255,255,255,.38), transparent 42%, rgba(255,255,255,.20) 62%, transparent 82%)", inset: "inset 0 0 5px rgba(0,0,0,.28)" },
  satin: { img: "linear-gradient(115deg, transparent 22%, rgba(255,255,255,.45) 46%, transparent 68%), repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, transparent 1px 4px)", inset: "inset 0 0 5px rgba(0,0,0,.26)" },
  wool: { img: "repeating-linear-gradient(45deg, rgba(255,255,255,.13) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,.12) 0 1px, transparent 1px 4px), linear-gradient(135deg, rgba(255,255,255,.12), transparent 62%)", inset: "inset 0 0 5px rgba(0,0,0,.30)" },
  poly: { img: "radial-gradient(rgba(255,255,255,.25) .5px, transparent .8px), linear-gradient(115deg, transparent 28%, rgba(255,255,255,.32) 50%, transparent 72%)", size: "3px 3px, auto", inset: "inset 0 0 5px rgba(0,0,0,.26)" },
  liquid: { img: "repeating-linear-gradient(115deg, rgba(255,255,255,.30) 0 3px, transparent 3px 7px, rgba(0,0,0,.12) 7px 8px, transparent 8px 12px), linear-gradient(115deg, rgba(255,255,255,.42), transparent 55%)", inset: "inset 0 0 5px rgba(0,0,0,.26)" },
};
const weaveOf = (fabric?: string) =>
  !fabric ? WEAVE.satin
    : /velvet/i.test(fabric) ? WEAVE.velvet
      : /wool/i.test(fabric) ? WEAVE.wool
        : /dry-fit/i.test(fabric) ? WEAVE.poly
          : /liquid/i.test(fabric) ? WEAVE.liquid
            : /silk/i.test(fabric) ? WEAVE.silk
              : WEAVE.satin;

/** The fabrics we'd rather not see — text above, a crossed-out sample below. */
const NO_FABRIC = [
  ["Matte cotton & linen", "#C9BCA6", "repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 1px, transparent 1px 3px)"],
  ["Net, tulle & mesh", "rgba(251,246,238,.35)", "repeating-linear-gradient(45deg, rgba(120,105,85,.55) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(120,105,85,.55) 0 1px, transparent 1px 5px)"],
  ["Crinkled chiffon & crepe", "rgba(240,232,218,.55)", "repeating-radial-gradient(circle at 50% -20%, rgba(255,255,255,.65) 0 1px, transparent 1px 4px), repeating-linear-gradient(80deg, rgba(160,145,120,.25) 0 2px, transparent 2px 5px)"],
  ["Rough burlap & jute", "#B79B6F", "repeating-linear-gradient(0deg, rgba(0,0,0,.24) 0 2px, transparent 2px 5px), repeating-linear-gradient(90deg, rgba(0,0,0,.20) 0 2px, transparent 2px 5px)"],
] as const;

/** Black-tie attire guide: tap a colour and both sketches change; flip for what to avoid. */
export function AttireGuide({ guests }: { guests?: Attire }) {
  const colors = guests?.colors?.length ? guests.colors : [{ name: "Emerald", hex: "#0A5C33" }];
  const [pick, setPick] = useState(0);
  const c = colors[Math.min(pick, colors.length - 1)];
  const { flip, toggle } = useFlip();
  return (
    <div className="col mt-8 md:mt-10 [perspective:1800px]">
      <motion.div animate={flip ? { rotateY: 180 } : { rotateY: 0 }} transition={{ duration: 1, ease: EASE }}
        className="grid [transform-style:preserve-3d]">
        {/* FRONT — the look */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] paper-card deckle relative px-5 md:px-12 py-8 md:py-10 text-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="micro text-wine">Black tie · in glossy greens &amp; shining browns</p>
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
          <p className="micro text-taupe mt-1 h-[1.2em]">look for: {c.fabric ?? "satin, silk or velvet"}</p>
          <p className="micro text-taupe mt-2 mb-4">Tap a swatch to try it on · each one names a fabric to look for — shine welcome, never matte or net</p>
          <div className="grid grid-cols-6 gap-2 md:gap-3 justify-items-center">
            {colors.map((col, i) => (
              <motion.button key={col.name} type="button" onClick={() => setPick(i)} whileTap={{ scale: 0.9 }} animate={{ y: pick === i ? -6 : 0 }} aria-label={`${col.name}${col.fabric ? ` — ${col.fabric}` : ""}`}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-[6px] shadow-[0_6px_12px_-4px_rgba(61,47,38,.5)] ring-offset-2 ring-offset-[#FBF8F2] transition-shadow ${pick === i ? "ring-2 ring-wine" : "ring-1 ring-black/10"}`}
                style={{ backgroundColor: col.hex, backgroundImage: col.name === "Jewel Beetle"
                  // elytra sheen over the dry-fit knit: mint gloss top-left, violet-blue flash bottom-right
                  ? `radial-gradient(circle at 30% 26%, rgba(190,255,225,.5), transparent 50%), radial-gradient(circle at 70% 72%, rgba(96,64,190,.38), transparent 56%), ${WEAVE.poly.img}`
                  : weaveOf(col.fabric).img,
                  backgroundSize: col.name === "Jewel Beetle" ? `auto, auto, ${WEAVE.poly.size}` : weaveOf(col.fabric).size,
                  boxShadow: `${weaveOf(col.fabric).inset}, 0 6px 12px -4px rgba(61,47,38,.5)` }} />
            ))}
          </div>
          <div className="mt-6"><button type="button" onClick={toggle}><FlipHint label="Need help? Tap to see what to avoid" /></button></div>
        </div>
        {/* BACK — kindly avoid */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] paper-card deckle relative px-5 md:px-12 py-8 md:py-10 text-center flex flex-col justify-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="micro text-wine">Kindly avoid</p>
          <p className="script text-wine text-script-sm mt-2">A little help</p>
          <div className="grid grid-cols-2 gap-2 md:gap-3 mt-6 max-w-2xl mx-auto w-full text-left">
            {AVOID.map(([what, why], i) => (
              <motion.div key={what} initial={false} animate={flip ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} transition={{ delay: flip ? 0.5 + i * 0.05 : 0, duration: 0.4 }}
                className="flex items-center gap-3 bg-[#FBF6EE] border border-taupe/25 rounded-full pl-2 pr-4 py-2">
                <span className="w-6 h-6 md:w-7 md:h-7 shrink-0 rounded-full bg-wine text-lace grid place-items-center text-xs md:text-sm leading-none">✕</span>
                <span className="leading-tight"><span className="block font-serif text-fine md:text-body text-ink">{what}</span><span className="block font-serif italic text-tag md:text-fine text-taupe">{why}</span></span>
              </motion.div>
            ))}
          </div>
          {/* fabric no-nos: text above, a crossed-out sample below */}
          <p className="micro text-wine mt-7">Fabrics to skip — never fully matte, never rough or net</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3 max-w-2xl mx-auto w-full">
            {NO_FABRIC.map(([label, base, img], i) => (
              <motion.div key={label} initial={false} animate={flip ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ delay: flip ? 0.6 + i * 0.08 : 0, duration: 0.4 }}>
                <p className="font-serif italic text-fine md:text-body text-taupe leading-tight mb-1.5">{label}</p>
                <div className="relative h-14 md:h-16 rounded-md border border-taupe/30 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,.25)]" style={{ backgroundColor: base, backgroundImage: img }}>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
                    <line x1="6" y1="8" x2="94" y2="92" stroke="#7A1F2B" strokeWidth="5" strokeLinecap="round" opacity=".85" />
                    <line x1="94" y1="8" x2="6" y2="92" stroke="#7A1F2B" strokeWidth="5" strokeLinecap="round" opacity=".85" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6"><button type="button" onClick={toggle}><FlipHint label="Back to the look" /></button></div>
        </div>
      </motion.div>
    </div>
  );
}
