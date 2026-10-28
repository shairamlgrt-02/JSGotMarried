"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTable } from "@/lib/hooks";
import { fullDate } from "@/components/public/Envelope";
import { claimGift, isMyClaim, listGifts, pollGiftState, releaseGift } from "@/lib/gifts";
import { DEFAULT_REGISTRY_NOTE, type GiftItem } from "@/lib/types";

const STATE_POLL_MS = 8000; // cheap claim-state ping
const BOARD_REFRESH_MS = 45000; // full board (notes, pictures) refresh

/** One compact tap-to-copy transfer cell — two sit side by side in a single row. */
function CopyCell({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked on older browsers — long-press still works */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Tap to copy"
      className="min-w-0 text-left rounded-xl border border-taupe/25 bg-white/70 px-3.5 py-3 hover:border-wine/50 transition-colors group"
    >
      <div className="micro !text-[9px] text-taupe tracking-[0.14em]">{label}</div>
      <span className="block font-serif text-sm md:text-base text-mocha break-all leading-snug mt-1">{value}</span>
      <span className="micro !text-[9px] text-wine opacity-80 group-hover:opacity-100 mt-1 inline-block">
        {copied ? "copied ✓" : "tap to copy"}
      </span>
    </button>
  );
}

/** The picture, or a graceful monogram tile until the couple uploads one. */
function GiftImage({ gift, claimed }: { gift: GiftItem; claimed: boolean }) {
  const [failed, setFailed] = useState(false);
  if (gift.image_url && !failed) {
    return (
      <img
        src={gift.image_url}
        alt={gift.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl object-cover border border-taupe/20 bg-oat transition-[filter] duration-500 ${
          claimed ? "grayscale opacity-60" : "[filter:sepia(.06)_saturate(.96)]"
        }`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl border border-wine/15 bg-[linear-gradient(145deg,#EFE3D3,#FBF8F2)] grid place-items-center script text-wine/70 text-3xl ${
        claimed ? "opacity-50" : ""
      }`}
    >
      ♡
    </div>
  );
}

/**
 * The public gift registry. No invitation code needed — every guest should be able to mark a
 * present bought. Claim state re-polls every few seconds (lightweight, no pictures) so items
 * other guests take cross off live; the full board refreshes less often and on tab focus.
 * A claim made on this device is the only kind this page offers to release; the binder can
 * release any of them.
 */
export default function GiftsPage() {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];

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
    // A failed refresh must never wipe content the guest is already looking at — keep prior state.
    if (!board) return;
    setItems(board.items);
    setNote(board.note);
    setBenefit(board.benefit);
    setIban(board.iban);
  }, []);

  useEffect(() => {
    void reload();
    const boardTimer = setInterval(() => void reload(), BOARD_REFRESH_MS);
    // Cheap ping: merge only claim fields, keeping the loaded notes and pictures in place.
    const stateTimer = setInterval(async () => {
      const states = await pollGiftState();
      if (!states.length) return;
      const byId = new Map(states.map((s) => [s.id, s]));
      setItems((cur) =>
        cur.map((g) => {
          const s = byId.get(g.id);
          return s ? { ...g, claimed: s.claimed, claimed_by: s.claimed_by, claimed_at: s.claimed_at } : g;
        }),
      );
    }, STATE_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(boardTimer);
      clearInterval(stateTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const couple = info?.bride && info?.groom ? `${info.groom} & ${info.bride}` : "the couple";
  // In local/demo mode the API board carries no transfer fields — the table read holds the same ones.
  const benefitNo = benefit || (info?.benefitpay_number || "").trim();
  const ibanNo = iban || (info?.benefitpay_iban || "").trim();
  const open = items.filter((g) => !g.claimed);
  const taken = items.filter((g) => g.claimed);
  const pct = items.length ? Math.round((taken.length / items.length) * 100) : 0;

  const confirmClaim = async () => {
    if (!askId) return;
    const id = askId;
    setBusyId(id);
    setNotice(null);
    const result = await claimGift(id, guestName);
    setBusyId(null);
    if (result.ok) {
      setAskId(null);
      setGuestName("");
      setNotice({ kind: "ok", text: "Thank you — it's marked as bought. Everyone else will see it crossed off now." });
    } else {
      setNotice({ kind: "err", text: result.error || "That didn't go through — please try again." });
    }
    await reload();
  };

  const undo = async (id: string) => {
    setBusyId(id);
    const result = await releaseGift(id);
    setBusyId(null);
    if (!result.ok) setNotice({ kind: "err", text: result.error || "That didn't go through — please try again." });
    await reload();
  };

  return (
    <main className="min-h-screen paper-bg text-ink">
      <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
        <a
          href="/"
          className="micro inline-flex items-center gap-2 tracking-[0.18em] text-taupe no-underline transition-colors hover:text-wine focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/60 rounded-full"
        >
          <span aria-hidden>←</span> BACK TO THE HOUSE
        </a>

        <header className="text-center mt-8">
          <p className="micro tracking-[0.3em] text-taupe">A LITTLE HELP STARTING OUT</p>
          <h1 className="script text-wine text-[clamp(2.6rem,9vw,4.5rem)] leading-tight mt-3">Our gift list</h1>
          <p className="font-serif font-light tracking-[0.14em] text-mocha mt-3">
            {info ? fullDate(info.date) : "11.11.2026"} · {couple}
          </p>
        </header>

        {/* The monetary-gift note — wording the couple edits in the binder */}
        <section className="mt-10 rounded-[22px] border border-wine/25 bg-wine/[0.05] p-7 md:p-8 text-center shadow-[0_12px_30px_-18px_rgba(110,31,46,.4)]">
          <span aria-hidden className="script text-wine text-3xl leading-none">♡</span>
          <p className="font-serif italic text-body text-mocha mt-3 leading-relaxed text-balance">{note}</p>
        </section>

        {/* Compact one-row transfer card: number and IBAN side by side, tap to copy,
            so the gift list starts immediately below as the guest scrolls. */}
        {benefitNo || ibanNo ? (
          <section className="mt-5 rounded-[22px] border border-taupe/25 bg-[#FCFAF6] p-4 md:p-5 shadow-[0_12px_30px_-18px_rgba(61,47,38,.45)]">
            <div className="flex items-center justify-between gap-3">
              <p className="micro text-wine tracking-[0.2em]">PREFER A TRANSFER?</p>
              <p className="micro text-taupe/80 tracking-[0.12em]">TAP TO COPY</p>
            </div>
            <div className={`grid gap-2.5 mt-3 ${benefitNo && ibanNo ? "grid-cols-2" : "grid-cols-1"}`}>
              <CopyCell label="BENEFITPAY · NUMBER" value={benefitNo} />
              <CopyCell label="BANK TRANSFER · IBAN" value={ibanNo} />
            </div>
            <p className="micro !text-[9px] text-taupe/80 text-center mt-3 tracking-[0.1em]">
              BOTH ACCOUNTS ARE NAMED JSGOTMARRIED — PLEASE CHECK THE NAME BEFORE YOU CONFIRM ✦
            </p>
          </section>
        ) : (
          <p className="micro text-taupe mt-5 text-center tracking-[0.14em]">
            PREFER A TRANSFER? THE BENEFITPAY DETAILS ARE IN YOUR PERSONAL INVITATION LINK.
          </p>
        )}

        {loading ? (
          <p className="text-center text-ink/45 font-serif italic mt-12">Opening the gift list…</p>
        ) : (
          <>
            <div className="mt-10 flex items-center justify-between micro text-taupe tracking-[0.12em]">
              <span>
                {open.length} STILL OPEN · {taken.length} FOUND
              </span>
              <span>{pct}% FOUND</span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-moss transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>

            {notice && (
              <p
                className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                  notice.kind === "ok" ? "bg-moss/10 text-moss" : "bg-burgundy/10 text-burgundy"
                }`}
              >
                {notice.text}
              </p>
            )}

            <ul className="mt-6 space-y-3">
              {open.map((g) => (
                <li
                  key={g.id}
                  className="rounded-2xl border border-taupe/25 bg-[#FCFAF6] p-4 md:p-5 shadow-[0_8px_22px_-16px_rgba(61,47,38,.5)]"
                >
                  {askId === g.id ? (
                    <div className="space-y-3">
                      <p className="font-serif text-lg text-mocha">
                        Mark <b>{g.title}</b> as bought — thank you!
                      </p>
                      <input
                        autoFocus
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your name (optional)"
                        maxLength={120}
                        className="w-full bg-white/70 rounded-full px-5 py-3 outline-none border border-ink/10 focus:border-wine text-sm"
                        onKeyDown={(e) => e.key === "Enter" && confirmClaim()}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={confirmClaim}
                          disabled={busyId === g.id}
                          className="micro rounded-full bg-wine text-lace px-6 py-3 tracking-[0.14em] hover:bg-mocha transition-colors disabled:opacity-50"
                        >
                          {busyId === g.id ? "SAVING…" : "YES, I'VE BOUGHT THIS"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAskId(null);
                            setGuestName("");
                          }}
                          className="micro rounded-full border border-ink/15 px-6 py-3 tracking-[0.14em] text-taupe hover:bg-ink/5 transition-colors"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <GiftImage gift={g} claimed={false} />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg text-mocha leading-snug">{g.title}</p>
                        {g.note && <p className="font-serif italic text-[13px] md:text-sm text-taupe mt-1 leading-snug">{g.note}</p>}
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            setAskId(g.id);
                          }}
                          disabled={busyId === g.id}
                          className="mt-2.5 micro rounded-full border border-wine/35 px-5 py-2.5 text-wine tracking-[0.12em] hover:bg-wine hover:text-lace transition-colors disabled:opacity-50"
                        >
                          I&apos;VE BOUGHT THIS
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}

              {taken.map((g) => (
                <li key={g.id} className="rounded-2xl border border-taupe/15 bg-oat/50 p-4 md:p-5 opacity-85">
                  <div className="flex items-center gap-4">
                    <GiftImage gift={g} claimed />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg text-ink/45 line-through leading-snug">{g.title}</p>
                      <p className="micro text-moss tracking-[0.12em] mt-1">
                        {g.claimed_by ? `BOUGHT BY ${g.claimed_by}` : "ALREADY FOUND A HOME ♡"}
                      </p>
                      {isMyClaim(g.id) && (
                        <button
                          type="button"
                          onClick={() => undo(g.id)}
                          disabled={busyId === g.id}
                          className="mt-2 micro rounded-full border border-ink/15 px-4 py-2 text-taupe tracking-[0.1em] hover:bg-ink/5 transition-colors disabled:opacity-50"
                        >
                          MADE A MISTAKE? RELEASE
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {!items.length && (
              <p className="text-center text-ink/45 font-serif italic mt-12">
                The couple haven&apos;t opened their list yet — check back soon.
              </p>
            )}
            {open.length === 0 && items.length > 0 && (
              <p className="text-center font-serif italic text-mocha mt-10">
                Every single gift has found a home. Thank you for loving them this well. ♡
              </p>
            )}
          </>
        )}

        <p className="micro text-center text-taupe mt-12 tracking-[0.16em]">
          {info?.hashtags?.join("  ") || "#JSGotMarried"}
        </p>
      </div>
    </main>
  );
}
