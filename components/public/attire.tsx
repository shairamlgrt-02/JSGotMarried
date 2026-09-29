"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Attire } from "@/lib/types";
import { EASE } from "./fx";
import { FlipHint, useFlip } from "./stickers";

const INK = "#33271F";
const line = { stroke: INK, strokeWidth: 1.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Fashion-illustration woman in a floor-length column gown. `color` fills the gown. */
export function SketchWoman({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 140 420" className={className} fill="none">
      <defs>
        <linearGradient id="gown-sheen" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".05" /><stop offset=".38" stopColor="#fff" stopOpacity=".28" /><stop offset=".55" stopColor="#fff" stopOpacity=".04" /><stop offset="1" stopColor="#000" stopOpacity=".18" /></linearGradient>
      </defs>
      {/* arms (behind the gown) */}
      <path {...line} d="M63 61 C57 62 51 64 49 70 C46 86 47 106 49 124 C50 140 51 156 52 168 C52 173 55 175 56 170 C56 158 56 142 56 126 C56 110 56 96 57 84" />
      <path {...line} d="M77 61 C83 62 89 64 91 70 C94 86 93 106 91 124 C90 140 89 156 88 168 C88 173 85 175 84 170 C84 158 84 142 84 126 C84 110 84 96 83 84" />
      {/* neck + head + sleek hair with low bun */}
      <path {...line} d="M66 52 L65 62 M74 52 L75 62" />
      <ellipse {...line} cx="70" cy="40" rx="10.5" ry="13" />
      <path {...line} fill={INK} fillOpacity=".85" d="M59.5 41 C58 27 64 24 70 24 C77 24 82.5 28 80.5 41 C79 33 75 29.5 70 29.5 C65 29.5 61 33 59.5 41 Z" />
      <circle {...line} cx="81.5" cy="47" r="4.5" fill={INK} fillOpacity=".85" />
      {/* the gown */}
      <motion.path {...line} initial={false} animate={{ fill: color }} transition={{ duration: 0.7, ease: EASE }}
        d="M57 74 C63 71 77 71 83 74 C82 92 80 108 80 122 C83 136 86 150 85 162 C86 220 88 320 92 398 C80 403 60 403 48 398 C52 320 54 220 55 162 C54 150 57 136 60 122 C60 108 58 92 57 74 Z" />
      <path d="M57 74 C63 71 77 71 83 74 C82 92 80 108 80 122 C83 136 86 150 85 162 C86 220 88 320 92 398 C80 403 60 403 48 398 C52 320 54 220 55 162 C54 150 57 136 60 122 C60 108 58 92 57 74 Z" fill="url(#gown-sheen)" />
      {/* straps, waist seam, drape folds */}
      <path {...line} d="M60 73 L65 62 M80 73 L75 62" />
      <path {...line} strokeWidth=".7" opacity=".55" d="M60 122 C66 125 74 125 80 122 M66 170 C64 250 62 330 60 400 M75 168 C77 250 79 330 81 400 M70 180 C70 260 70 330 70 402" />
      {/* shoe tips */}
      <path {...line} d="M60 402 C62 406 67 406 68 402 M73 402 C74 406 79 406 81 402" />
    </svg>
  );
}

/** Fashion-illustration man in a tuxedo / dark suit. `color` fills jacket + trousers. */
export function SketchMan({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 140 420" className={className} fill="none">
      <defs>
        <linearGradient id="suit-sheen" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".04" /><stop offset=".4" stopColor="#fff" stopOpacity=".2" /><stop offset="1" stopColor="#000" stopOpacity=".2" /></linearGradient>
      </defs>
      {/* trousers */}
      <motion.path {...line} initial={false} animate={{ fill: color }} transition={{ duration: 0.7, ease: EASE }}
        d="M51 172 L89 172 C89 250 88 330 87 398 L73 398 C72 330 71 260 70 214 C69 260 68 330 67 398 L53 398 C52 330 51 250 51 172 Z" />
      <path {...line} strokeWidth=".6" opacity=".5" d="M60 190 L60 396 M80 190 L80 396" />
      {/* shoes */}
      <path {...line} fill={INK} d="M52 398 L67 398 C68 404 64 406 58 406 C52 406 50 403 52 398 Z M73 398 L88 398 C90 403 88 406 82 406 C76 406 72 404 73 398 Z" />
      {/* sleeves */}
      <motion.path {...line} initial={false} animate={{ fill: color }} transition={{ duration: 0.7, ease: EASE }}
        d="M50 68 C44 70 41 76 41 86 C40 118 40 150 42 180 L51 180 C51 150 52 118 53 92 Z M90 68 C96 70 99 76 99 86 C100 118 100 150 98 180 L89 180 C89 150 88 118 87 92 Z" />
      {/* hands */}
      <path {...line} d="M42.5 181 C42 188 45 192 47 192 C50 192 51 187 50.5 181 M97.5 181 C98 188 95 192 93 192 C90 192 89 187 89.5 181" />
      {/* jacket body */}
      <motion.path {...line} initial={false} animate={{ fill: color }} transition={{ duration: 0.7, ease: EASE }}
        d="M64 60 L52 65 C49 68 48 74 49 84 C49 118 49 150 49 178 L91 178 C91 150 91 118 91 84 C92 74 91 68 88 65 L76 60 Z" />
      <path d="M64 60 L52 65 C49 68 48 74 49 84 C49 118 49 150 49 178 L91 178 C91 150 91 118 91 84 C92 74 91 68 88 65 L76 60 Z M50 68 C44 70 41 76 41 86 C40 118 40 150 42 180 L51 180 C51 150 52 118 53 92 Z M90 68 C96 70 99 76 99 86 C100 118 100 150 98 180 L89 180 C89 150 88 118 87 92 Z" fill="url(#suit-sheen)" />
      {/* shirt + satin lapels + bow tie */}
      <path {...line} fill="#FBF8F2" d="M64 60 L70 112 L76 60 Z" />
      <path {...line} fill="#fff" fillOpacity=".18" d="M64 60 L58 70 L63 86 L60 92 L70 116 Z M76 60 L82 70 L77 86 L80 92 L70 116 Z" />
      <path {...line} fill={INK} d="M70 67 L63 63.5 L63 70.5 Z M70 67 L77 63.5 L77 70.5 Z" />
      <circle cx="70" cy="67" r="1.4" fill={INK} />
      <circle cx="70" cy="80" r=".9" fill={INK} /><circle cx="70" cy="92" r=".9" fill={INK} />
      <circle {...line} cx="70" cy="128" r="1.6" fill={INK} />
      <path {...line} strokeWidth=".7" opacity=".6" d="M56 140 L64 140 M52 100 L58 100" />
      {/* neck + head + hair */}
      <path {...line} d="M66 52 L65.5 60 M74 52 L74.5 60" />
      <ellipse {...line} cx="70" cy="40" rx="10.5" ry="13" fill="#FBF8F2" />
      <path {...line} fill={INK} fillOpacity=".85" d="M59.5 38 C58 26 63 23 70 23 C78 23 83 26 80.5 38 C79 32 76 30 70 30.5 C65 31 61 33 59.5 38 Z" />
    </svg>
  );
}

const AVOID = [
  ["Black", "reserved for the groom"], ["White & ivory", "reserved for the bride"], ["Burgundy & teal", "reserved for our families"],
  ["Pastels", "save them for brunch"], ["Jeans & casual wear", "it's a black-tie night"], ["Mini skirts", "floor-length, please"],
  ["Ball gowns & long trains", "keep it sleek & slim"], ["Sneakers & sandals", "dress shoes only"],
] as const;

/** Black-tie attire guide: tap a colour and both sketches change; flip for what to avoid. */
export function AttireGuide({ guests }: { guests?: Attire }) {
  const colors = guests?.colors?.length ? guests.colors : [{ name: "Olive", hex: "#5B5B2E" }];
  const [pick, setPick] = useState(0);
  const c = colors[Math.min(pick, colors.length - 1)];
  const { flip, toggle, peek } = useFlip();
  return (
    <div className="max-w-4xl mx-auto mt-12 [perspective:1800px]">
      <motion.div animate={flip ? { rotateY: 180 } : { rotateY: 0, ...peek }} transition={flip ? { duration: 1, ease: EASE } : { duration: 1.4, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}
        className="grid [transform-style:preserve-3d]">
        {/* FRONT — the look */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] paper-card deckle relative px-5 md:px-12 py-10 md:py-12 text-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="label text-wine font-semibold">Black tie · in earth tones</p>
          <p className="font-serif italic text-mocha text-lg md:text-xl mt-2 max-w-xl mx-auto">Floor-length column, sheath or slim A-line gowns · tuxedos or dark suits with a tie.</p>
          <div className="flex justify-center items-end gap-2 md:gap-10 mt-6">
            <div><SketchWoman color={c.hex} className="w-32 md:w-44 h-auto" /><p className="label text-taupe !text-[10px] mt-1">Column gown</p></div>
            <div><SketchMan color={c.hex} className="w-32 md:w-44 h-auto" /><p className="label text-taupe !text-[10px] mt-1">Tuxedo / dark suit</p></div>
          </div>
          <p className="script text-wine text-4xl mt-4 h-10">{c.name}</p>
          <p className="label text-taupe mt-2 mb-4">Tap a colour to try it on</p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {colors.map((col, i) => (
              <motion.button key={col.name} type="button" onClick={() => setPick(i)} whileTap={{ scale: 0.9 }} animate={{ y: pick === i ? -6 : 0 }} aria-label={col.name}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full shadow-[0_6px_12px_-4px_rgba(61,47,38,.5)] ring-offset-2 ring-offset-[#FBF8F2] transition-shadow ${pick === i ? "ring-2 ring-wine" : "ring-1 ring-black/10"}`}
                style={{ backgroundColor: col.hex, backgroundImage: "linear-gradient(135deg,rgba(255,255,255,.25),transparent 55%)" }} />
            ))}
          </div>
          <div className="mt-8"><button type="button" onClick={toggle}><FlipHint label="Need help? What to avoid" /></button></div>
        </div>
        {/* BACK — kindly avoid */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] paper-card deckle relative px-5 md:px-12 py-10 md:py-12 text-center shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_50px_-28px_rgba(61,47,38,.55)]">
          <p className="label text-wine font-semibold">Kindly avoid</p>
          <p className="script text-wine text-5xl mt-1">A little help</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 max-w-2xl mx-auto text-left">
            {AVOID.map(([what, why], i) => (
              <motion.div key={what} initial={false} animate={flip ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} transition={{ delay: flip ? 0.5 + i * 0.06 : 0, duration: 0.4 }}
                className="flex items-center gap-3 bg-[#FBF6EE] border border-taupe/25 rounded-full pl-2 pr-4 py-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-wine text-lace grid place-items-center text-sm">✕</span>
                <span className="leading-tight"><span className="block font-serif text-lg text-ink">{what}</span><span className="block font-serif italic text-sm text-taupe">{why}</span></span>
              </motion.div>
            ))}
          </div>
          <div className="mt-8"><button type="button" onClick={toggle}><FlipHint label="Back to the look" /></button></div>
        </div>
      </motion.div>
    </div>
  );
}
