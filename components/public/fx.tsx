"use client";
import { motion, useScroll, useSpring } from "framer-motion";
import Lenis from "lenis";
import { useEffect } from "react";

export const EASE = [0.76, 0, 0.24, 1] as const;

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

/** Soft fade-up reveal. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.1, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}
