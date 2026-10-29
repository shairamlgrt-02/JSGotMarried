"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { fullDate } from "@/components/public/Envelope";
import { useCountdown } from "@/lib/hooks";
import { cleanGuestName, GUEST_NAME_EVENT, GUEST_NAME_KEY, OPEN_GUEST_NAME_EVENT } from "@/lib/guest-identity";
import type { WeddingInfo } from "@/lib/types";

type ActivePage = "home" | "gifts" | "chat" | "program" | "games";

function CountdownBar({ date }: { date: string }) {
  const { ready, days } = useCountdown(date);
  const message = !ready ? "Counting down to our day" : days > 0 ? `${days} days until we celebrate` : "Welcome, Guest!";
  return (
    <div role="status" aria-live="polite" className="border-b border-[#DDC8C1] bg-[#F4E8E4]/90 text-[#6B1D2A]">
      <p className="mx-auto flex h-8 max-w-6xl items-center justify-center gap-2 px-4 text-[10px] font-medium tracking-[0.12em] sm:h-9 sm:text-[11px]">
        <span aria-hidden className="text-[#A36569]">♡</span><span>{message}</span><span aria-hidden className="text-[#A36569]/70">·</span>
        <span className="font-serif tracking-[0.16em]">{fullDate(date)}</span>
      </p>
    </div>
  );
}

function NavIcon({ name }: { name: "home" | "instagram" | "chat" | "program" | "games" }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5.3v-6.5h-4.4V21H4.5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.6" cy="6.7" r=".8" fill="currentColor" stroke="none" /></svg>;
  if (name === "chat") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M20.2 11.5a7.8 7.8 0 0 1-8.1 7.4 9 9 0 0 1-3.6-.8L4 20l1.3-3.8a7.2 7.2 0 0 1-1.5-4.5A7.8 7.8 0 0 1 12 4a7.8 7.8 0 0 1 8.2 7.5Z" /><path d="M8 11.5h.1m3.9 0h.1m3.9 0h.1" /></svg>;
  if (name === "program") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /><path d="M12 17s-3.2-1.9-3.2-3.8c0-1.6 2-2.1 3.2-.6 1.2-1.5 3.2-1 3.2.6 0 1.9-3.2 3.8-3.2 3.8Z" fill="currentColor" stroke="none" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M6.5 9h11a4 4 0 0 1 3.8 5.2l-1 3.2a2.5 2.5 0 0 1-4.1 1.1L14 16h-4l-2.2 2.5a2.5 2.5 0 0 1-4.1-1.1l-1-3.2A4 4 0 0 1 6.5 9Z" /><path d="M7.5 11.5v4m-2-2h4m7.3-.5h.1m2 2h.1" /></svg>;
}

function NameEditor({ initialName, onClose, onSave }: { initialName: string; onClose: () => void; onSave: (name: string) => void }) {
  const [value, setValue] = useState(initialName);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = cleanGuestName(value);
    if (name) onSave(name);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#29181A]/45 p-3 backdrop-blur-[2px] sm:items-center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="guest-name-title" onSubmit={submit} className="w-full max-w-md rounded-[26px] bg-[#FFFCF8] p-5 shadow-2xl ring-1 ring-white/90 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div><p className="micro text-[9px] tracking-[0.2em] text-taupe">YOUR SHARED GUEST NAME</p><h2 id="guest-name-title" className="mt-1 font-serif text-2xl font-semibold text-[#5B3038]">What should we call you?</h2></div>
          <button type="button" onClick={onClose} aria-label="Close name editor" className="grid h-9 w-9 place-items-center rounded-full bg-[#F5ECE7] text-lg text-[#725B55]">×</button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-taupe">This name is shared between the wedding pages and your chat posts on this device.</p>
        <input ref={input} value={value} onChange={(event) => setValue(event.target.value.slice(0, 120))} maxLength={120} autoComplete="name" placeholder="Your name" className="mt-4 w-full rounded-2xl border border-[#DCCBC4] bg-white px-4 py-3 font-serif text-lg text-ink outline-none placeholder:italic placeholder:text-taupe/70 focus:border-[#9B5B64]" />
        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-xs font-medium text-taupe hover:bg-[#F5ECE7]">Cancel</button><button type="submit" disabled={!cleanGuestName(value)} className="rounded-full bg-[#6B1D2A] px-5 py-2.5 text-xs font-semibold tracking-wide text-white hover:bg-[#521522] disabled:opacity-40">Save name</button></div>
      </form>
    </div>
  );
}

export default function SocialShell({ children, info, active }: { children: ReactNode; info: WeddingInfo; active: ActivePage }) {
  const [guestName, setGuestName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const firstName = guestName.trim().split(/\s+/)[0] || "";
  useEffect(() => {
    try { setGuestName(localStorage.getItem(GUEST_NAME_KEY) || ""); } catch { /* private mode */ }
    const onName = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      try { setGuestName(cleanGuestName(detail ?? localStorage.getItem(GUEST_NAME_KEY))); } catch { setGuestName(cleanGuestName(detail)); }
    };
    const onStorage = (event: StorageEvent) => { if (event.key === GUEST_NAME_KEY) setGuestName(cleanGuestName(event.newValue)); };
    const onOpenName = () => setEditingName(true);
    window.addEventListener(GUEST_NAME_EVENT, onName);
    window.addEventListener("storage", onStorage);
    window.addEventListener(OPEN_GUEST_NAME_EVENT, onOpenName);
    return () => {
      window.removeEventListener(GUEST_NAME_EVENT, onName);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(OPEN_GUEST_NAME_EVENT, onOpenName);
    };
  }, []);

  const saveName = (name: string) => {
    setGuestName(name);
    try { localStorage.setItem(GUEST_NAME_KEY, name); } catch { /* private mode */ }
    window.dispatchEvent(new CustomEvent(GUEST_NAME_EVENT, { detail: name }));
    setEditingName(false);
  };

  const nav = [
    { key: "home" as const, label: "Home", href: "/" },
    { key: "instagram" as const, label: "Follow us", href: "https://instagram.com/shaiandjeg", external: true },
    { key: "chat" as const, label: "Chat & Post", href: "/upload" },
    { key: "program" as const, label: "Program", href: "/preview" },
    { key: "games" as const, label: "Games", href: "/games" },
  ];

  return (
    <div className="min-h-[100svh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-ink">
      <header className="sticky top-0 z-40 w-full bg-[#6B1D2A] text-[#FFF9F4] shadow-[0_4px_18px_-12px_rgba(56,19,27,.8)]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-2 px-3 sm:h-[76px] sm:gap-4 sm:px-6">
          <a href="/" className="flex min-w-0 items-center gap-2.5 no-underline sm:gap-3" aria-label="Jeger and Shaira wedding home">
            <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/35 bg-white/10 font-serif text-[11px] tracking-[-0.08em] text-white sm:h-11 sm:w-11 sm:text-[13px]">J&amp;S</span>
            <span className="min-w-0"><span className="micro block text-[7px] tracking-[0.22em] text-white/70 sm:text-[9px]">THE WEDDING OF</span><span className="script block truncate text-[23px] leading-[1.05] text-white sm:text-[32px]">{info.groom} &amp; {info.bride}</span></span>
          </a>
          <span className="hidden shrink-0 font-serif text-[11px] tracking-[0.16em] text-white/75 sm:block">{fullDate(info.date)}</span>
          <button type="button" onClick={() => setEditingName(true)} title={guestName ? `Edit your name: ${guestName}` : "Add your name"} aria-label={guestName ? `Edit your name, currently ${guestName}` : "Add your name"} className="flex max-w-[104px] shrink-0 items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-2.5 py-2 text-[10px] font-medium text-white transition-colors hover:bg-white/20 sm:max-w-[150px] sm:px-3 sm:text-xs">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-sm">{guestName ? guestName.trim().slice(0, 1).toUpperCase() : "＋"}</span><span className="truncate">{guestName ? `As ${firstName}` : "Name"}</span><span aria-hidden>✎</span>
          </button>
        </div>
      </header>
      <CountdownBar date={info.date} />
      {children}
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E3D6CE] bg-[#FFFCF7]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(65,42,34,.55)] backdrop-blur-xl">
        <div className="mx-auto grid h-[62px] max-w-xl grid-cols-5 items-center px-1.5 sm:px-2">
          {nav.map((item) => {
            const selected = item.key === active;
            return <a key={item.key} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined} aria-label={item.external ? "Follow us on Instagram @shaiandjeg" : item.label} aria-current={selected ? "page" : undefined} className={`group flex h-full min-w-0 flex-col items-center justify-center gap-1 no-underline transition-colors ${selected ? "text-[#6B1D2A]" : "text-[#87776F] hover:text-[#6B1D2A]"}`}>
              <span className={`grid h-8 w-10 place-items-center rounded-full transition-colors sm:w-11 ${selected ? "bg-[#F2E4E0]" : "group-hover:bg-[#F7F0EA]"}`}><span className="h-[21px] w-[21px]"><NavIcon name={item.key} /></span></span><span className="whitespace-nowrap text-[7px] font-medium tracking-[0.01em] sm:text-[9px]">{item.label}</span>
            </a>;
          })}
        </div>
      </nav>
      {editingName && <NameEditor initialName={guestName} onClose={() => setEditingName(false)} onSave={saveName} />}
    </div>
  );
}
