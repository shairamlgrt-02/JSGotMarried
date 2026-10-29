import { weddingInfo } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

function dateLabel(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bahrain" }).formatToParts(new Date(iso));
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")}.${value("month")}.${value("year")}`;
}

export default async function GamesPage() {
  const info = await weddingInfo();
  return (
    <main className="min-h-screen paper-bg px-4 py-8 text-ink sm:px-6 sm:py-12">
      <div className="mx-auto max-w-xl">
        <a href="/" className="micro inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[9px] tracking-[0.16em] text-taupe no-underline shadow-sm ring-1 ring-white/80 transition-colors hover:text-wine">
          <span aria-hidden>←</span> HOME
        </a>
        <header className="mt-10 text-center sm:mt-14">
          <span aria-hidden className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#F1E8F2] text-3xl shadow-sm ring-1 ring-white">🎟️</span>
          <p className="micro mt-5 text-[9px] tracking-[0.26em] text-taupe">A LITTLE FUN FOR THE DAY</p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-[#5A3542] sm:text-5xl">Games &amp; raffles</h1>
          <p className="mt-3 font-serif text-sm tracking-[0.14em] text-mocha">{dateLabel(info.date)} · {info.groom} &amp; {info.bride}</p>
        </header>
        <section className="mt-8 rounded-[26px] bg-[linear-gradient(145deg,#F7F1F6,#E8DFEB)] p-6 text-center shadow-[0_18px_38px_-28px_rgba(74,45,75,.45)] ring-1 ring-white/80 sm:mt-10 sm:p-9">
          <p aria-hidden className="script text-4xl text-[#704D6E]">Coming soon</p>
          <p className="mx-auto mt-3 max-w-md font-serif leading-relaxed text-[#625267]">
            The raffle numbers and wedding-day games will appear here on November 11. Come back during the celebration and join in with everyone.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/75 px-5 py-2.5 font-serif text-xs text-[#59475E] ring-1 ring-white">
            <span aria-hidden>✧</span> See you on the dance floor!
          </span>
        </section>
      </div>
    </main>
  );
}
