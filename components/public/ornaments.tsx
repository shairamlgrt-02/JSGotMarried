"use client";
import { useId } from "react";

/** Symmetrical Victorian flourish divider. */
export function Flourish({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  const half = "M4 20 H70 M70 20 C84 20 88 10 98 11 C106 12 106 22 99 23 C94 24 92 18 97 17 M70 20 C80 22 84 30 92 29 M58 20 C62 14 68 13 72 15";
  return (
    <svg viewBox="0 0 240 40" className={className} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round">
      <path d={half} />
      <path d={half} transform="translate(240 0) scale(-1 1)" />
      <path d="M120 8 L127 20 L120 32 L113 20 Z" />
      <circle cx="120" cy="20" r="2.2" fill={color} />
      <circle cx="106" cy="20" r="1.3" fill={color} /><circle cx="134" cy="20" r="1.3" fill={color} />
    </svg>
  );
}

/** A single paisley (boteh) with inner line work. */
/** Vintage wedding rings — interlocked bands, the engagement ring with a solitaire diamond. (Kept the old name so every spot updates.) */
export function Paisley({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 92" className={className} fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      {/* engagement ring */}
      <ellipse cx="24" cy="58" rx="16" ry="17" />
      <ellipse cx="24" cy="58" rx="13" ry="14" strokeWidth=".6" />
      {/* wedding band, interlocked */}
      <ellipse cx="38" cy="64" rx="15" ry="16" />
      <ellipse cx="38" cy="64" rx="12.2" ry="13.2" strokeWidth=".6" />
      {/* setting + diamond */}
      <path d="M19 42 L21 37 H27 L29 42" />
      <path d="M17 37 H31 L27 31 H21 Z" />
      <path d="M17 37 L24 47 L31 37 M21 31 L24 37 L27 31" strokeWidth=".6" />
      {/* sparkle */}
      <path d="M24 18 V25 M20.5 21.5 H27.5 M36 24 V28 M34 26 H38 M12 26 V29 M10.5 27.5 H13.5" strokeWidth=".8" />
      {/* milgrain dots on the band */}
      {Array.from({ length: 9 }, (_, k) => { const a = Math.PI * (0.15 + k * 0.085); return <circle key={k} cx={38 + 13.6 * Math.cos(a)} cy={64 + 14.6 * Math.sin(a)} r=".6" fill={color} stroke="none" />; })}
    </svg>
  );
}
export const Rings = Paisley;

/** Corner ornament: tiny rings + curling filigree. Rotate for other corners. */
export function Corner({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round">
      <path d="M6 134 V40 C6 20 20 6 40 6 H134" />
      <path d="M14 134 V46 C14 28 28 14 46 14 H134" strokeWidth=".6" />
      <path d="M22 60 C22 38 38 22 60 22 C74 22 80 34 72 40 C66 44 60 38 64 34" />
      <path d="M40 82 C30 70 34 52 50 48 C62 45 68 56 60 60" />
      <path d="M82 40 C70 30 52 34 48 50" />
      <path d="M26 100 C34 96 36 88 32 82 M100 26 C96 34 88 36 82 32" />
      <g transform="translate(28 26) rotate(-45 16 24) scale(.5)"><ellipse cx="24" cy="58" rx="16" ry="17" /><ellipse cx="38" cy="64" rx="15" ry="16" /><path d="M19 42 L21 37 H27 L29 42 M17 37 H31 L27 31 H21 Z M17 37 L24 47 L31 37" /></g>
      {[[26, 120], [120, 26], [30, 110], [110, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill={color} />)}
    </svg>
  );
}

/** Four realistic embossed corners positioned inside a relative parent. */
export function Corners({ className = "w-20 h-20 md:w-28 md:h-28", inset = "0.75rem" }: { className?: string; color?: string; inset?: string }) {
  const pos = [{ top: inset, left: inset }, { top: inset, right: inset, transform: "scaleX(-1)" }, { bottom: inset, left: inset, transform: "scaleY(-1)" }, { bottom: inset, right: inset, transform: "scale(-1,-1)" }];
  // CSS backgrounds, not <img>: a missing asset degrades silently instead of showing a broken-image glyph
  return <>{pos.map((s, i) => <div key={i} aria-hidden className={`absolute pointer-events-none bg-[url('/img/corner.webp')] bg-center bg-no-repeat bg-contain drop-shadow-[1px_3px_2px_rgba(61,47,38,.28)] ${className}`} style={s as React.CSSProperties} />)}</>;
}

/** Real lace trim strip (photographic), repeated horizontally. `flip` for a top edge. */
export function LaceEdge({ className = "", flip = false }: { className?: string; color?: string; stroke?: string; flip?: boolean }) {
  return (
    <div aria-hidden className={`w-full h-10 md:h-14 bg-[url('/img/lacetrim.webp')] bg-repeat-x bg-[length:auto_100%] drop-shadow-[0_3px_2px_rgba(61,47,38,.25)] ${className}`} style={flip ? { transform: "scaleY(-1)" } : undefined} />
  );
}

/** Lace mesh fill for envelope pockets etc. */
export function LaceMeshDefs({ id, bg = "#F6EFE3", stroke = "#CDBBA7" }: { id: string; bg?: string; stroke?: string }) {
  return (
    <defs>
      <pattern id={`${id}-mesh`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill={bg} />
        <path d="M0 0 H10 M0 0 V10" stroke={stroke} strokeWidth=".45" />
      </pattern>
      <pattern id={`${id}-flower`} width="90" height="90" patternUnits="userSpaceOnUse">
        <rect width="90" height="90" fill={`url(#${id}-mesh)`} />
        <g fill="#FBF7EF" stroke={stroke} strokeWidth=".8">
          {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx="45" cy="33" rx="6" ry="12" transform={`rotate(${i * 60} 45 45)`} />)}
          <circle cx="45" cy="45" r="5" />
          {Array.from({ length: 4 }, (_, i) => <ellipse key={`s${i}`} cx="4" cy="-4" rx="3" ry="6" transform={`rotate(${i * 90 + 45} 0 0)`} />)}
          {Array.from({ length: 4 }, (_, i) => <ellipse key={`t${i}`} cx="94" cy="86" rx="3" ry="6" transform={`rotate(${i * 90 + 45} 90 90)`} />)}
        </g>
        <path d="M45 57 C40 70 30 72 22 80 M45 57 C50 70 60 72 68 80 M33 45 C22 42 16 32 10 24 M57 45 C68 42 74 32 80 24" fill="none" stroke={stroke} strokeWidth=".7" />
      </pattern>
    </defs>
  );
}

/** Carved 3D Victorian oval frame (transparent cut-out). Children render inside the opening. */
export function OvalFrame({ children, className = "" }: { children?: React.ReactNode; className?: string; color?: string }) {
  return (
    <div className={`relative aspect-[700/1072] ${className}`}>
      <div className="absolute overflow-hidden" style={{ left: "18.5%", right: "18.8%", top: "23.3%", bottom: "18.8%", borderRadius: "50%" }}>
        {children}
        <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_6px_18px_rgba(40,28,20,.45)] pointer-events-none" />
      </div>
      <img src="/img/frame.webp" alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_2px_rgba(61,47,38,.22)] drop-shadow-[0_9px_16px_rgba(61,47,38,.10)]" />
    </div>
  );
}

/** Mix a hex toward white (t>0) or black (t<0). */
const mix = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, "0")}`;
};

/** A jewel dot — the entourage wears gems, not flat paint. Coloured stones are cut en
 *  cabochon like the reference: polished dome, marbled interior, deep shadowed rim,
 *  a soft gloss top-left and a fire-glow bottom-right. No metal bezel, ever. */
export function GemDot({ hex, kind = "gem", name, className = "" }: { hex: string; kind?: "gem" | "pearl" | "onyx" | "geode"; name?: string; className?: string }) {
  const base = kind === "pearl" ? "#F4EFE6" : hex;
  const cabochon = (gloss: string) =>
    [
      gloss,
      // fire-glow, bottom right
      `radial-gradient(circle at 71% 75%, rgba(255,255,255,.85) 0 5%, ${mix(base, 0.4)}aa 13%, transparent 42%)`,
      // marbled veins through the stone
      `conic-gradient(from 200deg at 56% 44%, transparent 0deg, rgba(255,255,255,.13) 24deg, transparent 46deg, rgba(0,0,0,.17) 78deg, transparent 104deg, rgba(255,255,255,.10) 140deg, transparent 168deg, rgba(0,0,0,.15) 210deg, transparent 240deg, rgba(255,255,255,.12) 286deg, transparent 318deg)`,
      // cloudy heart
      `radial-gradient(circle at 46% 58%, ${mix(base, 0.22)}66 0%, transparent 46%)`,
      // domed body, dark rim
      `radial-gradient(circle at 50% 42%, ${mix(base, 0.5)} 0%, ${base} 44%, ${mix(base, -0.45)} 76%, ${mix(base, -0.72)} 100%)`,
    ].join(", ");
  const facets =
    kind === "pearl"
      ? `radial-gradient(circle at 33% 28%, rgba(255,255,255,.98) 0 8%, rgba(255,255,255,.5) 16%, transparent 30%), radial-gradient(circle at 68% 62%, rgba(255,190,210,.5), transparent 42%), radial-gradient(circle at 55% 40%, rgba(190,235,225,.45), transparent 46%), linear-gradient(160deg, #FFFFFF, #EDE4D6 55%, #D9CCBB)`
      : kind === "onyx"
        ? cabochon(`radial-gradient(ellipse 42% 30% at 33% 25%, rgba(255,255,255,.96) 0 12%, rgba(255,255,255,.35) 42%, transparent 74%)`)
        : kind === "geode"
          ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,.9) 0 6%, transparent 22%), repeating-conic-gradient(from 40deg at 50% 50%, ${mix(base, -0.35)} 0 9%, ${mix(base, 0.25)} 9% 16%, ${mix(base, -0.12)} 16% 27%)`
          : cabochon(`radial-gradient(ellipse 46% 34% at 33% 24%, rgba(255,255,255,.95) 0 10%, rgba(255,255,255,.5) 40%, transparent 74%)`);
  return (
    <span title={name} aria-label={name} className={`inline-block rounded-full ring-2 ring-lace ${className}`}
      style={{ backgroundColor: base, backgroundImage: facets, boxShadow: "inset 0 -3px 6px rgba(0,0,0,.35), inset 0 2px 3px rgba(255,255,255,.35), 0 2px 4px rgba(61,47,38,.35)" }} />
  );
}
