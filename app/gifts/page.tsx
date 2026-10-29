"use client";
import { useCallback, useEffect, useState } from "react";
import SocialShell from "@/components/public/SocialShell";
import { OPEN_GUEST_NAME_EVENT, GUEST_NAME_EVENT, GUEST_NAME_KEY, cleanGuestName } from "@/lib/guest-identity";
import { useTable } from "@/lib/hooks";
import { claimGift, listGifts, pollGiftState } from "@/lib/gifts";
import { SEED } from "@/lib/seed";
import { DEFAULT_REGISTRY_NOTE, type GiftItem } from "@/lib/types";

const STATE_POLL_MS = 8000;
const BOARD_REFRESH_MS = 45000;

function CopyCell({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* long-press remains available when clipboard access is blocked */ }
  };
  return (
    <button type="button" onClick={copy} title="Tap to copy" className="group min-w-0 rounded-xl border border-[#DCCBC4] bg-white/75 px-3 py-2.5 text-left transition-colors hover:border-[#9B5B64] sm:px-3.5">
      <span className="micro block text-[8px] tracking-[0.12em] text-taupe">{label}</span>
      <span className="mt-1 block break-all font-serif text-sm leading-snug text-[#4A3732] sm:text-base">{value}</span>
      <span className="micro mt-1 inline-block text-[8px] tracking-wide text-[#6B1D2A]">{copied ? "COPIED ✓" : "TAP TO COPY"}</span>
    </button>
  );
}

function GiftCard({ gift, onChoose, busy }: { gift: GiftItem; onChoose: () => void; busy: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const claimed = Boolean(gift.claimed);
  return (
    <li className={`relative min-w-0 overflow-hidden rounded-[18px] bg-[#E9DED4] shadow-[0_10px_25px_-16px_rgba(62,39,32,.55)] ring-1 ring-[#E8D9D1] ${claimed ? "opacity-[.88]" : ""}`}>
      <div className="relative aspect-[4/5] overflow-hidden">
        {gift.image_url && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gift.image_url} alt={gift.title} loading="lazy" onError={() => setImageFailed(true)} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${claimed ? "scale-[1.02] grayscale-[.35]" : "group-hover:scale-[1.04]"}`} />
        ) : (
          <div aria-hidden className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_35%_28%,rgba(255,255,255,.7),transparent_38%),linear-gradient(145deg,#D8C7B5,#F2E8DE_48%,#C7B0A6)] text-[46px] text-[#754650]/70">♡</div>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#321A20]/95 via-[#40282A]/55 to-transparent" />
        {claimed && <span className="absolute left-2 top-2 rounded-full border border-white/45 bg-[#5C202A]/90 px-2 py-1 text-[7px] font-semibold tracking-[0.12em] text-white sm:left-2.5 sm:top-2.5 sm:text-[8px]">ALREADY CHOSEN</span>}
        <div className="absolute inset-x-0 bottom-0 p-1.5 text-white sm:p-3">
          <p className="line-clamp-2 font-serif text-[12px] font-semibold leading-[1.12] drop-shadow-sm sm:text-[17px]">{gift.title}</p>
          {gift.note && <p className="mt-1 line-clamp-1 text-[8px] leading-tight text-white/85 sm:text-[10px]">{gift.note}</p>}
          <div className="mt-1.5 flex min-h-7 items-end justify-between gap-1 border-t border-white/25 pt-1 sm:mt-2 sm:min-h-8 sm:gap-1.5 sm:pt-1.5">
            <span className={`min-w-0 truncate text-[8px] font-medium tracking-[0.06em] sm:text-[9px] ${claimed ? "text-white/85" : "text-white/75"}`}>
              {claimed ? "GIFTED · UNAVAILABLE" : "AVAILABLE"}
            </span>
            <button type="button" onClick={onChoose} disabled={claimed || busy} aria-label={claimed ? `${gift.title} is already chosen` : `Choose ${gift.title}`} title={claimed ? "Already chosen" : "Choose this gift"} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm transition-colors sm:h-8 sm:w-8 sm:text-base ${claimed ? "cursor-not-allowed border-white/40 bg-white/20 text-white/80" : "border-white/85 bg-[#FFFCF7] text-[#6B1D2A] shadow-sm hover:scale-105 hover:bg-[#F2E4E0]"}`}>
              {claimed ? "✓" : busy ? "…" : "✓"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function GiftsPage() {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0] ?? SEED.wedding_info[0];
  const [items, setItems] = useState<GiftItem[]>([]);
  const [note, setNote] = useState(DEFAULT_REGISTRY_NOTE);
  const [benefit, setBenefit] = useState("");
  const [iban, setIban] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [askId, setAskId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const reload = useCallback(async () => {
    const board = await listGifts();
    setLoading(false);
    if (!board) return;
    setItems(board.items);
    setNote(board.note);
    setBenefit(board.benefit);
    setIban(board.iban);
  }, []);

  useEffect(() => {
    try { setGuestName(cleanGuestName(localStorage.getItem(GUEST_NAME_KEY))); } catch { /* private mode */ }
    const syncName = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") setGuestName(cleanGuestName(detail));
      else { try { setGuestName(cleanGuestName(localStorage.getItem(GUEST_NAME_KEY))); } catch { /* private mode */ } }
    };
    window.addEventListener(GUEST_NAME_EVENT, syncName);
    window.addEventListener("storage", syncName);
    void reload();
    const boardTimer = window.setInterval(() => void reload(), BOARD_REFRESH_MS);
    const stateTimer = window.setInterval(async () => {
      const states = await pollGiftState();
      if (!states.length) return;
      const byId = new Map(states.map((state) => [state.id, state]));
      setItems((current) => current.map((gift) => {
        const state = byId.get(gift.id);
        return state ? { ...gift, claimed: state.claimed, claimed_by: state.claimed_by ?? "", claimed_at: state.claimed_at } : gift;
      }));
    }, STATE_POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void reload(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(GUEST_NAME_EVENT, syncName);
      window.removeEventListener("storage", syncName);
      window.clearInterval(boardTimer);
      window.clearInterval(stateTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const openCount = items.filter((gift) => !gift.claimed).length;
  const claimedCount = items.length - openCount;
  const pct = items.length ? Math.round((claimedCount / items.length) * 100) : 0;
  const selectedGift = items.find((gift) => gift.id === askId);

  const confirmClaim = async () => {
    if (!askId) return;
    if (!guestName.trim()) {
      window.dispatchEvent(new Event(OPEN_GUEST_NAME_EVENT));
      return;
    }
    const id = askId;
    setBusyId(id);
    setNotice(null);
    const result = await claimGift(id, guestName);
    setBusyId(null);
    if (result.ok) {
      setAskId(null);
      setNotice({ kind: "ok", text: "Thank you — it’s marked as chosen. Everyone will see it’s no longer available." });
    } else {
      setNotice({ kind: "err", text: result.error || "That didn’t go through — please try again." });
    }
    await reload();
  };

  return (
    <SocialShell info={info} active="gifts">
      <main className="mx-auto w-full max-w-5xl px-3 pb-8 pt-4 sm:px-6 sm:pt-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1 sm:mb-5 sm:px-0">
          <div><p className="micro text-[8px] tracking-[0.23em] text-taupe sm:text-[9px]">A LITTLE HELP STARTING OUT</p><h1 className="mt-1 font-serif text-[27px] font-semibold leading-none text-[#493631] sm:text-[34px]">Our gift list</h1></div>
          <p className="max-w-[250px] text-right font-serif text-[11px] italic leading-snug text-taupe sm:text-sm">A few thoughtful things for our home together.</p>
        </header>

        <section className="mb-4 rounded-[20px] border border-[#DCC9C1] bg-[#F6EFEB] px-4 py-3.5 shadow-[0_10px_26px_-22px_rgba(88,37,45,.4)] sm:mb-5 sm:px-5">
          <div className="flex items-start gap-2.5"><span aria-hidden className="mt-0.5 text-lg text-[#8E5960]">♡</span><p className="font-serif text-[13px] italic leading-relaxed text-[#5B4540] sm:text-sm">{note}</p></div>
        </section>

        {loading ? (
          <section role="status" aria-label="Loading transfer details" className="mb-5 rounded-[18px] border border-[#E2D4CD] bg-[#FFFCF8] p-3.5">
            <div className="h-3 w-40 animate-pulse rounded-full bg-taupe/15" /><div className="mt-3 grid grid-cols-2 gap-2.5"><div className="h-[4.5rem] animate-pulse rounded-xl bg-taupe/10" /><div className="h-[4.5rem] animate-pulse rounded-xl bg-taupe/10" /></div>
          </section>
        ) : benefit || iban ? (
          <section className="mb-5 rounded-[18px] border border-[#E2D4CD] bg-[#FFFCF8] p-3.5 shadow-[0_10px_24px_-20px_rgba(61,47,38,.45)] sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-2"><p className="micro text-[8px] tracking-[0.16em] text-[#6B1D2A]">PREFER A TRANSFER?</p><p className="micro text-[8px] tracking-[0.1em] text-taupe">TAP TO COPY</p></div>
            <div className={`grid gap-2.5 ${benefit && iban ? "grid-cols-2" : "grid-cols-1"}`}><CopyCell label="BENEFITPAY · NUMBER" value={benefit} /><CopyCell label="BANK TRANSFER · IBAN" value={iban} /></div>
          </section>
        ) : (
          <p className="mb-5 text-center text-[9px] tracking-[0.1em] text-taupe">PREFER A TRANSFER? DETAILS ARE IN YOUR PERSONAL INVITATION LINK.</p>
        )}

        {!loading && <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="micro text-[8px] tracking-[0.12em] text-taupe sm:text-[9px]">{openCount} AVAILABLE <span aria-hidden>·</span> {claimedCount} CHOSEN</p>
          <p className="micro text-[8px] tracking-[0.12em] text-taupe sm:text-[9px]">{pct}% GIFTED</p>
        </div>}
        {!loading && <div aria-label={`${pct}% of gifts chosen`} className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#E9DDD6]"><div className="h-full rounded-full bg-[#788568] transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>}

        {notice && <p role="status" className={`mb-4 rounded-xl px-4 py-2.5 text-xs ${notice.kind === "ok" ? "bg-[#EAF0E6] text-[#526B56]" : "bg-[#F9E7E5] text-[#8B3030]"}`}>{notice.text}</p>}

        {loading ? (
          <ul aria-label="Loading gifts" className="grid grid-cols-3 gap-2 sm:gap-3">{Array.from({ length: 6 }, (_, index) => <li key={index} className="aspect-[4/5] animate-pulse rounded-[18px] bg-[#E8DDD4]" />)}</ul>
        ) : items.length ? (
          <ul aria-label="Gift list" className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-5">
            {items.map((gift) => <GiftCard key={gift.id} gift={gift} busy={busyId === gift.id} onChoose={() => { setNotice(null); setAskId(gift.id); }} />)}
          </ul>
        ) : (
          <p className="rounded-2xl border border-[#E2D4CD] bg-white/70 px-4 py-10 text-center font-serif italic text-taupe">The couple is still adding their gift ideas. Please check again soon.</p>
        )}

        <p className="mt-6 text-center text-[9px] tracking-[0.08em] text-taupe/80">Chosen gifts are marked unavailable for all guests.</p>
      </main>

      {askId && selectedGift && <>
        <button type="button" aria-label="Close gift confirmation" onClick={() => setAskId(null)} className="fixed inset-0 z-[60] bg-[#29181A]/20" />
        <section role="dialog" aria-modal="true" aria-labelledby="gift-confirm-title" className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[70] mx-auto w-full max-w-xl px-3 sm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]">
          <div className="rounded-[22px] border border-[#DDC7C0] bg-[#FFFCF8] p-4 shadow-[0_18px_55px_-20px_rgba(48,23,25,.6)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="micro text-[8px] tracking-[0.18em] text-[#8B6660]">GIFT CONFIRMATION</p><h2 id="gift-confirm-title" className="mt-1 font-serif text-lg font-semibold leading-tight text-[#493631]">{selectedGift.title}</h2></div>
              <button type="button" onClick={() => setAskId(null)} aria-label="Close confirmation" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4EAE6] text-lg text-[#725B55]">×</button>
            </div>
            <p className="mt-3 font-serif text-[15px] leading-snug text-[#493631]">Mark this item as your gift to the couple?</p>
            {guestName ? <p className="mt-1 text-[11px] text-taupe">Marking as <b className="font-medium text-[#6B1D2A]">{guestName}</b></p> : <div className="mt-2 flex items-center justify-between gap-2"><p className="text-[11px] text-taupe">Please add your name before confirming.</p><button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_GUEST_NAME_EVENT))} className="shrink-0 text-[11px] font-semibold text-[#6B1D2A] underline underline-offset-2">Add name</button></div>}
            <p className="mt-3 rounded-xl bg-[#F5ECE7] px-3 py-2 text-[10px] leading-relaxed text-[#72514E]">Once confirmed, guests can’t undo this choice. Only the couple can release a gift from their binder.</p>
            <div className="mt-3 flex items-center justify-end gap-2"><button type="button" onClick={() => setAskId(null)} className="rounded-full px-4 py-2 text-xs font-medium text-taupe hover:bg-[#F5ECE7]">Not now</button><button type="button" onClick={() => void confirmClaim()} disabled={!guestName.trim() || busyId === askId || Boolean(selectedGift.claimed)} className="rounded-full bg-[#6B1D2A] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#521522] disabled:cursor-not-allowed disabled:opacity-45">{busyId === askId ? "Saving…" : "Confirm gift"}</button></div>
          </div>
        </section>
      </>}
    </SocialShell>
  );
}
