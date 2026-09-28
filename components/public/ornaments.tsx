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
export function Paisley({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 60 92" className={className} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round">
      <path d="M30 88 C8 80 2 56 12 38 C22 20 44 16 46 4 C52 18 58 34 54 54 C50 76 42 86 30 88 Z" />
      <path d="M30 78 C17 72 14 57 21 46 C28 35 40 33 43 24 C47 36 49 49 45 60 C41 71 37 76 30 78 Z" />
      <path d="M30 68 C23 64 22 55 27 49 C31 44 37 42 39 37 C41 46 41 54 38 60 C36 64 34 67 30 68 Z" />
      <path d="M46 4 C40 6 36 3 38 0" />
      {[[30, 58], [24, 70], [37, 72], [18, 56], [42, 48]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.1" fill={color} />)}
      {Array.from({ length: 11 }, (_, i) => { const t = i / 10; const x = 30 - 26 * Math.sin(t * Math.PI) * (1 - t * 0.3) - 3; const y = 90 - t * 60; return <circle key={`b${i}`} cx={x} cy={y} r="0.9" fill={color} />; })}
    </svg>
  );
}

/** Corner ornament: paisley + curling filigree. Rotate for other corners. */
export function Corner({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round">
      <path d="M6 134 V40 C6 20 20 6 40 6 H134" />
      <path d="M14 134 V46 C14 28 28 14 46 14 H134" strokeWidth=".6" />
      <path d="M22 60 C22 38 38 22 60 22 C74 22 80 34 72 40 C66 44 60 38 64 34" />
      <path d="M40 82 C30 70 34 52 50 48 C62 45 68 56 60 60" />
      <path d="M82 40 C70 30 52 34 48 50" />
      <path d="M26 100 C34 96 36 88 32 82 M100 26 C96 34 88 36 82 32" />
      <g transform="translate(30 30) rotate(-45 20 30) scale(.55)"><path d="M30 88 C8 80 2 56 12 38 C22 20 44 16 46 4 C52 18 58 34 54 54 C50 76 42 86 30 88 Z" /><path d="M30 76 C18 70 16 56 22 46 C28 36 40 34 42 26 C46 38 48 50 44 60 C40 70 36 74 30 76 Z" /></g>
      {[[26, 120], [120, 26], [30, 110], [110, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill={color} />)}
    </svg>
  );
}

/** Four realistic embossed corners positioned inside a relative parent. */
export function Corners({ className = "w-20 h-20 md:w-28 md:h-28", inset = "0.75rem" }: { className?: string; color?: string; inset?: string }) {
  const pos = [{ top: inset, left: inset }, { top: inset, right: inset, transform: "scaleX(-1)" }, { bottom: inset, left: inset, transform: "scaleY(-1)" }, { bottom: inset, right: inset, transform: "scale(-1,-1)" }];
  return <>{pos.map((s, i) => <img key={i} src="/img/corner.jpg" alt="" aria-hidden className={`absolute pointer-events-none emboss ${className}`} style={s as React.CSSProperties} />)}</>;
}

/** Real lace trim strip (photographic), repeated horizontally. `flip` for a top edge. */
export function LaceEdge({ className = "", flip = false }: { className?: string; color?: string; stroke?: string; flip?: boolean }) {
  return (
    <div aria-hidden className={`w-full h-10 md:h-14 bg-[url('/img/lacetrim.jpg')] bg-repeat-x bg-[length:auto_100%] mix-blend-multiply drop-shadow-[0_3px_3px_rgba(61,47,38,.25)] ${className}`} style={flip ? { transform: "scaleY(-1)" } : undefined} />
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

/** Realistic embossed Victorian oval frame. Children render inside the oval. */
export function OvalFrame({ children, className = "" }: { children?: React.ReactNode; className?: string; color?: string }) {
  return (
    <div className={`relative aspect-[700/985] ${className}`}>
      <div className="absolute overflow-hidden shadow-[inset_0_4px_14px_rgba(61,47,38,.35)]" style={{ left: "21.5%", right: "20.6%", top: "21.1%", bottom: "21.1%", borderRadius: "50%" }}>{children}</div>
      <img src="/img/frame.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full emboss pointer-events-none" />
    </div>
  );
}
