"use client";
import { useEffect } from "react";
import SocialShell from "@/components/public/SocialShell";
import { trackMessageLinkVisit } from "@/lib/db";
import type { WeddingInfo } from "@/lib/types";

type PageTile = {
  href: string;
  icon: string;
  title: string;
  text: string;
  label: string;
  tone: string;
};

export default function Hub({ info }: { info: WeddingInfo }) {
  useEffect(() => {
    trackMessageLinkVisit();
  }, []);

  const pages: PageTile[] = [
    { href: "/gifts", icon: "🎁", title: "Gift list", text: "Browse the wish list and mark a gift you have chosen.", label: "OPEN GIFTS", tone: "bg-[linear-gradient(145deg,#F5EBD6,#EDE0C8)] text-[#51432F]" },
    { href: "/upload", icon: "💬", title: "Upload Wedding Photos & Messages", text: "Post wedding photos, write messages and share voice notes with everyone.", label: "UPLOAD & POST", tone: "bg-[linear-gradient(145deg,#F5E4E1,#EBD6D3)] text-[#572F35]" },
    { href: "/preview", icon: "✉️", title: "Wedding invitation", text: "Revisit the full invitation, details and the story of our day.", label: "VIEW INVITATION", tone: "bg-[linear-gradient(145deg,#E9EEE5,#DDE7DA)] text-[#34463A]" },
    { href: "/games", icon: "🎟️", title: "Games & raffles", text: "Raffle numbers and party games will be here on the wedding day.", label: "OPENS NOVEMBER 11", tone: "bg-[linear-gradient(145deg,#EEE7F0,#E5DCE9)] text-[#51415A]" },
  ];

  return (
    <SocialShell info={info} active="home">
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
            <a key={page.title} href={page.href} className={`group relative flex min-h-[158px] flex-col justify-between overflow-hidden rounded-[18px] p-3.5 no-underline shadow-[0_8px_22px_-18px_rgba(61,42,35,.5)] ring-1 ring-white/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_28px_-18px_rgba(61,42,35,.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1D2A] sm:min-h-[178px] sm:rounded-[21px] sm:p-4 md:min-h-[188px] md:p-5 ${page.tone}`}>
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
                <span className="truncate">{page.label}</span><span aria-hidden className="text-sm transition-transform group-hover:translate-x-1">→</span>
              </span>
            </a>
          ))}
        </section>
        <p className="mt-4 text-center text-[8px] tracking-[0.18em] text-taupe/75">{info.hashtags.join("  ")}</p>
      </main>
    </SocialShell>
  );
}
