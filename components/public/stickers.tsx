"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { EASE } from "./fx";
import { Paisley as Rings } from "./ornaments";

/** Perforated postage-stamp outline (semicircle bites along every edge). */
function stampPath(w: number, h: number, r = 3, step = 10) {
  const nx = Math.round(w / step), ny = Math.round(h / step);
  const sx = w / nx, sy = h / ny;
  let d = `M0 0`;
  for (let i = 0; i < nx; i++) d += ` L${i * sx + sx / 2 - r} 0 A${r} ${r} 0 0 0 ${i * sx + sx / 2 + r} 0`;
  d += ` L${w} 0`;
  for (let i = 0; i < ny; i++) d += ` L${w} ${i * sy + sy / 2 - r} A${r} ${r} 0 0 0 ${w} ${i * sy + sy / 2 + r}`;
  d += ` L${w} ${h}`;
  for (let i = nx - 1; i >= 0; i--) d += ` L${i * sx + sx / 2 + r} ${h} A${r} ${r} 0 0 0 ${i * sx + sx / 2 - r} ${h}`;
  d += ` L0 ${h}`;
  for (let i = ny - 1; i >= 0; i--) d += ` L0 ${i * sy + sy / 2 + r} A${r} ${r} 0 0 0 0 ${i * sy + sy / 2 - r}`;
  return d + " Z";
}

/** "Stuck on" entrance used by every sticker/stamp. */
export function StickOn({ children, rotate = 0, className = "", delay = 0 }: { children: React.ReactNode; rotate?: number; className?: string; delay?: number }) {
  return (
    <motion.div aria-hidden initial={{ opacity: 0, scale: 1.5, rotate: rotate - 18 }} whileInView={{ opacity: 1, scale: 1, rotate }} viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55, delay, ease: [0.3, 1.5, 0.5, 1] }} whileHover={{ scale: 1.08, rotate: rotate + 4 }}
      className={`pointer-events-auto select-none ${className}`}>{children}</motion.div>
  );
}

type StampKind = "rings" | "initials" | "bahrain" | "date";
/** Vintage postage stamps. */
export function Stamp({ kind = "rings", className = "" }: { kind?: StampKind; className?: string }) {
  const W = 100, H = 124;
  const dark = kind === "initials" || kind === "date";
  const bg = dark ? "#6E1F2E" : "#F8F1E3", fg = dark ? "#F6EBDD" : "#6E1F2E";
  return (
    <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className={`drop-shadow-[0_3px_3px_rgba(61,47,38,.35)] ${className}`}>
      <path d={stampPath(W, H)} fill="#FFFDF8" />
      <rect x="7" y="7" width={W - 14} height={H - 14} fill={bg} />
      <rect x="10" y="10" width={W - 20} height={H - 20} fill="none" stroke={fg} strokeWidth=".8" opacity=".7" />
      {kind === "rings" && (<>
        <foreignObject x="30" y="22" width="40" height="60"><Rings className="w-full h-full text-[#6E1F2E]" /></foreignObject>
        <text x="50" y="96" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill={fg} letterSpacing="2">I DO</text>
        <text x="84" y="24" textAnchor="end" fontFamily="Cormorant Garamond, serif" fontSize="10" fill={fg} fontWeight="600">11</text>
      </>)}
      {kind === "initials" && (<>
        <text x="50" y="66" textAnchor="middle" fontFamily="Pinyon Script, cursive" fontSize="34" fill={fg}>J&amp;S</text>
        <text x="50" y="90" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="9" fill={fg} letterSpacing="2.5">EST. 2026</text>
        <text x="17" y="24" fontFamily="Cormorant Garamond, serif" fontSize="9" fill={fg} fontWeight="600">BD 11</text>
      </>)}
      {kind === "bahrain" && (<>
        {/* palm + sun over the gulf */}
        <circle cx="62" cy="46" r="11" fill="#E8C9C0" />
        <path d="M22 78 Q50 70 78 78" stroke={fg} strokeWidth="1" fill="none" /><path d="M24 84 Q50 78 76 84" stroke={fg} strokeWidth=".7" fill="none" opacity=".7" />
        <path d="M40 78 C41 64 42 52 44 42" stroke={fg} strokeWidth="1.6" fill="none" />
        <path d="M44 42 C36 38 30 40 27 45 M44 42 C38 34 32 34 29 36 M44 42 C47 34 54 32 58 35 M44 42 C52 39 58 42 60 47 M44 42 C44 35 42 31 38 29" stroke={fg} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <text x="50" y="100" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="10" fill={fg} letterSpacing="2.5">BAHRAIN</text>
      </>)}
      {kind === "date" && (<>
        <text x="50" y="56" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="26" fill={fg} fontWeight="500">11.11</text>
        <text x="50" y="74" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="13" fill={fg} letterSpacing="3">2026</text>
        <text x="50" y="96" textAnchor="middle" fontFamily="Pinyon Script, cursive" fontSize="13" fill={fg}>make a wish</text>
      </>)}
    </svg>
  );
}

/** Round postmark / cancellation. */
export function Postmark({ className = "", top = "DAMISTAN · BAHRAIN", mid = "11 NOV", bottom = "2026" }: { className?: string; top?: string; mid?: string; bottom?: string }) {
  return (
    <svg viewBox="0 0 200 110" className={`opacity-75 ${className}`} fill="none" stroke="#6E1F2E" strokeWidth="1.6">
      <circle cx="55" cy="55" r="44" /><circle cx="55" cy="55" r="30" strokeWidth=".9" />
      <defs><path id="pm-arc" d="M20 55 A35 35 0 0 1 90 55" /></defs>
      <text fontFamily="Cormorant Garamond, serif" fontSize="10.5" fill="#6E1F2E" stroke="none" letterSpacing="1.5"><textPath href="#pm-arc" startOffset="50%" textAnchor="middle">{top}</textPath></text>
      <text x="55" y="58" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="13" fill="#6E1F2E" stroke="none" fontWeight="600">{mid}</text>
      <text x="55" y="74" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill="#6E1F2E" stroke="none" letterSpacing="2">{bottom}</text>
      {[30, 44, 58, 72, 86].map((y) => <path key={y} d={`M104 ${y} q10 -7 20 0 t20 0 t20 0 t20 0 t14 0`} />)}
    </svg>
  );
}

type StickerKind = "wedo" | "wish" | "ido" | "cheers" | "dance" | "love";
/** Die-cut vinyl stickers with a white border. */
export function Sticker({ kind, className = "" }: { kind: StickerKind; className?: string }) {
  const base = "inline-flex items-center justify-center text-center border-[5px] border-white shadow-[0_2px_2px_rgba(61,47,38,.25),0_8px_14px_-6px_rgba(61,47,38,.4)]";
  switch (kind) {
    case "wedo":
      return <span className={`${base} rounded-full bg-wine text-lace px-5 py-2 font-serif font-semibold tracking-[0.12em] text-base md:text-lg ${className}`}>#JSWeDo</span>;
    case "wish":
      return (
        <span className={`${base} rounded-full bg-[#F4E6DA] text-wine w-24 h-24 md:w-28 md:h-28 flex-col ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.6 6.8L12 16.8 6.4 20.5 8 13.7 3 9.3l6.4-.7z" /></svg>
          <span className="script text-2xl leading-none mt-1">make a wish</span>
          <span className="font-serif font-semibold text-sm tracking-[0.2em]">11:11</span>
        </span>
      );
    case "ido":
      return (
        <span className={`relative ${className}`}>
          <svg viewBox="0 0 120 108" className="w-24 md:w-28 drop-shadow-[0_6px_8px_rgba(61,47,38,.35)]">
            <path d="M60 104 C20 78 4 56 4 34 C4 16 18 4 34 4 C46 4 55 11 60 20 C65 11 74 4 86 4 C102 4 116 16 116 34 C116 56 100 78 60 104 Z" fill="#6E1F2E" stroke="#fff" strokeWidth="6" />
            <text x="60" y="58" textAnchor="middle" fontFamily="Pinyon Script, cursive" fontSize="30" fill="#F6EBDD">I do</text>
          </svg>
        </span>
      );
    case "cheers":
      return (
        <span className={`${base} rounded-[20px] bg-[#EFE3D0] text-wine px-4 py-2 gap-2 ${className}`}>
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 4h7l-1 8a3 3 0 01-5 0zM10.5 13v10M7 23h7M25 4h-7l1 8a3 3 0 005 0zM21.5 13v10M18 23h7M15 2l1-1.5M17 3l1.5-1" /></svg>
          <span className="script text-3xl leading-none">Cheers!</span>
        </span>
      );
    case "dance":
      return <span className={`${base} rounded-[14px] bg-[#FBF6EE] text-mocha px-4 py-2 font-serif italic text-base md:text-lg -skew-x-3 ${className}`}>save me a <b className="not-italic text-wine">dance</b> ♪</span>;
    case "love":
      return <span className={`${base} rounded-full bg-[#E9D3CC] text-wine px-5 py-2 script text-3xl leading-none ${className}`}>with love</span>;
  }
}

/** Animated "tap to flip" hint: a wine pill with a spinning arrow + a pointing hand. */
export function FlipHint({ label = "Tap to flip", className = "" }: { label?: string; className?: string }) {
  return (
    <motion.span animate={{ scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      className={`inline-flex items-center gap-2 bg-wine text-lace rounded-full pl-3 pr-4 py-1.5 shadow-[0_6px_14px_-4px_rgba(110,31,46,.6)] ${className}`}>
      <motion.svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}>
        <path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4" />
      </motion.svg>
      <span className="label font-semibold !text-[11px]">{label}</span>
      <motion.span animate={{ x: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9 }} className="text-base leading-none">👆</motion.span>
    </motion.span>
  );
}

/** Wraps a two-sided card: peeks (little wiggle) every few seconds until it has been flipped once. */
export function useFlip() {
  const [flip, setFlip] = useState(false);
  const [used, setUsed] = useState(false);
  const toggle = () => { setFlip((f) => !f); setUsed(true); };
  const peek = used ? {} : { rotateY: [0, -16, 0, -8, 0] };
  return { flip, toggle, peek, used };
}

/** A personal vintage postcard you can flip — front: your photo + "Wish you were here", back: a handwritten note. */
export function Postcard({ from, venue, date, photo }: { from: string; venue: string; date: string; photo?: string }) {
  const { flip, toggle, peek } = useFlip();
  return (
    <section className="relative px-5 md:px-16 py-14 md:py-20">
      <motion.div initial={{ opacity: 0, y: 50, rotate: -6 }} whileInView={{ opacity: 1, y: 0, rotate: -2 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.1, ease: EASE }}
        className="max-w-2xl mx-auto [perspective:1600px]">
        <button type="button" onClick={toggle} aria-label="Flip the postcard" className="relative block w-full aspect-[3/2] text-left">
          <motion.div animate={flip ? { rotateY: 180 } : { rotateY: 0, ...peek }} transition={flip ? { duration: 1.1, ease: EASE } : { duration: 1.4, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }} className="absolute inset-0 [transform-style:preserve-3d]">
            {/* FRONT */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-[#FBF7EF] shadow-[0_2px_3px_rgba(61,47,38,.2),0_24px_40px_-18px_rgba(61,47,38,.5)] p-[3.5%] grid grid-cols-[1fr_1.1fr] gap-[4%]">
              <div className="relative bg-[#EDE3D4] p-[5%] shadow-[inset_0_0_0_1px_rgba(61,47,38,.1)] -rotate-2">
                <div className="w-full h-full overflow-hidden">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover [filter:sepia(.25)_contrast(1.02)]" /> : (
                    <div className="w-full h-full bg-[linear-gradient(160deg,#EFE7DB,#DDD0BE)] grid place-items-center"><Rings className="w-10 h-14 text-taupe/50" /></div>
                  )}
                </div>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-16 bg-[#EFE4D2]/80 shadow-sm rotate-3" />
              </div>
              <div className="relative flex flex-col justify-center text-center">
                <p className="script text-wine text-[9vw] md:text-6xl leading-[0.95]">Wish you<br />were here</p>
                <p className="font-serif italic text-mocha text-[3.2vw] md:text-lg mt-3">…and you will be.</p>
                <p className="label text-taupe mt-3 !text-[10px] md:!text-xs">with love, {from} · {date}</p>
              </div>
            </div>
            {/* BACK */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#FBF7EF] shadow-[0_2px_3px_rgba(61,47,38,.2),0_24px_40px_-18px_rgba(61,47,38,.5)] p-[4%] grid grid-cols-[1.25fr_1fr] gap-[4%]">
              <div className="border-r border-taupe/40 pr-[5%] flex flex-col justify-center">
                <p className="script text-wine text-3xl md:text-5xl leading-none">Dear you,</p>
                <p className="font-serif italic text-mocha text-[3.4vw] md:text-xl leading-snug mt-3">We can&apos;t wait to celebrate with you at {venue}. Come early, stay late, hug us often. Save us a dance — and a seat by the snacks.</p>
                <p className="script text-wine text-2xl md:text-4xl mt-3">— {from}</p>
              </div>
              <div className="relative flex flex-col justify-end pb-[8%]">
                <div className="absolute top-0 right-0 w-[34%]"><Stamp kind="initials" className="w-full" /></div>
                <Postmark className="absolute top-[4%] right-[18%] w-[70%]" top="WITH LOVE · J & S" />
                {["To: our favourite people", "wherever you are", "see you on 11.11"].map((l) => (
                  <p key={l} className="font-serif italic text-mocha text-[3vw] md:text-lg border-b border-taupe/50 pb-1 mt-[6%]">{l}</p>
                ))}
              </div>
            </div>
          </motion.div>
        </button>
        <div className="text-center mt-6"><button type="button" onClick={toggle}><FlipHint label={flip ? "Flip back" : "Tap to turn over"} /></button></div>
      </motion.div>
    </section>
  );
}
