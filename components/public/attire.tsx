"use client";
import { motion, useAnimationControls, useReducedMotion, type Transition } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Attire } from "@/lib/types";
import { downloadAttireCard } from "@/lib/attire-card";
import { MEN_STYLES, WOMEN_STYLES, defaultFigureHexes, shadeFamily, type AttireSwatch, type FigureStyle } from "@/lib/attire-art";
import { EASE, EASE_OUT } from "./fx";
import { FlipHint, useFlip } from "./stickers";

/**
 * Watercolour cut-out + masked swatch tint + a separate light pass to keep the cloth dimensional.
 * `tap` counts how many shades the guest has pressed: every press settles the cloth onto the figure
 * once more (a short press-down, no bounce) and sends a single sweep of light across it, so the
 * change of colour is something you *see happen* rather than a silent swap.
 */
function TinFigure({ style, color, tap, className = "" }: { style: FigureStyle; color: string; tap: number; className?: string }) {
  const mask = `url(${style.mask})`;
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: mask, maskImage: mask,
    WebkitMaskSize: "100% 100%", maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
  };
  const settle = useAnimationControls();
  useEffect(() => {
    if (tap > 0) settle.start({ scale: [1.05, 1], transition: { duration: 0.7, ease: EASE_OUT } });
  }, [tap, settle]);
  return (
    <motion.div role="img" aria-label={style.label} title={style.label} animate={settle} className={`relative inline-block ${className}`}>
      <img src={style.src} alt="" className="h-full w-auto pointer-events-none select-none" draggable={false} />
      <motion.div initial={false} animate={{ backgroundColor: color }} transition={{ duration: 0.8, ease: EASE }}
        className="absolute inset-0 pointer-events-none"
        style={{ ...maskStyle, mixBlendMode: style.blendMode ?? "multiply" }} />
      {/* the light sweep that answers a tap — clipped to the garment, so only the cloth shimmers */}
      {tap > 0 && (
        <span key={tap} aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={maskStyle}>
          <motion.span initial={{ x: "-70%" }} animate={{ x: "170%" }} transition={{ duration: 1, ease: EASE }}
            className="absolute inset-y-0 w-[55%] block"
            style={{ background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.42) 42%, rgba(255,255,255,.7) 55%, rgba(255,255,255,0) 100%)", mixBlendMode: "screen" }} />
        </span>
      )}
      {style.highlights && <img src={style.highlights} alt="" draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none select-none" />}
    </motion.div>
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

/** One cycle of the hint: the finger presses the little swatch, the ring answers, then it rests. */
const TAP_LOOP: Transition = { duration: 2.4, times: [0, 0.16, 0.4, 1], repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" };

/**
 * The tap-to-try-on nudge that sits right above the swatches: a finger presses a paint chip and a
 * ring answers — so “tap a shade and all six change” is shown, not just written down.
 */
function TapHint({ label }: { label: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-2.5 bg-wine text-lace rounded-full pl-3.5 pr-5 py-2 shadow-[0_6px_14px_-4px_rgba(110,31,46,.6)]">
      <span aria-hidden className="relative inline-grid place-items-center w-7 h-7 shrink-0">
        <motion.span className="absolute inset-0 rounded-[8px] ring-1 ring-lace/40"
          style={{ background: "linear-gradient(135deg, #9AA62C, #0A5C33 55%, #452A18)" }}
          animate={reduce ? undefined : { scale: [1, 0.84, 1, 1] }} transition={TAP_LOOP} />
        <motion.span className="absolute -inset-1 rounded-[11px] border-2 border-lace/70"
          animate={reduce ? undefined : { opacity: [0, 0, 0.8, 0], scale: [0.7, 0.7, 1.3, 1.45] }} transition={TAP_LOOP} />
        <motion.span className="absolute -top-2.5 text-[15px] leading-none"
          animate={reduce ? undefined : { y: [-9, 3, -9, -9], opacity: [0, 1, 1, 0] }} transition={TAP_LOOP}>👆</motion.span>
      </span>
      <span className="micro text-left text-balance">{label}</span>
    </span>
  );
}

/** A paint chip: idle ones invite a tap, the chosen one lifts, and every press (0 = never pressed) sends out one ring. */
function SwatchTile({ swatch, index, active, pressed, onPick }: { swatch: AttireSwatch; index: number; active: boolean; pressed: number; onPick: () => void }) {
  const weave = weaveOf(swatch.fabric);
  // “Scarab” keeps its elytra sheen: gold-mint gloss top-left, a whisper of violet bottom-right.
  const scarab = /^scarab$/i.test(swatch.name);
  const backgroundImage = scarab
    ? `radial-gradient(circle at 30% 26%, rgba(225,255,190,.5), transparent 50%), radial-gradient(circle at 70% 72%, rgba(110,70,190,.26), transparent 54%), ${WEAVE.poly.img}`
    : weave.img;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.55 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-6%" }}
      transition={{ delay: (index % 6) * 0.06 + Math.floor(index / 6) * 0.14, duration: 0.45, ease: EASE_OUT }}>
      <motion.button type="button" onClick={onPick} whileTap={{ scale: 0.88 }} animate={{ y: active ? -6 : 0 }} aria-pressed={active}
        aria-label={`${swatch.name}${swatch.fabric ? ` — ${swatch.fabric}` : ""}. Tap to dress all six looks in this shade.`}
        className={`relative block w-9 h-9 md:w-12 md:h-12 rounded-[6px] ring-offset-2 ring-offset-[#FBF8F2] transition-shadow ${active ? "ring-2 ring-wine" : "ring-1 ring-black/10"}`}
        style={{ backgroundColor: swatch.hex, backgroundImage, backgroundSize: scarab ? `auto, auto, ${WEAVE.poly.size}` : weave.size, boxShadow: `${weave.inset}, 0 6px 12px -4px rgba(61,47,38,.5)` }}>
        {pressed > 0 && (
          <motion.span key={pressed} aria-hidden initial={{ opacity: 0.75, scale: 0.7 }} animate={{ opacity: 0, scale: 2 }} transition={{ duration: 0.7, ease: EASE_OUT }}
            className="absolute inset-0 rounded-[8px] ring-2 ring-wine pointer-events-none" />
        )}
      </motion.button>
    </motion.div>
  );
}

/** Black-tie attire guide: opens on six of the couple's shades (three greens, three browns), tap any swatch to try it on, flip for what to avoid. */
export function AttireGuide({ guests, couple, date, reserved = [] }: { guests?: Attire; couple: string; date: string; reserved?: Attire[] }) {
  const colors: AttireSwatch[] = useMemo(
    () => (guests?.colors?.length ? (guests.colors as AttireSwatch[]) : [{ name: "Emerald", hex: "#0A5C33" }]),
    [guests?.colors],
  );
  /** The opening look: six different shades — never one — so the theme can't read as a single colour. */
  const mix = useMemo(() => defaultFigureHexes(colors), [colors]);
  /** The chips, family by family and labelled — so the two halves of the theme are visible at a glance. */
  const paletteRows = useMemo(() => {
    const families: [string, ReturnType<typeof shadeFamily>][] = [["Glossy greens", "green"], ["Shining browns", "brown"], ["More from our palette", "other"]];
    return families.flatMap(([label, family]) => {
      const items = colors.map((swatch, index) => ({ swatch, index })).filter(({ swatch }) => shadeFamily(swatch.hex) === family);
      return items.length ? [{ label: `${label} · ${items.length}`, items }] : [];
    });
  }, [colors]);
  const [pick, setPick] = useState<number | null>(null);
  const [tap, setTap] = useState(0);
  const [cardStatus, setCardStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const reduce = useReducedMotion();
  const { flip, toggle } = useFlip();
  const tried = pick !== null;
  const c = colors[Math.min(pick ?? 0, colors.length - 1)];
  const looks = tried ? Array(6).fill(c.hex) : mix;
  const caption = tried ? `All six in ${c.name}` : "A mix of our six shades";
  const mixStripes = `linear-gradient(90deg, ${Array.from({ length: 6 }, (_, i) => `${mix[i]} ${i * (100 / 6)}% ${(i + 1) * (100 / 6)}%`).join(", ")})`;
  const choose = (index: number) => { setPick(index); setTap((t) => t + 1); setCardStatus("idle"); };
  const backToMix = () => { setPick(null); setTap((t) => t + 1); setCardStatus("idle"); };
  const saveCard = async () => {
    if (cardStatus === "working") return;
    setCardStatus("working");
    const saved = await downloadAttireCard({ couple, date, colors, reserved });
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
          <div className="grid grid-cols-6 gap-0.5 md:gap-2 mt-4 max-w-2xl mx-auto w-full">
            <p className="col-span-3 micro text-taupe">Men</p>
            <p className="col-span-3 micro text-taupe">Women</p>
          </div>
          <div className="grid grid-cols-6 items-end gap-0.5 md:gap-2 max-w-2xl mx-auto w-full">
            {[...MEN_STYLES, ...WOMEN_STYLES].map((style, index) => (
              <div key={style.label} className={`min-w-0 flex items-end justify-center ${index === MEN_STYLES.length ? "border-l border-taupe/20 pl-0.5 md:pl-2" : ""}`}>
                <TinFigure style={style} color={looks[index] ?? mix[index]} tap={tap} className="h-[clamp(5.75rem,28vw,8rem)] md:h-44 max-w-full" />
              </div>
            ))}
          </div>
          <p className="script text-wine text-script-sm mt-3.5 h-[1.25em]" aria-live="polite">
            <motion.span key={caption} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_OUT }} className="inline-block">
              {caption}
            </motion.span>
          </p>
          <div className="mt-3.5"><TapHint label={tried ? "Tap another shade to re-dress all six" : "Tap a shade to try it on all six"} /></div>
          <div className="relative mt-3 md:mt-4 max-w-2xl mx-auto w-full">
            {/* while nobody has tried a shade on, a slow sheen travels over the palette */}
            {!tried && !reduce && (
              <motion.span aria-hidden className="absolute -inset-y-2 inset-x-0 z-[2] pointer-events-none overflow-hidden rounded-[10px]"
                animate={{ opacity: [0, 0.75, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }}>
                <motion.span className="absolute inset-y-0 w-1/3 block bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent)]"
                  animate={{ x: ["-110%", "310%"] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }} />
              </motion.span>
            )}
            <div className="flex flex-col gap-2.5">
              {paletteRows.map((row) => (
                <div key={row.label}>
                  <p className="micro text-taupe/85 text-left mb-1">{row.label}</p>
                  <div className="grid grid-cols-6 gap-1.5 md:gap-3 justify-items-center">
                    {row.items.map(({ swatch, index }) => (
                      <SwatchTile key={`${swatch.name}-${index}`} swatch={swatch} index={index} active={pick === index} pressed={pick === index ? tap : 0} onPick={() => choose(index)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {tried && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <button type="button" onClick={backToMix} className="inline-flex items-center gap-2 rounded-full px-2 py-1 -mx-1 hover:bg-oat/40 transition-colors">
                <span aria-hidden className="h-4 w-7 rounded-[4px] ring-1 ring-black/10 shadow-[0_2px_4px_rgba(61,47,38,.35)]" style={{ backgroundImage: mixStripes }} />
                <span className="micro text-wine underline decoration-wine/30 underline-offset-4">Back to the six-shade mix</span>
              </button>
            </div>
          )}
          <p className="micro text-taupe/85 mt-2.5">Shine welcome — satin, velvet, silk, fine suit wool, liquid poly</p>
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
