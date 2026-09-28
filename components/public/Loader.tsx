"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE } from "./fx";

export default function Loader({ dateLabel }: { dateLabel: string }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const a = setTimeout(() => setPhase(1), 1300);
    const b = setTimeout(() => { setPhase(2); document.documentElement.style.overflow = ""; }, 2700);
    return () => { clearTimeout(a); clearTimeout(b); document.documentElement.style.overflow = ""; };
  }, []);
  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div key="loader" className="fixed inset-0 z-[100] bg-ink flex items-center justify-center" exit={{ y: "-100%" }} transition={{ duration: 1.1, ease: EASE }}>
          <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 1, ease: EASE }}
            className="relative w-44 h-44 rounded-full border border-gold/60 flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border border-gold/30" />
            <AnimatePresence mode="wait">
              {phase === 0 ? (
                <motion.span key="js" className="display text-7xl gold-foil italic" exit={{ opacity: 0, filter: "blur(8px)", scale: 0.8 }} transition={{ duration: 0.5 }}>JS</motion.span>
              ) : (
                <motion.span key="d" className="display text-4xl gold-foil" initial={{ opacity: 0, filter: "blur(8px)", scale: 1.2 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} transition={{ duration: 0.6 }}>{dateLabel}</motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
