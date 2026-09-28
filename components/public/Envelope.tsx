"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/lib/hooks";
import type { WeddingInfo } from "@/lib/types";
import { Corners, Flourish, LaceMeshDefs } from "./ornaments";

export const fullDate = (iso: string) => {
  const p = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bahrain" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value;
  return `${g("month") === "11" && g("day") === "11" ? "11.11" : `${g("day")}.${g("month")}`}.${g("year")}`;
};
const weekday = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Asia/Bahrain" });
const timeWords = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bahrain" });

function Card({ info }: { info: WeddingInfo }) {
  const cd = useCountdown(info.date);
  const [dm, year] = [fullDate(info.date).slice(0, 5), fullDate(info.date).slice(6)];
  return (
    <div className="paper-card relative w-full h-full shadow-[0_30px_60px_-30px_rgba(61,47,38,.45)] [container-type:inline-size] text-center flex flex-col items-center justify-center px-[6cqw]">
      <div className="absolute inset-[2.2cqw] border border-taupe/40" />
      <div className="absolute inset-[3cqw] border border-taupe/25" />
      <Corners className="w-[11cqw] h-[11cqw]" inset="3.6cqw" color="#B9A591" />
      <p className="script text-wine text-[7.5cqw] leading-none">Save the Date</p>
      <h1 className="caps text-mocha text-[6.4cqw] mt-[2.4cqw] leading-none whitespace-nowrap">
        {info.groom} <span className="script normal-case tracking-normal text-wine text-[7cqw] mx-[1cqw]">&amp;</span> {info.bride}
      </h1>
      <p className="font-serif italic text-taupe text-[2.6cqw] mt-[1.6cqw]">are getting married</p>
      <Flourish className="w-[34cqw] mt-[1.4cqw] text-taupe/70" />
      <div className="font-serif font-light text-mocha leading-none mt-[1cqw] tracking-[0.08em]">
        <span className="text-wine text-[13cqw] font-normal">{dm}</span><span className="text-[7cqw] text-taupe">.{year}</span>
      </div>
      <p className="font-serif italic text-mocha text-[2.9cqw] mt-[1.2cqw]">{weekday(info.date)} · {timeWords(info.date)}</p>
      <div className="flex gap-[3.4cqw] mt-[2.2cqw] font-serif text-mocha">
        {([["Days", cd.days], ["Hours", cd.hours], ["Minutes", cd.minutes], ["Seconds", cd.seconds]] as const).map(([l, v]) => (
          <div key={l} className="flex flex-col items-center">
            <span className="text-[5cqw] leading-none tabular-nums">{cd.ready ? String(v).padStart(2, "0") : "--"}</span>
            <span className="uppercase tracking-[0.25em] text-[1.5cqw] text-taupe mt-[0.8cqw]">{l}</span>
          </div>
        ))}
      </div>
      <p className="caps text-taupe text-[1.9cqw] mt-[2.4cqw]">{info.venue_name} · {info.venue_address.split(",")[0]}</p>
    </div>
  );
}

export default function EnvelopeHero({ info }: { info: WeddingInfo }) {
  const ref = useRef<HTMLElement>(null);
  const [dims, setDims] = useState({ W: 560, vh: 800, S: 1.2 });
  useEffect(() => {
    const calc = () => {
      const W = Math.min(window.innerWidth * 0.88, 600);
      const H = W * 0.66;
      const cardW = W * 0.92, cardH = H * 0.92;
      const S = Math.min(1.45, (window.innerWidth * 0.94) / cardW, (window.innerHeight * 0.82) / cardH);
      setDims({ W, vh: window.innerHeight, S: Math.max(1, S) });
    };
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const { W, vh, S } = dims;
  const H = W * 0.66;

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const hint = useTransform(p, [0, 0.05], [1, 0]);
  const sealScale = useTransform(p, [0, 0.1], [1, 0.4]);
  const sealOpacity = useTransform(p, [0.03, 0.1], [1, 0]);
  const flapRot = useTransform(p, [0.08, 0.3], [0, 180]);
  const flapZ = useTransform(flapRot, (v) => (v > 90 ? 1 : 5));
  const cardY = useTransform(p, [0.3, 0.52, 0.62, 0.85], [0, -H * 0.82, -H * 0.82, 0]);
  const cardScale = useTransform(p, [0.62, 0.85], [1, S]);
  const envY = useTransform(p, [0.5, 0.72], [0, vh]);
  const envOpacity = useTransform(p, [0.55, 0.72], [1, 0]);
  const after = useTransform(p, [0.86, 0.95], [0, 1]);

  const lace = "#CDBBA7";
  return (
    <section ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        <nav className="absolute top-0 inset-x-0 flex justify-between items-center px-6 md:px-12 py-6 z-20">
          <span className="script text-wine text-3xl">J &amp; S</span>
          <div className="hidden md:flex gap-8 label text-taupe"><a href="#story">Our Story</a><a href="#day">The Day</a><a href="#venue">Venue</a><a href="#dress">Attire</a></div>
          <a href="#rsvp" className="label text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">RSVP</a>
        </nav>

        <motion.div style={{ opacity: hint }} className="absolute top-[13%] text-center z-10 px-6">
          <p className="label text-taupe">The Wedding of</p>
          <p className="script text-wine text-5xl md:text-6xl mt-2">{info.groom} &amp; {info.bride}</p>
        </motion.div>

        <div className="relative" style={{ width: W, height: H, perspective: 1800 }}>
          {/* back of envelope */}
          <motion.div style={{ y: envY, opacity: envOpacity }} className="absolute inset-0 z-0 rounded-[3px] bg-[#E4D8C4] shadow-[0_40px_80px_-30px_rgba(61,47,38,.5)]" />

          {/* the card */}
          <motion.div style={{ y: cardY, scale: cardScale, left: "4%", top: "4%", width: "92%", height: "92%" }} className="absolute z-[2]">
            <Card info={info} />
          </motion.div>

          {/* front pocket (lace) */}
          <motion.svg style={{ y: envY, opacity: envOpacity }} viewBox="0 0 600 396" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-[3] drop-shadow-[0_-4px_8px_rgba(61,47,38,.12)]">
            <LaceMeshDefs id="pocket" stroke={lace} />
            <path d="M0 0 L300 230 L600 0 V396 H0 Z" fill="url(#pocket-flower)" />
            <path d="M0 0 L300 230 L600 0" fill="none" stroke={lace} strokeWidth="1.2" />
            <path d="M0 10 L300 240 L600 10" fill="none" stroke={lace} strokeWidth="1" strokeDasharray="2 4" />
            {Array.from({ length: 24 }, (_, i) => { const t = (i + 0.5) / 24; const left = t < 0.5; const tt = left ? t * 2 : (1 - t) * 2; const x = left ? tt * 300 : 600 - tt * 300; const y = tt * 230; return <circle key={i} cx={x} cy={y + 6} r="5" fill="#FBF7EF" stroke={lace} strokeWidth=".8" />; })}
            <rect x="1" y="1" width="598" height="394" fill="none" stroke={lace} strokeWidth="1.5" />
          </motion.svg>

          {/* top flap */}
          <motion.div style={{ y: envY, opacity: envOpacity, zIndex: flapZ }} className="absolute inset-x-0 top-0 h-full pointer-events-none">
            <motion.svg style={{ rotateX: flapRot, transformOrigin: "50% 0%" }} viewBox="0 0 600 396" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_6px_10px_rgba(61,47,38,.18)]">
              <LaceMeshDefs id="flap" bg="#F8F2E8" stroke={lace} />
              <path d="M0 0 H600 L300 250 Z" fill="url(#flap-flower)" />
              <path d="M0 0 L300 250 L600 0" fill="none" stroke={lace} strokeWidth="1.4" />
              {Array.from({ length: 26 }, (_, i) => { const t = (i + 0.5) / 26; const left = t < 0.5; const tt = left ? t * 2 : (1 - t) * 2; const x = left ? tt * 300 : 600 - tt * 300; const y = tt * 250; return <path key={i} d={`M${x - 6} ${y} a6 6 0 0 0 12 0`} fill="#FBF7EF" stroke={lace} strokeWidth=".8" />; })}
            </motion.svg>
          </motion.div>

          {/* wax seal */}
          <motion.div style={{ scale: sealScale, opacity: sealOpacity, left: "50%", top: "61%" }} className="absolute z-[6]">
            <div className="relative w-20 h-20 md:w-24 md:h-24 -ml-10 -mt-10 md:-ml-12 md:-mt-12 rounded-full bg-wine grid place-items-center shadow-[inset_0_-6px_12px_rgba(0,0,0,.35),inset_0_4px_8px_rgba(255,255,255,.18),0_6px_14px_rgba(61,47,38,.4)]" style={{ borderRadius: "52% 48% 50% 50% / 48% 52% 48% 52%" }}>
              <div className="absolute inset-2 rounded-full border border-[#8f3446]" />
              <span className="script text-[#E8C9CF] text-3xl md:text-4xl drop-shadow">J&amp;S</span>
            </div>
          </motion.div>
        </div>

        <motion.div style={{ opacity: hint }} className="absolute bottom-[8%] flex flex-col items-center gap-3 text-taupe">
          <span className="label">Scroll to open</span>
          <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-xl">↓</motion.span>
        </motion.div>
        <motion.p style={{ opacity: after }} className="absolute bottom-[4%] label text-taupe">{info.hashtags.join("  ·  ")}</motion.p>
      </div>
    </section>
  );
}
