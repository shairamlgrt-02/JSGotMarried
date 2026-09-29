"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/lib/hooks";
import type { WeddingInfo } from "@/lib/types";
import { Tilt } from "./fx";
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
  const ref = useRef<HTMLElement>(null);
  const [dims, setDims] = useState({ W: 400, vh: 800, S: 1.2 });
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const W = Math.min(vw * 0.84, 460, (vh * 0.66) / RATIO);
      const cardW = W * 0.92, cardH = W * RATIO * 0.92;
      const S = Math.min(1.45, (vw * 0.94) / cardW, (vh * 0.88) / cardH);
      setDims({ W, vh, S: Math.max(1, S) });
    };
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const { W, S } = dims;
  const H = W * RATIO;

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const hint = useTransform(p, [0, 0.05], [1, 0]);
  // wax seal cracks, then the two panels swing open like doors
  const sealL = useTransform(p, [0.03, 0.14], [0, -40]);
  const sealR = useTransform(p, [0.03, 0.14], [0, 40]);
  const sealRotL = useTransform(p, [0.03, 0.14], [0, -24]);
  const sealRotR = useTransform(p, [0.03, 0.14], [0, 28]);
  const sealDrop = useTransform(p, [0.03, 0.14], [0, 70]);
  const sealFade = useTransform(p, [0.08, 0.15], [1, 0]);
  const doorL = useTransform(p, [0.12, 0.42], [0, -158]);
  const doorR = useTransform(p, [0.12, 0.42], [0, 158]);
  const doorShade = useTransform(p, [0.12, 0.27, 0.42], [0, 0.35, 0.12]);
  const shell = useTransform(p, [0.48, 0.66], [1, 0]);
  const shellY = useTransform(p, [0.48, 0.7], [0, 60]);
  const cardScale = useTransform(p, [0.46, 0.76], [1, S]);
  const cardShadow = useTransform(p, [0.3, 0.5], [0, 1]);
  const after = useTransform(p, [0.86, 0.95], [0, 1]);

  const Door = ({ side }: { side: "l" | "r" }) => (
    <motion.div style={{ rotateY: side === "l" ? doorL : doorR, transformOrigin: side === "l" ? "0% 50%" : "100% 50%", opacity: shell }}
      className={`absolute top-0 bottom-0 w-1/2 z-[4] ${side === "l" ? "left-0" : "right-0"}`}>
      <div className={`absolute inset-0 overflow-hidden bg-[#EDE3D4] ${side === "l" ? "rounded-l-[4px]" : "rounded-r-[4px]"} shadow-[0_2px_3px_rgba(61,47,38,.2),0_30px_50px_-25px_rgba(61,47,38,.55)]`}>
        <div className="absolute inset-0 bg-[url('/img/lace.webp')] bg-cover" style={{ backgroundPosition: side === "l" ? "left center" : "right center" }} />
        <div className={`absolute inset-0 ${side === "l" ? "bg-[linear-gradient(90deg,rgba(255,255,255,.18),transparent_60%,rgba(90,70,58,.14))]" : "bg-[linear-gradient(270deg,rgba(255,255,255,.18),transparent_60%,rgba(90,70,58,.14))]"}`} />
        <div className={`absolute inset-y-[4%] ${side === "l" ? "left-[7%] right-[4%]" : "right-[7%] left-[4%]"} border border-[#BCA994]/70`} />
        <motion.div style={{ opacity: doorShade }} className="absolute inset-0 bg-[#3D2F26]" />
      </div>
      {/* seam edge */}
      <div className={`absolute inset-y-0 w-px bg-[#A8927C]/60 ${side === "l" ? "right-0" : "left-0"}`} />
    </motion.div>
  );

  return (
    <section ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        <nav className="absolute top-0 inset-x-0 flex justify-between items-center px-6 md:px-12 py-6 z-20">
          <span className="script text-wine text-3xl">J &amp; S</span>
          <div className="hidden md:flex gap-8 label text-taupe"><a href="#story">Our Story</a><a href="#day">The Day</a><a href="#venue">Venue</a><a href="#dress">Attire</a></div>
          <a href="#rsvp" className="label text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">RSVP</a>
        </nav>

        <motion.div style={{ opacity: hint }} className="absolute top-[10%] text-center z-10 px-6">
          <p className="label text-taupe">The Wedding of</p>
          <p className="script text-wine text-3xl md:text-6xl mt-1 [text-shadow:0_1px_0_rgba(255,255,255,.7)]">{info.groom} &amp; {info.bride}</p>
        </motion.div>

        <Tilt global max={6} glare={false} style={{ width: W, height: H }} className="mt-8 md:mt-10">
          <div className="relative w-full h-full" style={{ perspective: 1600 }}>
            {/* ground shadow + inside of the folder */}
            <motion.div style={{ opacity: shell, y: shellY }} className="absolute -inset-x-[8%] -bottom-[10%] h-[22%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(61,47,38,.32),transparent_70%)] blur-md" />
            <motion.div style={{ opacity: shell, y: shellY }} className="absolute inset-0 z-0 rounded-[4px] overflow-hidden bg-[#E2D5C0] shadow-[0_2px_3px_rgba(61,47,38,.2)]">
              <div className="absolute inset-0 bg-[url('/img/damask.webp')] bg-[length:160%_auto] bg-center opacity-45" />
              <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(61,47,38,.3)]" />
            </motion.div>

            {/* the card */}
            <motion.div style={{ scale: cardScale, left: "4%", top: "4%", width: "92%", height: "92%" }} className="absolute z-[2]">
              <motion.div style={{ opacity: cardShadow }} className="absolute inset-x-[5%] -bottom-[4%] h-[10%] bg-[radial-gradient(ellipse,rgba(61,47,38,.3),transparent_70%)] blur-sm" />
              <Card info={info} />
            </motion.div>

            <Door side="l" />
            <Door side="r" />

            {/* wax seal across the seam — cracks in two */}
            <motion.div style={{ opacity: sealFade, left: "50%", top: "50%" }} className="absolute z-[6] w-[24%] max-w-[120px] aspect-square -translate-x-1/2 -translate-y-1/2">
              {(["l", "r"] as const).map((side) => (
                <motion.img key={side} src="/img/seal.webp" alt="" aria-hidden
                  style={{ x: side === "l" ? sealL : sealR, y: sealDrop, rotate: side === "l" ? sealRotL : sealRotR,
                    clipPath: side === "l" ? "polygon(0 0, 52% 0, 46% 22%, 55% 40%, 45% 58%, 54% 78%, 48% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 54% 78%, 45% 58%, 55% 40%, 46% 22%)" }}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(61,47,38,.45)]" />
              ))}
            </motion.div>
          </div>
        </Tilt>

        <motion.div style={{ opacity: hint }} className="absolute bottom-[5%] flex flex-col items-center gap-2 text-taupe">
          <span className="label">Scroll to open</span>
          <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-xl">↓</motion.span>
        </motion.div>
        <motion.p style={{ opacity: after }} className="absolute bottom-[4%] label text-taupe">{info.hashtags.join("  ·  ")}</motion.p>
      </div>
    </section>
  );
}
