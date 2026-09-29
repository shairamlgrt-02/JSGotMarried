"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { WeddingInfo } from "@/lib/types";
import { EASE, Tilt } from "./fx";
import { Paisley } from "./ornaments";

/**
 * Photo slots (fill them in the binder → Content → Gallery, in this order):
 *  1–4  photo strip in "Our Story"
 *  5–8  photo strip beside the attire section
 *  9–12 polaroids pinned to the sides of the letter
 *  13+  the "Moments" polaroid cluster near the end
 */
export const slots = (info: WeddingInfo, from: number, n: number) =>
  Array.from({ length: n }, (_, i) => info.gallery[from + i] || "");

/** Sepia placeholder that reads as part of the design until a real photo is added. */
function Slot({ src, className = "" }: { src: string; className?: string }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className={`w-full h-full object-cover [filter:sepia(.12)_saturate(.92)_contrast(1.02)] ${className}`} />
  ) : (
    <div className={`w-full h-full bg-[linear-gradient(145deg,#E9DFD1,#D9CBB8)] grid place-items-center ${className}`}>
      <Paisley className="w-5 h-8 text-taupe/45" />
    </div>
  );
}

/** Translucent washi tape. */
function Tape({ className = "", rotate = -4 }: { className?: string; rotate?: number }) {
  return (
    <span aria-hidden style={{ rotate: `${rotate}deg` }}
      className={`absolute z-10 h-6 w-20 bg-[#EFE4D2]/75 shadow-[0_1px_2px_rgba(61,47,38,.18)] [clip-path:polygon(3%_0,97%_4%,100%_50%,97%_96%,3%_100%,0_50%)] ${className}`} />
  );
}

/** Classic photobooth strip — part of the letter's design. */
export function PhotoStrip({ photos, caption, horizontal = false, rotate = -3, className = "" }: { photos: string[]; caption: string; horizontal?: boolean; rotate?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40, rotate: rotate * 2 }} whileInView={{ opacity: 1, y: 0, rotate }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.2, ease: EASE }} className={`relative ${className}`}>
      <Tilt max={8} className="relative">
        <Tape className="-top-3 left-1/2 -translate-x-1/2" rotate={rotate > 0 ? -5 : 4} />
        <div className={`relative bg-[#FBF8F2] p-[5%] shadow-[0_1px_2px_rgba(61,47,38,.2),0_18px_30px_-12px_rgba(61,47,38,.45)] ${horizontal ? "p-[1.6%]" : ""}`}>
          <div className={horizontal ? "grid grid-cols-4 gap-[1.6%]" : "flex flex-col gap-[4%]"}>
            {photos.map((src, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden shadow-[inset_0_0_0_1px_rgba(61,47,38,.08)]"><Slot src={src} /></div>
            ))}
          </div>
          <p className={`text-center font-serif text-mocha tracking-[0.2em] ${horizontal ? "text-xs md:text-sm mt-2" : "text-[11px] md:text-xs mt-3"}`}>{caption}</p>
        </div>
      </Tilt>
    </motion.div>
  );
}

/** A single polaroid. */
export function Polaroid({ src, caption, rotate = 0, className = "" }: { src: string; caption?: string; rotate?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-5%" }} transition={{ duration: 1, ease: EASE }}
      whileHover={{ rotate: 0, scale: 1.05, zIndex: 30 }} style={{ rotate }} className={`relative ${className}`}>
      <Tape className="-top-3 left-1/2 -translate-x-1/2" rotate={-rotate * 1.5} />
      <div className="bg-[#FCFAF6] p-[7%] pb-0 shadow-[0_1px_2px_rgba(61,47,38,.2),0_14px_24px_-10px_rgba(61,47,38,.45)]">
        <div className="aspect-square overflow-hidden"><Slot src={src} /></div>
        <div className="h-12 md:h-14 flex items-center justify-center">
          {caption && <p className="script text-wine text-2xl md:text-3xl leading-none translate-y-[2px]">{caption}</p>}
        </div>
      </div>
    </motion.div>
  );
}

/** Polaroids pinned along the edges of the letter (large screens, where there is room beside the text). */
export function SidePolaroids({ info }: { info: WeddingInfo }) {
  const ph = slots(info, 8, 4);
  const spots = [
    { top: "17%", side: "left", rot: -7, cap: "us" },
    { top: "36%", side: "right", rot: 6, cap: "11.11" },
    { top: "58%", side: "left", rot: 5, cap: "always" },
    { top: "79%", side: "right", rot: -6, cap: "forever" },
  ] as const;
  return (
    <div aria-hidden className="hidden xl:block absolute inset-0 pointer-events-none z-[8]">
      {spots.map((s, i) => (
        <div key={i} className="absolute w-44 pointer-events-auto" style={{ top: s.top, [s.side]: "-7.5rem" }}>
          <Polaroid src={ph[i]} caption={s.cap} rotate={s.rot} />
        </div>
      ))}
    </div>
  );
}

/** Scattered polaroid cluster near the end of the letter (only when there are extra photos). */
export function Moments({ info }: { info: WeddingInfo }) {
  const extra = info.gallery.slice(12);
  if (!extra.length) return null;
  const rots = [-5, 3, -2, 6, -4, 2];
  return (
    <section className="px-6 md:px-16 py-16">
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-4xl mx-auto">
        {extra.map((src, i) => <Polaroid key={i} src={src} rotate={rots[i % rots.length]} className="w-[42%] md:w-56" />)}
      </div>
    </section>
  );
}

/** Floating music toggle — appears once a song is added in the binder. */
export function MusicButton({ src }: { src?: string }) {
  const a = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => { if (a.current) a.current.volume = 0.45; }, [src]);
  if (!src) return null;
  const toggle = () => { const el = a.current; if (!el) return; if (el.paused) { el.play().then(() => setOn(true)).catch(() => {}); } else { el.pause(); setOn(false); } };
  return (
    <>
      <audio ref={a} src={src} loop preload="none" />
      <button onClick={toggle} aria-label={on ? "Pause music" : "Play music"}
        className="fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full bg-[#FBF8F2]/90 backdrop-blur border border-wine/30 text-wine shadow-[0_6px_18px_rgba(61,47,38,.25)] grid place-items-center">
        {on ? (
          <span className="flex items-end gap-[3px] h-4">{[0, 1, 2].map((i) => <motion.span key={i} className="w-[3px] bg-wine rounded" animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }} transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }} />)}</span>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="7" cy="18" r="2.4" /><circle cx="17" cy="16" r="2.4" /></svg>
        )}
      </button>
    </>
  );
}
