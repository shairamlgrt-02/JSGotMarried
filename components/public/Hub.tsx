"use client";
import { useEffect } from "react";
import { fullDate } from "@/components/public/Envelope";
import { useCountdown } from "@/lib/hooks";
import { trackMessageLinkVisit } from "@/lib/db";
import type { WeddingInfo } from "@/lib/types";

type PageTile = {
  href: string;
  icon: string;
  title: string;
  text: string;
  label: string;
  tone: string;
  external?: boolean;
};

function CountdownBar({ date }: { date: string }) {
  const { ready, days } = useCountdown(date);
  const message = !ready ? "Counting down to our day" : days > 0 ? `${days} days until we celebrate` : "Welcome, Guest!";
  return (
    <div role="status" aria-live="polite" className="border-b border-[#DDC8C1] bg-[#F4E8E4]/90 text-[#6B1D2A]">
      <p className="mx-auto flex h-8 max-w-6xl items-center justify-center gap-2 px-4 text-[10px] font-medium tracking-[0.12em] sm:h-9 sm:text-[11px]">
        <span aria-hidden className="text-[#A36569]">♡</span>
        <span>{message}</span>
        <span aria-hidden className="text-[#A36569]/70">·</span>
        <span className="font-serif tracking-[0.16em]">{fullDate(date)}</span>
      </p>
    </div>
  );
}

function NavIcon({ name }: { name: "home" | "gifts" | "chat" | "preview" | "games" }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5.3v-6.5h-4.4V21H4.5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "gifts") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M3 10h18v4H3zM5 14v7h14v-7M12 10v11" /><path d="M12 10H8.2C5 10 5 5.3 8 5.3c2.4 0 4 4.7 4 4.7Zm0 0h3.8c3.2 0 3.2-4.7.2-4.7-2.4 0-4 4.7-4 4.7Z" /></svg>;
  if (name === "chat") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M20.2 11.5a7.8 7.8 0 0 1-8.1 7.4 9 9 0 0 1-3.6-.8L4 20l1.3-3.8a7.2 7.2 0 0 1-1.5-4.5A7.8 7.8 0 0 1 12 4a7.8 7.8 0 0 1 8.2 7.5Z" /><path d="M8 11.5h.1m3.9 0h.1m3.9 0h.1" /></svg>;
  if (name === "preview") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /><path d="M12 17s-3.2-1.9-3.2-3.8c0-1.6 2-2.1 3.2-.6 1.2-1.5 3.2-1 3.2.6 0 1.9-3.2 3.8-3.2 3.8Z" fill="currentColor" stroke="none" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M6.5 9h11a4 4 0 0 1 3.8 5.2l-1 3.2a2.5 2.5 0 0 1-4.1 1.1L14 16h-4l-2.2 2.5a2.5 2.5 0 0 1-4.1-1.1l-1-3.2A4 4 0 0 1 6.5 9Z" /><path d="M7.5 11.5v4m-2-2h4m7.3-.5h.1m2 2h.1" /></svg>;
}

function BottomNav() {
  const nav = [
    { name: "home" as const, label: "Home", href: "/", active: true },
    { name: "gifts" as const, label: "Gifts", href: "/gifts" },
    { name: "chat" as const, label: "Chat & Post", href: "/upload" },
    { name: "preview" as const, label: "Program", href: "/preview" },
    { name: "games" as const, label: "Games", href: "/games" },
  ];
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E3D6CE] bg-[#FFFCF7]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(65,42,34,.55)] backdrop-blur-xl">
      <div className="mx-auto grid h-[62px] max-w-xl grid-cols-5 items-center px-2">
        {nav.map((item) => (
          <a key={item.name} href={item.href} aria-label={item.name === "games" ? "Games and raffles" : item.name === "preview" ? "Wedding invitation and program" : item.label} aria-current={item.active ? "page" : undefined} className={`group flex h-full flex-col items-center justify-center gap-1 no-underline transition-colors ${item.active ? "text-[#6B1D2A]" : "text-[#87776F] hover:text-[#6B1D2A]"}`}>
            <span className={`grid h-8 w-11 place-items-center rounded-full transition-colors ${item.active ? "bg-[#F2E4E0]" : "group-hover:bg-[#F7F0EA]"}`}><span className="h-[21px] w-[21px]"><NavIcon name={item.name} /></span></span>
            <span className="whitespace-nowrap text-[8px] font-medium tracking-[0.02em] sm:text-[9px]">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function Hub({ info }: { info: WeddingInfo }) {
  const handle = (info.instagram || "").replace(/^@/, "").trim();
  useEffect(() => {
    trackMessageLinkVisit();
  }, []);

  const pages: PageTile[] = [
    { href: "/gifts", icon: "🎁", title: "Gift list", text: "Browse the wish list and mark a gift you have chosen.", label: "OPEN GIFTS", tone: "bg-[linear-gradient(145deg,#F5EBD6,#EDE0C8)] text-[#51432F]" },
    { href: "/upload", icon: "💬", title: "Upload Wedding Photos & Messages", text: "Post wedding photos, write messages and share voice notes with everyone.", label: "UPLOAD & POST", tone: "bg-[linear-gradient(145deg,#F5E4E1,#EBD6D3)] text-[#572F35]" },
    { href: "/rsvp", icon: "💌", title: "Send your reply", text: "Let us know if you can celebrate with us. Your invite code is on your card.", label: "REPLY WITH MY CODE", tone: "bg-[linear-gradient(145deg,#762A3B,#551724)] text-[#FFF9F4]" },
    { href: "/preview", icon: "✉️", title: "Wedding invitation", text: "Revisit the full invitation, details and the story of our day.", label: "VIEW INVITATION", tone: "bg-[linear-gradient(145deg,#E9EEE5,#DDE7DA)] text-[#34463A]" },
    { href: "/games", icon: "🎟️", title: "Games & raffles", text: "Raffle numbers and party games will be here on the wedding day.", label: "OPENS NOVEMBER 11", tone: "bg-[linear-gradient(145deg,#EEE7F0,#E5DCE9)] text-[#51415A]" },
    ...(handle ? [{ href: `https://instagram.com/${handle}`, external: true, icon: "◎", title: "Follow along", text: `Countdown moments and behind-the-scenes from @${handle}.`, label: "OPEN INSTAGRAM", tone: "bg-[linear-gradient(145deg,#F4E3D9,#EED8C8)] text-[#654438]" }] : []),
  ];

  return (
    <div id="top" className="min-h-[100svh] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-ink">
      <header className="sticky top-0 z-40 w-full bg-[#6B1D2A] text-[#FFF9F4] shadow-[0_4px_18px_-12px_rgba(56,19,27,.8)]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:h-[76px] sm:px-6">
          <a href="/" className="flex min-w-0 items-center gap-3 no-underline" aria-label="Jeger and Shaira wedding home">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/35 bg-white/10 font-serif text-[13px] tracking-[-0.08em] text-white sm:h-11 sm:w-11">J&amp;S</span>
            <span className="min-w-0">
              <span className="micro block text-[8px] tracking-[0.25em] text-white/70 sm:text-[9px]">THE WEDDING OF</span>
              <span className="script block truncate text-[27px] leading-[1.05] text-white sm:text-[32px]">{info.groom} &amp; {info.bride}</span>
            </span>
          </a>
          <span className="hidden shrink-0 font-serif text-[11px] tracking-[0.16em] text-white/75 sm:block">{fullDate(info.date)}</span>
        </div>
      </header>

      <CountdownBar date={info.date} />

      <main className="mx-auto w-full max-w-5xl px-3 pb-6 pt-4 sm:px-6 sm:pt-5">
        <div className="mb-3 flex items-end justify-between gap-3 px-1 sm:mb-4 sm:px-0">
          <div>
            <p className="micro text-[8px] tracking-[0.24em] text-taupe sm:text-[9px]">YOUR WEDDING-DAY GUIDE</p>
            <h1 className="mt-1 font-serif text-[23px] font-semibold leading-tight text-[#493631] sm:text-[28px]">Everything, all in one place</h1>
          </div>
          <span className="mb-0.5 whitespace-nowrap font-serif text-[10px] italic text-taupe sm:text-xs">Tap a page to open it</span>
        </div>

        <section aria-label="Wedding website pages" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-4">
          {pages.map((page, index) => (
            <a
              key={page.title}
              href={page.href}
              target={page.external ? "_blank" : undefined}
              rel={page.external ? "noopener noreferrer" : undefined}
              className={`group relative flex min-h-[158px] flex-col justify-between overflow-hidden rounded-[18px] p-3.5 no-underline shadow-[0_8px_22px_-18px_rgba(61,42,35,.5)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_-18px_rgba(61,42,35,.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1D2A] sm:min-h-[178px] sm:rounded-[21px] sm:p-4 md:min-h-[188px] md:p-5 ${page.tone}`}
            >
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 text-[88px] leading-none opacity-[0.08] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 sm:text-[112px]">{page.icon}</span>
              <span className="relative flex items-start justify-between gap-2">
                <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/65 text-[19px] shadow-sm ring-1 ring-white/60 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-[22px]">{page.icon}</span>
                <span className="micro pt-1 text-[7px] tracking-[0.14em] opacity-55 sm:text-[8px]">0{index + 1}</span>
              </span>
              <span className="relative block">
                <span className="block font-serif text-[17px] font-semibold leading-tight sm:text-[20px]">{page.title}</span>
                <span className="mt-1 block line-clamp-2 font-serif text-[10px] leading-snug opacity-75 sm:mt-1.5 sm:text-[13px]">{page.text}</span>
              </span>
              <span className="relative flex items-center justify-between gap-2 border-t border-current/15 pt-2 text-[7px] font-semibold tracking-[0.12em] opacity-75 sm:pt-2.5 sm:text-[8px]">
                <span className="truncate">{page.label}</span><span aria-hidden className="text-sm transition-transform group-hover:translate-x-1">{page.external ? "↗" : "→"}</span>
              </span>
            </a>
          ))}
        </section>

        {handle && <p className="mt-4 text-center font-serif text-[11px] italic text-taupe">A little more from the countdown: <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="text-wine underline decoration-wine/30 underline-offset-2">@{handle}</a></p>}
        <p className="mt-4 text-center text-[8px] tracking-[0.18em] text-taupe/75">{info.hashtags.join("  ")}</p>
      </main>

      <BottomNav />
    </div>
  );
}
