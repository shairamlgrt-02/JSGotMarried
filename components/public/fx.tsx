"use client";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

/** In-out curve: flips and the FAQ accordion (things the guest triggers). */
export const EASE = [0.76, 0, 0.24, 1] as const;
/** Calm deceleration for entrances: starts moving at once and settles softly — no snap, no overshoot. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * The one entrance used across the page: fade + a small rise, played ONCE when the block first scrolls into view.
 * Transform/opacity only, so it can never change the page height.  Spread it: <motion.div {...rise()} />
 */
export const rise = (delay = 0, y = 24) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-8%" },
  transition: { duration: 0.9, ease: EASE_OUT, delay },
});

export function SmoothScroll() {
  useEffect(() => {
    // A time-based lerp smooths successive wheel/trackpad events without restarting a long tween
    // on every input. Anchor jumps below keep their own distance-based duration.
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, respectReducedMotion: true });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      // glide instead of jump: long trips (e.g. "RSVP now") take their time on purpose, so the
      // guest travels the whole letter and watches it unroll on the way — never a teleport.
      const target = document.querySelector(a.getAttribute("href")!) as HTMLElement | null;
      const dist = target ? Math.abs(target.getBoundingClientRect().top + scrollY - scrollY) : innerHeight;
      const duration = Math.min(8, Math.max(1.4, dist / 1300));
      lenis.scrollTo(a.getAttribute("href")!, { duration, offset: -8 });
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); document.removeEventListener("click", onClick); };
  }, []);
  return null;
}

export function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div style={{ scaleX: x }} className="fixed top-0 left-0 right-0 h-[5px] origin-left z-[70] bg-wine shadow-[0_1px_8px_rgba(110,31,46,.65),0_0_0_1px_rgba(251,248,242,.35)_inset]">
      <span aria-hidden className="absolute right-0 top-0 bottom-0 w-6 bg-[linear-gradient(90deg,transparent,rgba(251,248,242,.5))]" />
    </motion.div>
  );
}

/** Soft fade-up reveal — plays once. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} {...rise(delay, 22)}>
      {children}
    </motion.div>
  );
}

/** A delicate section divider that keeps the gentle animated down cue for natural scrolling. */
export function ScrollContinue() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="mx-auto my-4 flex w-full max-w-sm items-center justify-center gap-3 px-6 py-2 md:my-6 md:gap-4">
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-taupe/45" />
      <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-wine/75">
        <motion.span aria-hidden="true" animate={reduceMotion ? undefined : { y: [-2, 3, -2] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="leading-none">↓</motion.span>
        <span className="font-serif text-xs italic">Scroll to continue</span>
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-taupe/45" />
    </div>
  );
}

/**
 * 3D tilt with moving light glare. Follows a mouse/pen pointer (desktop). Touch screens stay perfectly still —
 * no device-tilt wobble, so cards never drift while a phone is being held or scrolled.
 * `global` = react to the pointer anywhere on the page (used for the hero).
 */
export function Tilt({ children, className = "", max = 8, global = false, glare = true, style }: { children: React.ReactNode; className?: string; max?: number; global?: boolean; glare?: boolean; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 90, damping: 16 }), ry = useSpring(0, { stiffness: 90, damping: 16 });
  const gx = useSpring(50, { stiffness: 90, damping: 16 }), gy = useSpring(30, { stiffness: 90, damping: 16 });
  const glareBg = useTransform([gx, gy] as never, ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,250,240,.35), transparent 55%)`);
  useEffect(() => {
    const el = ref.current!;
    const set = (nx: number, ny: number) => { ry.set(nx * max); rx.set(-ny * max); gx.set(50 + nx * 50); gy.set(50 + ny * 50); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = global ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : el.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    const onLeave = () => set(0, 0);
    const target: Window | HTMLElement = global ? window : el;
    target.addEventListener("pointermove", onMove as EventListener);
    el.addEventListener("pointerleave", onLeave);
    return () => { target.removeEventListener("pointermove", onMove as EventListener); el.removeEventListener("pointerleave", onLeave); };
  }, [global, max, rx, ry, gx, gy]);
  return (
    <div ref={ref} className={className} style={{ perspective: 1400, ...style }}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative w-full h-full">
        {children}
        {glare && <motion.div style={{ background: glareBg }} className="absolute inset-0 pointer-events-none z-[50]" />}
      </motion.div>
    </div>
  );
}

/** Scroll parallax wrapper: moves children at a different speed than the page. */
export function Parallax({ children, speed = 0.2, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`]);
  return <motion.div ref={ref} style={{ y }} className={className}>{children}</motion.div>;
}
