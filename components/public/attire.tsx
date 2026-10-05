"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Attire } from "@/lib/types";
import { downloadAttireCard } from "@/lib/attire-card";
import { MEN_STYLES, WOMEN_STYLES, type FigureStyle } from "@/lib/attire-art";
import { EASE } from "./fx";
import { FlipHint, useFlip } from "./stickers";

/** Watercolour cut-out + masked swatch tint + a separate light pass to keep the cloth dimensional. */
function TinFigure({ style, color, className = "" }: { style: FigureStyle; color: string; className?: string }) {
  const mask = `url(${style.mask})`;
  return (
    <div role="img" aria-label={style.label} title={style.label} className={`relative inline-block ${className}`}>
      <img src={style.src} alt="" className="h-full w-auto pointer-events-none select-none" draggable={false} />
      <motion.div initial={false} animate={{ backgroundColor: color }} transition={{ duration: 0.8, ease: EASE }}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: style.blendMode ?? "multiply", WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
      {style.highlights && <img src={style.highlights} alt="" draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none select-none" />}
    </div>
  );
}

const AVOID = [
  ["Black", "the groom’s"], ["White & ivory", "the bride’s"],
  ["Burgundy & copper", "our families’"], ["Pastels", "save for brunch"],
  ["Tees, jeans & casual", "black tie — cotton stays under the jacket"], ["Mini skirts", "floor-length, please"],
  ["Ball gowns & trains", "slim silhouettes, please"], ["Sneakers & sandals", "dress shoes, please"],
] as const;

/** Fabric weaves, painted in CSS so guests know exactly what to ask for in the shop. */
const WEAVE: Record<string, { img: string; size?: string; inset: string }> = {
  velvet: { img: "radial-gradient(circle at 32% 28%, rgba(255,255,255,.32), transparent 55%), radial-gradient(circle at 72% 70%, rgba(255,255,255,.18), transparent 46%), radial-gradient(circle at 55% 45%, rgba(255,255,255,.10), transparent 62%), linear-gradient(155deg, rgba(255,255,255,.14), rgba(0,0,0,.32))", inset: "inset 0 0 8px rgba(0,0,0,.45), inset 0 -3px 5px rgba(0,0,0,.30)" },
  silk: { img: "linear-gradient(100deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,.06) 30%, rgba(255,255,255,.26) 52%, rgba(0,0,0,.10) 74%, rgba(255,255,255,.16) 100%), radial-gradient(circle at 70% 30%, rgba(255,255,255,.18), transparent 55%)", inset: "inset 0 0 5px rgba(0,0,0,.28)" },
  satin: { img: "linear-gradient(115deg, rgba(255,255,255,.05) 15%, rgba(255,255,255,.42) 45%, rgba(255,255,255,.08) 70%, rgba(255,255,255,.22) 92%)", inset: "inset 0 0 5px rgba(0,0,0,.26)" },
  wool: { img: "repeating-linear-gradient(45deg, rgba(255,255,255,.09) 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,.08) 0 1px, transparent 1px 5px), linear-gradient(135deg, rgba(255,255,255,.14), transparent 60%)", inset: "inset 0 0 5px rgba(0,0,0,.30)" },
  poly: { img: "radial-gradient(rgba(255,255,255,.20) .5px, transparent .9px), linear-gradient(115deg, rgba(255,255,255,.04) 20%, rgba(255,255,255,.30) 50%, rgba(255,255,255,.04) 78%)", size: "3px 3px, auto", inset: "inset 0 0 5px rgba(0,0,0,.26)" },
  liquid: { img: "linear-gradient(115deg, rgba(255,255,255,.40) 0%, rgba(255,255,255,.05) 26%, rgba(255,255,255,.34) 48%, rgba(0,0,0,.08) 68%, rgba(255,255,255,.28) 100%)", inset: "inset 0 0 5px rgba(0,0,0,.26)" },
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

/** Black-tie attire guide: tap a colour and all six illustrations change; flip for what to avoid. */
export function AttireGuide({ guests, couple, date, reserved = [] }: { guests?: Attire; couple: string; date: string; reserved?: Attire[] }) {
  const colors = guests?.colors?.length ? guests.colors : [{ name: "Emerald", hex: "#0A5C33" }];
  const [pick, setPick] = useState(0);
  const [cardStatus, setCardStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const c = colors[Math.min(pick, colors.length - 1)];
  const { flip, toggle } = useFlip();
  const saveCard = async () => {
    if (cardStatus === "working") return;
    setCardStatus("working");
    const saved = await downloadAttireCard({ couple, date, colors, selectedColor: c, reserved });
    setCardStatus(saved ? "done" : "error");
  };
  return (
    <div className="col mt-8 md:mt-10 [perspective:1800px]">
      <motion.div animate={flip ? { rotateY: 180 } : { rotateY: 0 }} transition={{ duration: 1, ease: EASE }}
        className="grid [transform-style:preserve-3d]">
        {/* FRONT — the look */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] paper-card deckle relative px-3 md:px-12 py-5 md:py-8 text-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="micro text-wine">Black tie · in glossy greens &amp; shining browns</p>
          <p className="font-serif italic text-mocha text-fine md:text-body mt-2 max-w-xl mx-auto text-pretty">
            <span className="block">Men: tuxedo, formal vest or suit &amp; tie.</span>
            <span className="block">Women: floor-length column, sheath or slim A-line.</span>
          </p>
          <div className="grid grid-cols-6 items-end gap-0.5 md:gap-2 mt-4 max-w-2xl mx-auto w-full">
            {[...MEN_STYLES, ...WOMEN_STYLES].map((style, index) => (
              <div key={style.label} className={`min-w-0 flex items-end justify-center ${index === MEN_STYLES.length ? "border-l border-taupe/20 pl-0.5 md:pl-2" : ""}`}>
                <TinFigure style={style} color={c.hex} className="h-[clamp(5.75rem,28vw,8rem)] md:h-44 max-w-full" />
              </div>
            ))}
          </div>
          <p className="script text-wine text-script-sm mt-3.5 h-[1.25em]">{c.name}</p>
          <p className="micro text-taupe mt-2 mb-3.5">Tap a swatch to try it on · satin, velvet, silk, fine suit, liquid poly</p>
          <div className="grid grid-cols-6 gap-1.5 md:gap-3 justify-items-center">
            {colors.map((col, i) => (
              <motion.button key={col.name} type="button" onClick={() => { setPick(i); setCardStatus("idle"); }} whileTap={{ scale: 0.9 }} animate={{ y: pick === i ? -6 : 0 }} aria-label={`${col.name}${col.fabric ? ` — ${col.fabric}` : ""}`}
                className={`w-9 h-9 md:w-12 md:h-12 rounded-[6px] shadow-[0_6px_12px_-4px_rgba(61,47,38,.5)] ring-offset-2 ring-offset-[#FBF8F2] transition-shadow ${pick === i ? "ring-2 ring-wine" : "ring-1 ring-black/10"}`}
                style={{ backgroundColor: col.hex, backgroundImage: col.name === "Scarab"
                  // elytra sheen over the dry-fit knit: gold-mint gloss top-left, a whisper of violet bottom-right
                  ? `radial-gradient(circle at 30% 26%, rgba(225,255,190,.5), transparent 50%), radial-gradient(circle at 70% 72%, rgba(110,70,190,.26), transparent 54%), ${WEAVE.poly.img}`
                  : weaveOf(col.fabric).img,
                  backgroundSize: col.name === "Scarab" ? `auto, auto, ${WEAVE.poly.size}` : weaveOf(col.fabric).size,
                  boxShadow: `${weaveOf(col.fabric).inset}, 0 6px 12px -4px rgba(61,47,38,.5)` }} />
            ))}
          </div>
          <p className="script text-wine text-script-sm mt-3.5">Being there with us is everything — these are wishes, not rules</p>
          <div className="mt-5"><button type="button" onClick={toggle}><FlipHint label="Need help? Tap to see what to avoid" /></button></div>
        </div>
        {/* BACK — compact and open, so its height no longer leaves a long blank hem on the front */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] paper-card deckle relative px-3 md:px-12 py-4 md:py-8 text-center flex flex-col justify-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="font-serif italic text-fine md:text-body text-taupe mb-1.5 max-w-xl mx-auto text-pretty">None of this is strict — your presence is the gift we’re dressing for, but…</p>
          <p className="micro text-wine">Kindly avoid</p>
          <p className="script text-wine text-script-sm mt-0.5">A little help</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 max-w-2xl mx-auto w-full text-left">
            {AVOID.map(([what, why], i) => (
              <motion.div key={what} initial={false} animate={flip ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} transition={{ delay: flip ? 0.5 + i * 0.05 : 0, duration: 0.4 }}
                className="flex items-center gap-2 py-0.5">
                <span className="w-4 h-4 md:w-6 md:h-6 shrink-0 rounded-full bg-wine text-lace grid place-items-center text-[9px] md:text-xs leading-none">✕</span>
                <span className="min-w-0 leading-tight"><span className="block font-serif text-[13px] md:text-body text-ink">{what}</span><span className="block font-serif italic text-[11px] md:text-fine text-taupe">{why}</span></span>
              </motion.div>
            ))}
          </div>
          {/* Fabric samples stay visible, but use a single compact row on phones. */}
          <p className="micro text-wine mt-3">Gentle fabric wishes — shine only, please</p>
          <div className="grid grid-cols-4 gap-1.5 md:gap-4 mt-1.5 max-w-2xl mx-auto w-full">
            {NO_FABRIC.map(([label, base, img], i) => (
              <motion.div key={label} initial={false} animate={flip ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ delay: flip ? 0.6 + i * 0.08 : 0, duration: 0.4 }}>
                <p className="font-serif italic text-[11px] md:text-fine text-taupe leading-tight mb-1 min-h-10">{label}</p>
                <div className="relative h-8 md:h-14 rounded-md border border-taupe/30 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,.25)]" style={{ backgroundColor: base, backgroundImage: img }}>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
                    <line x1="6" y1="8" x2="94" y2="92" stroke="#7A1F2B" strokeWidth="5" strokeLinecap="round" opacity=".85" />
                    <line x1="94" y1="8" x2="6" y2="92" stroke="#7A1F2B" strokeWidth="5" strokeLinecap="round" opacity=".85" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="font-serif italic text-[13px] md:text-body text-taupe mt-2 max-w-xl mx-auto text-pretty">Tulle, chiffon, crepe, mesh or matte cotton don’t catch the light — we’d lovingly steer you to something shinier.</p>
          <div className="mt-3"><button type="button" onClick={toggle}><FlipHint label="Back to the look" /></button></div>
        </div>
      </motion.div>
      <div className="mt-5 flex flex-col items-center text-center" aria-live="polite">
        <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={cardStatus === "working"} onClick={saveCard}
          aria-label="Download the what-to-wear card as a PNG image"
          className="micro tracking-[0.12em] bg-wine text-lace rounded-full px-7 py-3.5 shadow-[0_8px_20px_-6px_rgba(110,31,46,.48)] hover:bg-mocha transition-colors disabled:opacity-60">
          {cardStatus === "working" ? "Preparing your card…" : cardStatus === "done" ? "Attire card downloaded ✓" : cardStatus === "error" ? "Could not save · try again" : "Download what-to-wear card"}
        </motion.button>
        <p className="micro text-taupe/80 mt-2 tracking-[0.08em] text-balance">A handy image of the outfit ideas, guest palette and helpful reminders.</p>
      </div>
    </div>
  );
}
