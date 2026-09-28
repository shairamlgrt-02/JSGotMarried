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

/** Four corners positioned inside a relative parent. */
export function Corners({ className = "w-16 h-16 md:w-24 md:h-24", color = "#8C7462", inset = "0.75rem" }: { className?: string; color?: string; inset?: string }) {
  const pos = [{ top: inset, left: inset }, { top: inset, right: inset, transform: "scaleX(-1)" }, { bottom: inset, left: inset, transform: "scaleY(-1)" }, { bottom: inset, right: inset, transform: "scale(-1,-1)" }];
  return <>{pos.map((s, i) => <div key={i} className={`absolute pointer-events-none ${className}`} style={s as React.CSSProperties}><Corner className="w-full h-full" color={color} /></div>)}</>;
}

/** Scalloped lace strip (horizontal). Use `flip` for the bottom edge. */
export function LaceEdge({ className = "", color = "#FCFAF5", stroke = "#C9B8A6", flip = false }: { className?: string; color?: string; stroke?: string; flip?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`w-full block ${className}`} height="34" preserveAspectRatio="none" style={flip ? { transform: "scaleY(-1)" } : undefined}>
      <defs>
        <pattern id={`lace${id}`} width="36" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 0 H36 V14 C36 26 28 32 18 32 C8 32 0 26 0 14 Z" fill={color} stroke={stroke} strokeWidth=".8" />
          <path d="M4 14 C4 23 10 28 18 28 C26 28 32 23 32 14" fill="none" stroke={stroke} strokeWidth=".6" strokeDasharray="1.5 2" />
          <circle cx="18" cy="16" r="3.2" fill="none" stroke={stroke} strokeWidth=".7" />
          <circle cx="18" cy="16" r="1" fill={stroke} />
          <circle cx="7" cy="8" r="1.4" fill="none" stroke={stroke} strokeWidth=".6" /><circle cx="29" cy="8" r="1.4" fill="none" stroke={stroke} strokeWidth=".6" />
          <path d="M12 6 L18 2 L24 6" fill="none" stroke={stroke} strokeWidth=".6" />
        </pattern>
      </defs>
      <rect width="100%" height="34" fill={`url(#lace${id})`} />
    </svg>
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

/** Ornate Victorian oval frame. Children render inside the oval. */
export function OvalFrame({ children, className = "", color = "#B9A591" }: { children?: React.ReactNode; className?: string; color?: string }) {
  const beads = Array.from({ length: 64 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return [150 + Math.cos(a) * 118, 200 + Math.sin(a) * 168]; });
  return (
    <div className={`relative aspect-[3/4] ${className}`}>
      <div className="absolute overflow-hidden" style={{ left: "17%", right: "17%", top: "16%", bottom: "16%", borderRadius: "50%" }}>{children}</div>
      <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full pointer-events-none" fill="none" stroke={color} strokeLinecap="round">
        <ellipse cx="150" cy="200" rx="104" ry="138" strokeWidth="3" />
        <ellipse cx="150" cy="200" rx="110" ry="146" strokeWidth="1" />
        <ellipse cx="150" cy="200" rx="126" ry="176" strokeWidth="1.2" />
        {beads.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.1" fill="#FCFAF5" strokeWidth=".8" />)}
        {/* crest top */}
        <g strokeWidth="1.1">
          <path d="M150 4 C140 16 140 26 150 34 C160 26 160 16 150 4 Z" />
          <path d="M150 34 C130 30 112 16 96 26 C86 32 92 44 102 40 M150 34 C170 30 188 16 204 26 C214 32 208 44 198 40" />
          <path d="M120 30 C110 12 90 10 82 22 M180 30 C190 12 210 10 218 22" />
          <path d="M150 40 C138 44 128 42 122 36 M150 40 C162 44 172 42 178 36" />
        </g>
        {/* crest bottom */}
        <g strokeWidth="1.1" transform="translate(0 400) scale(1 -1)">
          <path d="M150 6 C142 16 142 24 150 30 C158 24 158 16 150 6 Z" />
          <path d="M150 30 C132 28 118 18 104 26 C96 31 100 40 108 37 M150 30 C168 28 182 18 196 26 C204 31 200 40 192 37" />
        </g>
        {/* side scrolls */}
        {[1, -1].map((s) => (
          <g key={s} transform={s === -1 ? "translate(300 0) scale(-1 1)" : ""} strokeWidth="1">
            <path d="M22 200 C10 180 14 160 28 156 C38 154 40 166 32 168" />
            <path d="M22 200 C10 220 14 240 28 244 C38 246 40 234 32 232" />
            <path d="M30 120 C18 110 20 94 32 92 M30 280 C18 290 20 306 32 308" />
          </g>
        ))}
      </svg>
    </div>
  );
}
