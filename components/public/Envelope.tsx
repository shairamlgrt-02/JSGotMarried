"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/lib/hooks";
import type { WeddingInfo } from "@/lib/types";
import { EASE, Tilt } from "./fx";
import { OvalFrame } from "./ornaments";

/** The couple's portrait, baked into the site itself (a small WebP in /public) so it paints WITH the
 *  first frame — no waiting on the database, no empty frame. It still defers to love: a cover photo
 *  (or first gallery photo) saved in the binder simply takes over the frame once it arrives.
 *  Preloaded from <head> in app/layout.tsx, and rendered eager/high-priority below. */
export const BAKED_COVER = "/img/cover.webp";

export const fullDate = (iso: string) => {
  const p = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bahrain" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value;
  return `${g("month") === "11" && g("day") === "11" ? "11.11" : `${g("day")}.${g("month")}`}.${g("year")}`;
};
const weekday = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Asia/Bahrain" });
const timeWords = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bahrain" });

function Card({ info, sealed }: { info: WeddingInfo; sealed?: boolean }) {
  const cd = useCountdown(info.date);
  // binder photo when it has one, the gallery's lead photo otherwise, the baked portrait instantly
  const photo = info.cover_photo || info.gallery[0] || BAKED_COVER;
  const lace = "absolute z-[2] inset-x-0 h-[8cqw] bg-[url('/img/lacetrim.webp')] bg-repeat-x bg-[length:auto_100%] [filter:brightness(1.04)_sepia(.08)_drop-shadow(0_-1px_.5px_rgba(61,47,38,.35))_drop-shadow(0_-2px_3px_rgba(61,47,38,.12))] bg-center pointer-events-none";
  return (
    <div className="relative w-full h-full [filter:drop-shadow(0_2px_2px_rgba(61,47,38,.18))_drop-shadow(0_20px_26px_rgba(61,47,38,.24))]">
      <div className="paper-card deckle relative w-full h-full [container-type:inline-size] text-center flex flex-col items-center justify-center px-[6cqw] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.55),transparent_35%,transparent_70%,rgba(140,116,98,.12))] pointer-events-none" />
        {/* lace lying on the card */}
        <div aria-hidden className={`${lace} top-0`} style={{ transform: "scaleY(-1)" }} />
        <div aria-hidden className={`${lace} bottom-0`} />
        <OvalFrame className="w-[48cqw] relative mt-[2cqw]">
          <img src={photo} alt={`${info.groom} and ${info.bride}`} loading="eager" decoding="async" fetchPriority="high" className="w-full h-full object-cover" />
        </OvalFrame>
        <h1 className="relative font-serif font-medium text-ink text-[7cqw] mt-[2cqw] leading-none tracking-[0.12em] uppercase whitespace-nowrap">
          {info.groom} <span className="script normal-case tracking-normal text-wine text-[7.5cqw] mx-[0.4cqw]">&amp;</span> {info.bride}
        </h1>
        <p className="relative font-serif font-medium text-wine text-[7.6cqw] mt-[2.4cqw] leading-none tracking-[0.16em]">{fullDate(info.date)}</p>
        <p className="relative script text-mocha text-[7.6cqw] mt-[1.8cqw] leading-none">Save the Date</p>
        <p className="relative font-serif italic text-ink text-[max(3.9cqw,13px)] mt-[2.4cqw]">{weekday(info.date)} · {timeWords(info.date)}</p>
        <div className="relative flex gap-[5cqw] mt-[2.4cqw] font-serif text-ink">
          {([["Days", cd.days], ["Hours", cd.hours], ["Mins", cd.minutes], ["Secs", cd.seconds]] as const).map(([l, v]) => (
            <div key={l} className="flex flex-col items-center">
              <span className="text-[7.4cqw] font-medium leading-none tabular-nums">{cd.ready ? String(v).padStart(2, "0") : "--"}</span>
              <span className="uppercase tracking-[0.18em] text-[max(2.5cqw,10px)] font-semibold text-mocha mt-[1cqw]">{l}</span>
            </div>
          ))}
        </div>
        {!sealed && <p className="relative caps text-mocha font-semibold text-[max(2.8cqw,11px)] mt-[2.6cqw] mb-[3cqw]">{info.venue_name} · {info.venue_address.split(",")[0]}</p>}
      </div>
    </div>
  );
}

function Door({ side, open, A, onOpen }: { side: "l" | "r"; open: boolean; A: number; onOpen: () => void }) {
  return (
    <motion.div initial={false} animate={{ rotateY: open ? (side === "l" ? -A : A) : 0 }}
      transition={{ delay: 0.7, duration: 2.8, ease: [0.45, 0, 0.2, 1] }}
      style={{ transformOrigin: side === "l" ? "0% 50%" : "100% 50%" }}
      onClick={onOpen}
      className={`absolute top-0 bottom-0 w-1/2 z-[4] ${open ? "pointer-events-none" : "cursor-pointer"} ${side === "l" ? "left-0" : "right-0"}`}>
      <div className={`absolute inset-0 overflow-hidden bg-[#EDE3D4] ${side === "l" ? "rounded-l-[4px]" : "rounded-r-[4px]"} shadow-[0_2px_3px_rgba(61,47,38,.2),0_30px_50px_-25px_rgba(61,47,38,.55)]`}>
        <div className="absolute inset-0 bg-[url('/img/lace.webp')] bg-cover" style={{ backgroundPosition: side === "l" ? "left center" : "right center" }} />
        <div className={`absolute inset-0 ${side === "l" ? "bg-[linear-gradient(90deg,rgba(255,255,255,.18),transparent_60%,rgba(90,70,58,.14))]" : "bg-[linear-gradient(270deg,rgba(255,255,255,.18),transparent_60%,rgba(90,70,58,.14))]"}`} />
        <div className={`absolute inset-y-[4%] ${side === "l" ? "left-[7%] right-[4%]" : "right-[7%] left-[4%]"} border border-[#BCA994]/70`} />
        <motion.div initial={false} animate={{ opacity: open ? [0, 0.3, 0.18] : 0 }} transition={{ delay: 0.7, duration: 2.8, ease: "easeInOut" }} className="absolute inset-0 bg-[#3D2F26]" />
      </div>
      <div className={`absolute inset-y-0 w-px bg-[#A8927C]/60 ${side === "l" ? "right-0" : "left-0"}`} />
    </motion.div>
  );
}

const RATIO = 1.32; // portrait

/**
 * `home` is set on the routes reached from the front door (the preview, and any personal link):
 * the monogram takes you back to / and, while the invitation is still sealed, the right-hand slot
 * offers the code door instead of a jump to the reply card.
 */
export default function EnvelopeHero({ info, sealed, home = false }: { info: WeddingInfo; sealed?: boolean; home?: boolean }) {
  const [open, setOpen] = useState(false);
  const [dims, setDims] = useState({ W: 400, A: 150 });
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const W = Math.min(vw * 0.9, 500, (vh * 0.72) / RATIO);
      // open the doors as far as the screen allows so they stay visible beside the card
      const side = Math.max(0, (vw - W) / 2 - 8);
      const A = Math.max(100, Math.min(160, 180 - (Math.acos(Math.min(1, side / (W / 2))) * 180) / Math.PI));
      setDims({ W, A });
    };
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const { W, A } = dims;
  const H = W * RATIO;
  const T = (delay: number, duration: number) => ({ delay, duration, ease: EASE });

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-x-clip pt-20 pb-6">
      <nav className="absolute top-0 inset-x-0 flex justify-between items-center px-6 md:px-12 py-6 z-20">
        {home
          ? <a href="/" title="Back to the front door" className="script text-wine text-3xl hover:text-mocha transition-colors">J &amp; S</a>
          : <span className="script text-wine text-3xl">J &amp; S</span>}
        <div className="hidden md:flex gap-8 label text-taupe"><a href="#story">Our Story</a>{!sealed && <a href="#day">The Day</a>}{!sealed && <a href="#venue">Venue</a>}<a href="#dress">Attire</a></div>
        {!sealed ? (
          <a href="#rsvp" className="label text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">RSVP</a>
        ) : home ? (
          <a href="/rsvp" className="label text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">Have a code?</a>
        ) : null}
      </nav>

      <motion.div initial={false} animate={{ opacity: open ? 0 : 1, y: open ? -10 : 0 }} transition={T(0, 0.6)} className="absolute top-[9%] text-center z-10 px-6 pointer-events-none hidden md:block">
        <p className="label text-taupe">The Wedding of</p>
        <p className="script text-wine text-3xl md:text-6xl mt-1 [text-shadow:0_1px_0_rgba(255,255,255,.7)]">{info.groom} &amp; {info.bride}</p>
      </motion.div>

      <Tilt global max={6} glare={false} style={{ width: W, height: H }} className="">
        <div className="relative w-full h-full" style={{ perspective: 1600 }}>
          {/* ground shadow + inside of the folder */}
          <motion.div initial={false} className="absolute -inset-x-[8%] -bottom-[10%] h-[22%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(61,47,38,.32),transparent_70%)] blur-md" />
          <motion.div initial={false} className="absolute inset-0 z-0 rounded-[4px] overflow-hidden bg-[#E2D5C0] shadow-[0_2px_3px_rgba(61,47,38,.2)]">
            <div className="absolute inset-0 bg-[url('/img/damask.webp')] bg-[length:160%_auto] bg-center opacity-45" />
            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(61,47,38,.3)]" />
          </motion.div>

          {/* the card */}
          <motion.div initial={false} animate={{ y: open ? [0, -6, 0] : 0 }} transition={T(2.2, 1.6)} style={{ left: "4%", top: "4%", width: "92%", height: "92%" }} className="absolute z-[2]">
            <Card info={info} sealed={sealed} />
          </motion.div>

          <Door side="l" open={open} A={A} onOpen={() => setOpen(true)} />
          <Door side="r" open={open} A={A} onOpen={() => setOpen(true)} />

          {/* wax seal across the seam — tap to break */}
          <button type="button" onClick={() => setOpen(true)} disabled={open} aria-label="Break the seal to open the invitation"
            className="absolute z-[6] left-1/2 top-1/2 w-[26%] max-w-[124px] aspect-square -translate-x-1/2 -translate-y-1/2 cursor-pointer disabled:cursor-default group">
            {!open && (
              <>
                <span aria-hidden className="absolute inset-[6%] rounded-full border-2 border-wine/35 scale-[1.2]" />
                <span aria-hidden className="absolute inset-[6%] rounded-full border border-wine/20 scale-[1.42]" />
              </>
            )}
            {(["l", "r"] as const).map((side) => (
              <motion.img key={side} src="/img/seal.webp" alt="" aria-hidden draggable={false}
                initial={false}
                animate={open ? { x: side === "l" ? -42 : 42, y: 80, rotate: side === "l" ? -26 : 30, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                transition={{ x: T(0.1, 1.1), y: T(0.2, 1.2), rotate: T(0.1, 1.1), opacity: T(0.7, 0.6) }}
                style={{ clipPath: side === "l" ? "polygon(0 0, 52% 0, 46% 22%, 55% 40%, 45% 58%, 54% 78%, 48% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 54% 78%, 45% 58%, 55% 40%, 46% 22%)" }}
                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(61,47,38,.45)] transition-[filter] group-hover:brightness-110" />
            ))}
          </button>
        </div>
      </Tilt>

      {/* instruction under the folder: tap the seal → then scroll to RSVP */}
      <div className="relative h-20 mt-5 w-full flex justify-center">
        <motion.div initial={false} animate={{ opacity: open ? 0 : 1 }} transition={T(0, 0.4)} className={`absolute flex flex-col items-center gap-1 ${open ? "pointer-events-none" : ""}`}>
          <span className="text-2xl text-wine leading-none">↑</span>
          <span className="micro text-wine bg-[#FBF8F2]/90 rounded-full px-5 py-2 shadow-[0_2px_10px_rgba(61,47,38,.12)]">Tap the seal to open</span>
        </motion.div>
        <motion.a href={sealed ? (home ? "/rsvp" : "#story") : "#rsvp"} initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 10 }} transition={T(open ? 3.6 : 0, 0.8)}
          className={`absolute flex flex-col items-center gap-1 text-wine ${open ? "" : "pointer-events-none"}`}>
          <span className="micro bg-[#FBF8F2]/90 rounded-full px-5 py-2 shadow-[0_2px_10px_rgba(61,47,38,.12)]">{sealed ? (home ? "Got your code? Unlock your RSVP" : "Scroll to explore") : "Scroll to RSVP"}</span>
          <svg viewBox="0 0 24 36" className="w-5 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M12 2v28M5 23l7 8 7-8" />
          </svg>
        </motion.a>
      </div>
    </section>
  );
}
