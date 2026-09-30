"use client";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
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
    const lenis = new Lenis({ duration: 1.2 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      lenis.scrollTo(a.getAttribute("href")!, { duration: 1.6 });
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); document.removeEventListener("click", onClick); };
  }, []);
  return null;
}

export function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div style={{ scaleX: x }} className="fixed top-0 left-0 right-0 h-[2px] bg-wine/70 origin-left z-[70]" />;
}

/** Soft fade-up reveal — plays once. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} {...rise(delay, 22)}>
      {children}
    </motion.div>
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
