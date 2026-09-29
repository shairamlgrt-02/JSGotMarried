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
  const [dims, setDims] = useState({ W: 560, vh: 800, S: 1.2 });
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const W = Math.min(vw * 0.8, 440, (vh * 0.6) / RATIO);
      const cardW = W * 0.92, cardH = W * RATIO * 0.92;
      const S = Math.min(1.6, (vw * 0.94) / cardW, (vh * 0.88) / cardH);
      setDims({ W, vh, S: Math.max(1, S) });
    };
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const { W, vh, S } = dims;
  const H = W * RATIO;

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const hint = useTransform(p, [0, 0.05], [1, 0]);
  const flapRot = useTransform(p, [0.08, 0.3], [0, 180]);
  const flapZ = useTransform(flapRot, (v) => (v > 90 ? 1 : 5));
  const cardY = useTransform(p, [0.3, 0.52, 0.62, 0.85], [0, -H * 0.3, -H * 0.3, 0]);
  const cardScale = useTransform(p, [0.62, 0.85], [1, S]);
  const envY = useTransform(p, [0.3, 0.52, 0.56, 0.74], [0, H * 0.32, H * 0.32, vh]);
  const envOpacity = useTransform(p, [0.55, 0.72], [1, 0]);
  const after = useTransform(p, [0.86, 0.95], [0, 1]);

  const sealL = useTransform(p, [0.03, 0.14], [0, -46]);
  const sealR = useTransform(p, [0.03, 0.14], [0, 46]);
  const sealRotL = useTransform(p, [0.03, 0.14], [0, -24]);
  const sealRotR = useTransform(p, [0.03, 0.14], [0, 28]);
  const sealDrop = useTransform(p, [0.03, 0.14], [0, 70]);
  const sealFade = useTransform(p, [0.08, 0.15], [1, 0]);
  const cardShadow = useTransform(p, [0.3, 0.5], [0, 1]);

  const lace = "#CDBBA7";
  const scallops = (n: number, depth: number) => Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n; const left = t < 0.5; const tt = left ? t * 2 : (1 - t) * 2;
    return { x: left ? tt * 300 : 600 - tt * 300, y: tt * depth, a: left ? Math.atan2(depth, 300) : -Math.atan2(depth, 300) };
  });
  return (
    <section ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        <nav className="absolute top-0 inset-x-0 flex justify-between items-center px-6 md:px-12 py-6 z-20">
          <span className="script text-wine text-3xl">J &amp; S</span>
          <div className="hidden md:flex gap-8 label text-taupe"><a href="#story">Our Story</a><a href="#day">The Day</a><a href="#venue">Venue</a><a href="#dress">Attire</a></div>
          <a href="#rsvp" className="label text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">RSVP</a>
        </nav>

        <motion.div style={{ opacity: hint }} className="absolute top-[11%] text-center z-10 px-6">
          <p className="label text-taupe">The Wedding of</p>
          <p className="script text-wine text-4xl md:text-6xl mt-1 [text-shadow:0_1px_0_rgba(255,255,255,.7)]">{info.groom} &amp; {info.bride}</p>
        </motion.div>

        <Tilt global max={7} glare={false} style={{ width: W, height: H }}>
          <div className="relative w-full h-full" style={{ perspective: 1800 }}>
            {/* ground shadow */}
            <motion.div style={{ opacity: envOpacity, y: envY }} className="absolute -inset-x-[6%] -bottom-[14%] h-[30%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(61,47,38,.35),transparent_70%)] blur-md" />
            {/* back of envelope + liner */}
            <motion.div style={{ y: envY, opacity: envOpacity }} className="absolute inset-0 z-0 rounded-[4px] overflow-hidden bg-[#E2D5C0] shadow-[0_2px_3px_rgba(61,47,38,.2),0_40px_70px_-30px_rgba(61,47,38,.55)]">
              <div className="absolute inset-0 bg-[url('/img/damask.webp')] bg-[length:140%_auto] bg-center opacity-50" />
              <div className="absolute inset-0 shadow-[inset_0_10px_30px_rgba(61,47,38,.35)]" />
            </motion.div>

            {/* the card */}
            <motion.div style={{ y: cardY, scale: cardScale, left: "4%", top: "4%", width: "92%", height: "92%" }} className="absolute z-[2]">
              <motion.div style={{ opacity: cardShadow }} className="absolute inset-x-[5%] -bottom-[4%] h-[12%] bg-[radial-gradient(ellipse,rgba(61,47,38,.35),transparent_70%)] blur-sm" />
              <Card info={info} />
            </motion.div>

            {/* front pocket — real lace */}
            <motion.svg style={{ y: envY, opacity: envOpacity }} viewBox="0 0 600 792" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-[3] overflow-visible">
              <defs>
                <linearGradient id="pocket-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".25" /><stop offset="1" stopColor="#5A463A" stopOpacity=".18" /></linearGradient>
              </defs>
              <path d="M0 -3 L300 437 L600 -3" fill="none" stroke="rgba(61,47,38,.18)" strokeWidth="10" strokeLinejoin="round" />
              <clipPath id="pocket-shape"><path d="M0 0 L300 440 L600 0 V792 H0 Z" />{scallops(26, 440).map((s, i) => <circle key={i} cx={s.x} cy={s.y + 4} r="8" />)}</clipPath>
              <g clipPath="url(#pocket-shape)">
                <image href="/img/lace.webp" x="0" y="0" width="600" height="792" preserveAspectRatio="xMidYMid slice" />
                <rect width="600" height="792" fill="url(#pocket-shade)" />
              </g>
              <path d="M0 6 L300 448 L600 6" fill="none" stroke="#BCA994" strokeWidth=".8" strokeDasharray="1.5 3" />
              <rect x=".5" y=".5" width="599" height="791" fill="none" stroke="#CDBBA7" strokeWidth="1" rx="4" />
            </motion.svg>

            {/* top flap — real lace */}
            <motion.div style={{ y: envY, opacity: envOpacity, zIndex: flapZ }} className="absolute inset-x-0 top-0 h-full pointer-events-none">
              <motion.svg style={{ rotateX: flapRot, transformOrigin: "50% 0%" }} viewBox="0 0 600 792" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="flap-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A463A" stopOpacity=".08" /><stop offset="1" stopColor="#fff" stopOpacity=".2" /></linearGradient>
                </defs>
                <path d="M0 4 L300 486 L600 4" fill="none" stroke="rgba(61,47,38,.16)" strokeWidth="12" strokeLinejoin="round" />
                <clipPath id="flap-shape"><path d="M0 0 H600 L300 480 Z" />{scallops(28, 480).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r="8" />)}</clipPath>
                <g clipPath="url(#flap-shape)">
                  <image href="/img/lace.webp" x="0" y="0" width="600" height="792" preserveAspectRatio="xMidYMid slice" />
                  <rect width="600" height="792" fill="url(#flap-shade)" />
                </g>
              </motion.svg>
            </motion.div>

            {/* wax seal — cracks in two */}
            <motion.div style={{ opacity: sealFade, left: "50%", top: "60.6%" }} className="absolute z-[6] w-[22%] max-w-[120px] aspect-square -translate-x-1/2 -translate-y-1/2">
              {(["l", "r"] as const).map((side) => (
                <motion.img key={side} src="/img/seal.webp" alt="" aria-hidden
                  style={{ x: side === "l" ? sealL : sealR, y: sealDrop, rotate: side === "l" ? sealRotL : sealRotR,
                    clipPath: side === "l" ? "polygon(0 0, 52% 0, 46% 22%, 55% 40%, 45% 58%, 54% 78%, 48% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%, 54% 78%, 45% 58%, 55% 40%, 46% 22%)" }}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_6px_6px_rgba(61,47,38,.45)]" />
              ))}
            </motion.div>
          </div>
        </Tilt>

        <motion.div style={{ opacity: hint }} className="absolute bottom-[7%] flex flex-col items-center gap-3 text-taupe">
          <span className="label">Scroll to open</span>
          <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-xl">↓</motion.span>
        </motion.div>
        <motion.p style={{ opacity: after }} className="absolute bottom-[4%] label text-taupe">{info.hashtags.join("  ·  ")}</motion.p>
      </div>
    </section>
  );
}
