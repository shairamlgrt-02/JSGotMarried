"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

type PetalSprite = { canvas: HTMLCanvasElement; extent: number };
type Petal = { x: number; y: number; z: number; size: number; vx: number; vy: number; rot: number; vr: number; flip: number; vf: number; hue: number; sprite: PetalSprite };
type Mote = { x: number; y: number; r: number; vx: number; vy: number; tw: number };

/**
 * Fixed background: moving damask wallpaper, candlelight glow,
 * drifting ivory rose petals (fake-3D flip) and floating dust motes.
 */
export default function Ambience() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll();
  const damaskY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, raf = 0;
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    let petals: Petal[] = [], motes: Mote[] = [];
    let wind = 0, lastScroll = window.scrollY;
    const sprites = new Map<string, PetalSprite>();

    // Petal shape, shading and shadow never change while it drifts. Bake them once into a tiny
    // canvas sprite, then each animation frame only moves, rotates and draws that cached image.
    const getSprite = (size: number, warm: boolean): PetalSprite => {
      const key = `${size}-${warm ? "warm" : "ivory"}`;
      const existing = sprites.get(key);
      if (existing) return existing;

      const padding = mobile ? 2 : Math.ceil(size * 0.75);
      const extent = size + padding;
      const image = document.createElement("canvas");
      image.width = Math.ceil(extent * 2 * dpr);
      image.height = Math.ceil(extent * 2 * dpr);
      const g = image.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.translate(extent, extent);

      const gradient = g.createRadialGradient(-size * 0.2, -size * 0.3, size * 0.1, 0, 0, size * 1.1);
      gradient.addColorStop(0, "rgba(255,253,248,0.97)");
      gradient.addColorStop(0.6, warm ? "rgba(246,236,222,0.95)" : "rgba(250,244,236,0.95)");
      gradient.addColorStop(1, warm ? "rgba(226,208,190,0.9)" : "rgba(232,220,206,0.9)");
      g.fillStyle = gradient;
      if (!mobile) {
        const depth = size / 15;
        g.shadowColor = "rgba(90,70,58,0.18)";
        g.shadowBlur = 6 * depth;
        g.shadowOffsetY = 3 * depth;
      }
      g.beginPath();
      g.moveTo(0, -size);
      g.bezierCurveTo(size * 0.95, -size * 0.9, size * 0.9, size * 0.45, 0, size);
      g.bezierCurveTo(-size * 0.9, size * 0.45, -size * 0.95, -size * 0.9, 0, -size);
      g.fill();
      g.shadowColor = "transparent";
      g.strokeStyle = "rgba(200,180,160,0.35)";
      g.lineWidth = 0.6;
      g.beginPath();
      g.moveTo(0, -size * 0.7);
      g.quadraticCurveTo(size * 0.1, 0, 0, size * 0.8);
      g.stroke();

      const sprite = { canvas: image, extent };
      sprites.set(key, sprite);
      return sprite;
    };

    const newPetal = (initial: boolean): Petal => {
      const z = 0.4 + Math.random() * 0.9; // depth: small+slow = far
      const size = Math.round((10 + Math.random() * 12) * z);
      const hue = Math.random();
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : -40, z,
        size, vx: (Math.random() - 0.3) * 0.4 * z, vy: (0.35 + Math.random() * 0.5) * z,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.02, flip: Math.random() * Math.PI * 2, vf: 0.01 + Math.random() * 0.03,
        hue, sprite: getSprite(size, hue > 0.6),
      };
    };
    const resize = () => {
      dpr = Math.min(window.innerWidth < 700 ? 1.25 : 2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprites.clear();
      const n = W < 700 ? 10 : 24;
      petals = Array.from({ length: n }, () => newPetal(true));
      motes = Array.from({ length: W < 700 ? 18 : 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 0.15, vy: -0.05 - Math.random() * 0.15, tw: Math.random() * 6 }));
    };

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.flip) * 0.85 + 0.15 * Math.sign(Math.cos(p.flip) || 1), 1); // 3D flip illusion
      ctx.drawImage(p.sprite.canvas, -p.sprite.extent, -p.sprite.extent, p.sprite.extent * 2, p.sprite.extent * 2);
      ctx.restore();
    };

    let t = 0;
    const loop = () => {
      t += 1;
      const sc = window.scrollY; wind += ((sc - lastScroll) * 0.02 - wind) * 0.05; lastScroll = sc;
      ctx.clearRect(0, 0, W, H);
      // dust motes in the candle light
      for (const m of motes) {
        m.x += m.vx + Math.sin((t + m.tw * 100) / 200) * 0.1; m.y += m.vy - wind * 0.3;
        if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; } if (m.y > H + 5) m.y = -5;
        if (m.x < -5) m.x = W + 5; if (m.x > W + 5) m.x = -5;
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t / 40 + m.tw));
        ctx.fillStyle = `rgba(255,236,200,${a})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of petals) {
        p.y += p.vy + wind * p.z * 0.6; p.x += p.vx + Math.sin((t + p.hue * 500) / 90) * 0.35 * p.z;
        p.rot += p.vr; p.flip += p.vf;
        if (p.y > H + 40 || p.x < -60 || p.x > W + 60) Object.assign(p, newPetal(false));
        if (p.y < -60) p.y = H + 30;
        drawPetal(p);
      }
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => {
      resize();
      if (reduce) petals.forEach(drawPetal);
    };
    const onVisibilityChange = () => {
      if (reduce) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (reduce) petals.forEach(drawPetal);
    else if (!document.hidden) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* damask wallpaper */}
      <motion.div style={{ y: damaskY }} className="absolute inset-x-0 -top-[5%] h-[130%] opacity-[0.16] bg-[url('/img/damask.webp')] will-change-transform bg-[length:900px_auto] md:bg-[length:1200px_auto] bg-repeat" />
      {/* candlelight glow */}
      <div className="absolute -top-[20%] -left-[15%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(255,236,210,0.22),transparent_60%)] animate-[flicker_6s_ease-in-out_infinite] will-change-[opacity,transform]" />
      <div className="absolute -bottom-[25%] -right-[15%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(255,232,205,0.18),transparent_60%)] animate-[flicker_7.5s_ease-in-out_infinite_reverse] will-change-[opacity,transform]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(110,90,75,.10)_100%)]" />
      <canvas ref={canvas} className="absolute inset-0" />
    </div>
  );
}
