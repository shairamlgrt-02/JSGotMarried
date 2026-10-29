import SocialShell from "@/components/public/SocialShell";
import { weddingInfo } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const info = await weddingInfo();
  return (
    <SocialShell info={info} active="games">
      <main className="min-h-[calc(100svh-110px)] paper-bg px-3 py-6 text-ink sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <header className="text-center">
            <span aria-hidden className="mx-auto grid h-14 w-14 place-items-center rounded-[19px] bg-[#F1E8F2] text-3xl shadow-sm ring-1 ring-white sm:h-16 sm:w-16 sm:rounded-[22px]">🎟️</span>
            <p className="micro mt-4 text-[8px] tracking-[0.24em] text-taupe sm:mt-5 sm:text-[9px]">A LITTLE FUN FOR THE DAY</p>
            <h1 className="mt-2 font-serif text-[32px] font-medium text-[#5A3542] sm:text-5xl">Games &amp; raffles</h1>
            <p className="mt-2 font-serif text-xs tracking-[0.1em] text-mocha sm:mt-3 sm:text-sm">{info.groom} &amp; {info.bride}</p>
          </header>
          <section className="mt-6 rounded-[24px] bg-[linear-gradient(145deg,#F7F1F6,#E8DFEB)] p-5 text-center shadow-[0_18px_38px_-28px_rgba(74,45,75,.45)] ring-1 ring-white/80 sm:mt-8 sm:rounded-[26px] sm:p-9">
            <p aria-hidden className="script text-4xl text-[#704D6E]">Coming soon</p>
            <p className="mx-auto mt-3 max-w-md font-serif text-sm leading-relaxed text-[#625267] sm:text-base">
              The raffle numbers and wedding-day games will appear here on November 11. Come back during the celebration and join in with everyone.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/75 px-5 py-2.5 font-serif text-xs text-[#59475E] ring-1 ring-white sm:mt-6">
              <span aria-hidden>✧</span> See you on the dance floor!
            </span>
          </section>
        </div>
      </main>
    </SocialShell>
  );
}
