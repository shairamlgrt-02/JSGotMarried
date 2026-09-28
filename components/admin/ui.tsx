"use client";
import { useEffect, useState } from "react";

export function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-paper text-ink rounded-2xl p-5 md:p-7 shadow-[0_1px_0_rgba(0,0,0,.04),0_20px_40px_-20px_rgba(0,0,0,.4)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 mb-5">
          {title && <h3 className="font-serif text-2xl">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div className="label text-gold">{kicker}</div>
        <h1 className="display text-5xl md:text-6xl mt-2">{title}</h1>
      </div>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  );
}

export function Btn({ children, onClick, variant = "gold", className = "", type = "button", disabled }: { children: React.ReactNode; onClick?: () => void; variant?: "gold" | "ghost" | "dark" | "danger"; className?: string; type?: "button" | "submit"; disabled?: boolean }) {
  const v = {
    gold: "bg-gold text-ink hover:bg-[#d8bb82]",
    ghost: "border border-current/20 hover:border-gold hover:text-gold",
    dark: "bg-ink text-paper hover:bg-espresso",
    danger: "text-burgundy hover:bg-burgundy hover:text-paper",
  }[variant];
  return <button type={type} disabled={disabled} onClick={onClick} className={`label !tracking-[0.18em] rounded-full px-4 py-2.5 transition-colors disabled:opacity-40 ${v} ${className}`}>{children}</button>;
}

/** Text input that keeps local state and commits on blur / Enter — avoids a save per keystroke. */
export function EditText({ value, onSave, className = "", placeholder, type = "text", multiline, rows = 3 }: { value: string | number; onSave: (v: string) => void; className?: string; placeholder?: string; type?: string; multiline?: boolean; rows?: number }) {
  const [v, setV] = useState(String(value ?? ""));
  useEffect(() => setV(String(value ?? "")), [value]);
  const commit = () => { if (v !== String(value ?? "")) onSave(v); };
  const cls = `w-full bg-transparent rounded-md px-2 py-1.5 outline-none border border-transparent hover:border-ink/10 focus:border-gold focus:bg-white/60 transition-colors ${className}`;
  return multiline ? (
    <textarea className={`${cls} resize-y`} rows={rows} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} />
  ) : (
    <input className={cls} type={type} value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
  );
}

export function Select<T extends string>({ value, options, onChange, className = "" }: { value: T; options: readonly T[]; onChange: (v: T) => void; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`bg-transparent rounded-md px-2 py-1.5 border border-ink/10 focus:border-gold outline-none capitalize ${className}`}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

const TAG: Record<string, string> = {
  confirmed: "bg-moss/15 text-moss", booked: "bg-moss/15 text-moss", yes: "bg-moss/15 text-moss",
  quoted: "bg-gold/25 text-espresso", contacted: "bg-amethyst/15 text-amethyst",
  pending: "bg-ink/10 text-ink/60", no: "bg-burgundy/15 text-burgundy",
  critical: "bg-burgundy text-paper", high: "bg-gold/30 text-espresso", medium: "bg-ink/10 text-ink/60",
};
export function Tag({ children }: { children: string }) {
  return <span className={`label !text-[10px] !tracking-[0.15em] px-2.5 py-1 rounded-full whitespace-nowrap ${TAG[children] ?? "bg-ink/10"}`}>{children}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <div className="label text-ink/50">{label}</div>
      <div className="display text-5xl mt-2 tabular-nums">{value}</div>
      {sub && <div className="text-sm text-ink/60 mt-1">{sub}</div>}
    </div>
  );
}

export function Donut({ parts, size = 180, center }: { parts: { value: number; color: string }[]; size?: number; center?: React.ReactNode }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  const r = 70, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" className="-rotate-90 w-full h-full">
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(15,13,10,.07)" strokeWidth="18" />
        {parts.map((p, i) => {
          const len = (Math.max(0, p.value) / total) * C;
          const el = <circle key={i} cx="90" cy="90" r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} style={{ transition: "all .8s cubic-bezier(.76,0,.24,1)" }} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

export function Progress({ value, color = "#C9A86A" }: { value: number; color?: string }) {
  return <div className="h-2 rounded-full bg-ink/10 overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div>;
}

/** Read an image file, downscale it and return a JPEG data URL (keeps localStorage / DB rows small). */
export function fileToDataUrl(file: File, max = 1400): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
    reader.onerror = rej;
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.82));
    };
    reader.readAsDataURL(file);
  });
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
export function download(name: string, content: string, type = "text/csv") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const money = (n: number, cur = "BHD") => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur}`;
