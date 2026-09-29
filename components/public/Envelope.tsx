"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/lib/hooks";
import type { WeddingInfo } from "@/lib/types";
import { EASE, Tilt } from "./fx";
import { OvalFrame, Paisley } from "./ornaments";

export const fullDate = (iso: string) => {
  const p = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bahrain" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value;
  return `${g("month") === "11" && g("day") === "11" ? "11.11" : `${g("day")}.${g("month")}`}.${g("year")}`;
};
const weekday = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Asia/Bahrain" });
const timeWords = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bahrain" });

function Card({ info }: { info: WeddingInfo }) {
  const cd = useCountdown(info.date);
  const photo = info.cover_photo || info.gallery[0] || "";
  return (
    <div className="relative w-full h-full [filter:drop-shadow(0_2px_2px_rgba(61,47,38,.18))_drop-shadow(0_24px_30px_rgba(61,47,38,.28))]">
      {/* lace peeking out from behind the card */}
      <div aria-hidden className="absolute -inset-x-[3%] -bottom-[3.2%] h-[9%] bg-[url('/img/lacetrim.webp')] bg-[length:auto_100%] bg-repeat-x opacity-90" />
      <div aria-hidden className="absolute -inset-x-[3%] -top-[3.2%] h-[9%] bg-[url('/img/lacetrim.webp')] bg-[length:auto_100%] bg-repeat-x opacity-90 rotate-180" />
      <div className="paper-card deckle relative w-full h-full [container-type:inline-size] text-center flex flex-col items-center justify-center px-[7cqw] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.55),transparent_35%,transparent_70%,rgba(140,116,98,.12))] pointer-events-none" />
        <OvalFrame className="w-[50cqw] relative">
          {photo ? <img src={photo} alt={`${info.groom} and ${info.bride}`} className="w-full h-full object-cover" /> : (
            <div className="w-full h-full bg-[linear-gradient(160deg,#EFE7DB,#DDD0BE)] flex flex-col items-center justify-center text-taupe">
              <Paisley className="w-[5cqw] h-[8cqw] opacity-50" />
              <span className="font-serif italic mt-[1.5cqw] text-[2.6cqw]">our photo</span>
            </div>
          )}
        </OvalFrame>
        <h1 className="relative font-serif text-mocha text-[6.2cqw] mt-[2cqw] leading-none tracking-[0.14em] uppercase whitespace-nowrap">
          {info.groom} <span className="script normal-case tracking-normal text-wine text-[6.4cqw] mx-[0.6cqw]">&amp;</span> {info.bride}
        </h1>
        <p className="relative font-serif text-wine text-[6cqw] mt-[2.2cqw] leading-none tracking-[0.2em]">{fullDate(info.date)}</p>
        <p className="relative script text-taupe text-[6.4cqw] mt-[1.8cqw] leading-none">Save the Date</p>
        <p className="relative font-serif italic text-mocha text-[2.8cqw] mt-[2.6cqw]">{weekday(info.date)} · {timeWords(info.date)}</p>
        <div className="relative flex gap-[4cqw] mt-[2cqw] font-serif text-mocha">
          {([["Days", cd.days], ["Hours", cd.hours], ["Minutes", cd.minutes], ["Seconds", cd.seconds]] as const).map(([l, v]) => (
            <div key={l} className="flex flex-col items-center">
              <span className="text-[4.4cqw] leading-none tabular-nums">{cd.ready ? String(v).padStart(2, "0") : "--"}</span>
              <span className="uppercase tracking-[0.22em] text-[1.5cqw] text-taupe mt-[0.8cqw]">{l}</span>
            </div>
          ))}
        </div>
        <p className="relative caps text-taupe text-[1.9cqw] mt-[2.4cqw]">{info.venue_name} · {info.venue_address.split(",")[0]}</p>
      </div>
    </div>
  );
}

const RATIO = 1.32; // portrait

export default function EnvelopeHero({ info }: { info: WeddingInfo }) {
  const [open, setOpen] = useState(false);
  const [dims, setDims] = useState({ W: 400, S: 1.2 });
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const W = Math.min(vw * 0.84, 460, (vh * 0.64) / RATIO);
      const cardW = W * 0.92, cardH = W * RATIO * 0.92;
      const S = Math.min(1.4, (vw * 0.94) / cardW, (vh * 0.78) / cardH);
      setDims({ W, S: Math.max(1, S) });
    };
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const { W, S } = dims;
  const H = W * RATIO;
  const T = (delay: number, duration: number) => ({ delay, duration, ease: EASE });

  const Door = ({ side }: { side: "l" | "r" }) => (
    <motion.div initial={false} animate={open ? { rotateY: side === "l" ? -158 : 158, opacity: 0 } : { rotateY: 0, opacity: 1 }}
      transition={{ rotateY: T(0.45, 1.5), opacity: T(1.9, 0.7) }}
      style={{ transformOrigin: side === "l" ? "0% 50%" : "100% 50%" }}
      onClick={() => setOpen(true)}
      className={`absolute top-0 bottom-0 w-1/2 z-[4] ${open ? "pointer-events-none" : "cursor-pointer"} ${side === "l" ? "left-0" : "right-0"}`}>
      <div className={`absolute inset-0 overflow-hidden bg-[#EDE3D4] ${side === "l" ? "rounded-l-[4px]" : "rounded-r-[4px]"} shadow-[0_2px_3px_rgba(61,47,38,.2),0_30px_50px_-25px_rgba(61,47,38,.55)]`}>
        <div className="absolute inset-0 bg-[url('/img/lace.webp')] bg-cover" style={{ backgroundPosition: side === "l" ? "left center" : "right center" }} />
        <div className={`absolute inset-0 ${side === "l" ? "bg-[linear-gradient(90deg,rgba(255,255,255,.18),transparent_60%,rgba(90,70,58,.14))]" : "bg-[linear-gradient(270deg,rgba(255,255,255,.18),transparent_60%,rgba(90,70,58,.14))]"}`} />
        <div className={`absolute inset-y-[4%] ${side === "l" ? "left-[7%] right-[4%]" : "right-[7%] left-[4%]"} border border-[#BCA994]/70`} />
        <motion.div initial={false} animate={{ opacity: open ? [0, 0.35, 0.12] : 0 }} transition={T(0.45, 1.5)} className="absolute inset-0 bg-[#3D2F26]" />
      </div>
      <div className={`absolute inset-y-0 w-px bg-[#A8927C]/60 ${side === "l" ? "right-0" : "left-0"}`} />
    </motion.div>
  );

  return (
    <section className="relative h-[100svh] flex flex-col items-center justify-center overflow-hidden">
      <nav className="absolute top-0 inset-x-0 flex justify-between items-center px-6 md:px-12 py-6 z-20">
        <span className="script text-wine text-3xl">J &amp; S</span>
        <div className="hidden md:flex gap-8 label text-taupe"><a href="#story">Our Story</a><a href="#day">The Day</a><a href="#venue">Venue</a><a href="#dress">Attire</a></div>
        <a href="#rsvp" className="label text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">RSVP</a>
      </nav>

      <motion.div initial={false} animate={{ opacity: open ? 0 : 1, y: open ? -10 : 0 }} transition={T(0, 0.6)} className="absolute top-[10%] text-center z-10 px-6 pointer-events-none">
        <p className="label text-taupe">The Wedding of</p>
        <p className="script text-wine text-3xl md:text-6xl mt-1 [text-shadow:0_1px_0_rgba(255,255,255,.7)]">{info.groom} &amp; {info.bride}</p>
      </motion.div>

      <Tilt global max={6} glare={false} style={{ width: W, height: H }} className="mt-6 md:mt-8">
        <div className="relative w-full h-full" style={{ perspective: 1600 }}>
          {/* ground shadow + inside of the folder */}
          <motion.div initial={false} animate={{ opacity: open ? 0 : 1, y: open ? 60 : 0 }} transition={T(1.9, 0.9)} className="absolute -inset-x-[8%] -bottom-[10%] h-[22%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(61,47,38,.32),transparent_70%)] blur-md" />
          <motion.div initial={false} animate={{ opacity: open ? 0 : 1, y: open ? 60 : 0 }} transition={T(1.9, 0.9)} className="absolute inset-0 z-0 rounded-[4px] overflow-hidden bg-[#E2D5C0] shadow-[0_2px_3px_rgba(61,47,38,.2)]">
            <div className="absolute inset-0 bg-[url('/img/damask.webp')] bg-[length:160%_auto] bg-center opacity-45" />
            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(61,47,38,.3)]" />
          </motion.div>

          {/* the card */}
          <motion.div initial={false} animate={{ scale: open ? S : 1 }} transition={T(1.8, 1.3)} style={{ left: "4%", top: "4%", width: "92%", height: "92%" }} className="absolute z-[2]">
            <Card info={info} />
          </motion.div>

          <Door side="l" />
          <Door side="r" />

          {/* wax seal across the seam — tap to break */}
          <button type="button" onClick={() => setOpen(true)} disabled={open} aria-label="Break the seal to open the invitation"
            className="absolute z-[6] left-1/2 top-1/2 w-[26%] max-w-[124px] aspect-square -translate-x-1/2 -translate-y-1/2 cursor-pointer disabled:cursor-default group">
            {!open && (
              <>
                <motion.span aria-hidden className="absolute inset-[6%] rounded-full border-2 border-wine/50" animate={{ scale: [1, 1.45], opacity: [0.7, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }} />
                <motion.span aria-hidden className="absolute inset-[6%] rounded-full border border-wine/40" animate={{ scale: [1, 1.45], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut", delay: 0.9 }} />
              </>
            )}
            {(["l", "r"] as const).map((side) => (
              <motion.img key={side} src="/img/seal.webp" alt="" aria-hidden draggable={false}
                initial={false}
                animate={open ? { x: side === "l" ? -42 : 42, y: 80, rotate: side === "l" ? -26 : 30, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                transition={{ x: T(0, 0.8), y: T(0.05, 0.9), rotate: T(0, 0.8), opacity: T(0.35, 0.5) }}
                style={{ clipPath: side === "l" ? "polygon(0 0, 52% 0, 46% 22%, 55% 40%, 45% 58%, 54% 78%, 48% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 54% 78%, 45% 58%, 55% 40%, 46% 22%)" }}
                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(61,47,38,.45)] transition-[filter] group-hover:brightness-110" />
            ))}
          </button>
        </div>
      </Tilt>

      {/* instruction before opening */}
      <motion.div initial={false} animate={{ opacity: open ? 0 : 1 }} transition={T(0, 0.5)} className="absolute bottom-[5%] flex flex-col items-center gap-2 text-taupe pointer-events-none">
        <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-xl text-wine">↑</motion.span>
        <span className="label">Tap the seal to open</span>
      </motion.div>

      {/* after opening: scroll to RSVP */}
      <motion.a href="#rsvp" initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 12 }} transition={T(open ? 2.9 : 0, 0.8)}
        className={`absolute bottom-[2.5%] z-10 flex flex-col items-center gap-1 text-wine ${open ? "" : "pointer-events-none"}`}>
        <span className="label">Scroll to RSVP</span>
        <motion.svg viewBox="0 0 24 36" className="w-5 h-8" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M12 2v28M5 23l7 8 7-8" />
        </motion.svg>
      </motion.a>
    </section>
  );
}
