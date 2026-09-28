"use client";
import { motion, MotionValue, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";

export const EASE = [0.76, 0, 0.24, 1] as const;

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    // anchor links
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      lenis.scrollTo(a.getAttribute("href")!, { offset: 0, duration: 1.6 });
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); document.removeEventListener("click", onClick); };
  }, []);
  return null;
}

export function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div style={{ scaleX: x }} className="fixed top-0 left-0 right-0 h-[2px] bg-gold origin-left z-[70]" />;
}

/** Custom cursor: small gold dot that grows into an "RSVP"/label bubble over [data-cursor] elements. */
export function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 }), sy = useSpring(y, { stiffness: 500, damping: 40 });
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX); y.set(e.clientY);
      const el = (e.target as HTMLElement).closest("[data-cursor], a, button") as HTMLElement | null;
      setLabel(el ? el.dataset.cursor ?? "" : null);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);
  if (!enabled) return null;
  const big = label !== null && label !== "";
  return (
    <motion.div style={{ x: sx, y: sy }} className="fixed top-0 left-0 z-[80] pointer-events-none">
      <motion.div
        animate={{ width: big ? 84 : label === "" ? 36 : 10, height: big ? 84 : label === "" ? 36 : 10 }}
        transition={{ duration: 0.35, ease: EASE }}
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center ${label === "" ? "border border-gold" : "bg-gold"} mix-blend-difference`}
      >
        {big && <span className="label text-ink text-[10px] tracking-[0.2em]">{label}</span>}
      </motion.div>
    </motion.div>
  );
}

export function Magnetic({ children, className = "", strength = 0.35 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 }), y = useSpring(0, { stiffness: 200, damping: 15 });
  return (
    <motion.div
      ref={ref} style={{ x, y }} className={`inline-block ${className}`}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * strength); y.set((e.clientY - r.top - r.height / 2) * strength); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >{children}</motion.div>
  );
}

/** Line-by-line mask reveal. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span className="block" initial={{ y: "110%" }} whileInView={{ y: "0%" }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.1, ease: EASE, delay }}>
        {children}
      </motion.span>
    </span>
  );
}

/** Per-letter split text reveal. */
export function SplitText({ text, className = "", delay = 0, stagger = 0.04 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span key={i} aria-hidden className="inline-block" initial={{ y: "105%", rotate: 6 }} animate={{ y: "0%", rotate: 0 }} transition={{ duration: 1.2, ease: EASE, delay: delay + i * stagger }}>
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

/** Botanical vines that draw themselves along the page edges as you scroll. */
const VINE = "M40 0 C 10 80, 70 140, 40 220 S 10 360, 45 440 S 80 580, 35 660 S 5 800, 40 900";
function Leaf({ i, progress }: { i: number; progress: MotionValue<number> }) {
  const pathLength = useTransform(progress, [i / 10, i / 10 + 0.12], [0, 1]);
  const y = i * 100 + 40, d = i % 2 ? 1 : -1;
  return <motion.path d={`M40 ${y} q ${26 * d} -14 ${30 * d} -34 q ${-18 * d} 6 ${-30 * d} 34`} fill="none" stroke="#C9A86A" strokeWidth="0.8" style={{ pathLength }} />;
}
function VineSide({ flip, progress }: { flip?: boolean; progress: MotionValue<number> }) {
  const len = useTransform(progress, [0, 0.9], [0.05, 1]);
  return (
    <svg viewBox="0 0 80 900" preserveAspectRatio="none" className={`fixed top-0 h-screen w-10 md:w-16 z-[5] pointer-events-none opacity-60 ${flip ? "right-0 -scale-x-100" : "left-0"} hidden sm:block`}>
      <motion.path d={VINE} fill="none" stroke="#C9A86A" strokeWidth="1" style={{ pathLength: len }} />
      {Array.from({ length: 9 }, (_, i) => <Leaf key={i} i={i} progress={progress} />)}
    </svg>
  );
}
export function Vines() {
  const { scrollYProgress } = useScroll();
  return (<><VineSide progress={scrollYProgress} /><VineSide flip progress={scrollYProgress} /></>);
}
