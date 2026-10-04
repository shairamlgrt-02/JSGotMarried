"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Ambience from "@/components/public/Ambience";
import { EASE, Reveal, Tilt } from "@/components/public/fx";
import { Corners, Flourish } from "@/components/public/ornaments";
import { fullDate } from "@/components/public/Envelope";
import { resolveInvite } from "@/lib/db";
import { cleanCode } from "@/lib/guests";
import type { WeddingInfo } from "@/lib/types";

/**
 * The code-locked door to the reply card (…/rsvp).
 *
 * A guest types what they actually have — the last four characters of the link the couple sent,
 * or the whole code — and the server answers with that household. From there we hand them to
 * their own personal invitation page (`/JS-7KQF#rsvp`), the same link the couple sends, so there
 * is exactly one reply card, one seal and one row in the binder.
 */
export default function CodeGate({ info, initialCode = "" }: { info: WeddingInfo; initialCode?: string }) {
  const [code, setCode] = useState(cleanCode(initialCode));
  const [state, setState] = useState<"idle" | "checking" | "welcome" | "bad">(initialCode ? "checking" : "idle");
  const [error, setError] = useState("");
  const [household, setHousehold] = useState("");
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const couple = `${info.groom} & ${info.bride}`;

  async function open(raw: string) {
    const cc = cleanCode(raw);
    if (cc.length < 3) { setState("bad"); setError("Type the code on your invitation — it looks like JS-7KQF, and the last four characters are enough."); setShake((n) => n + 1); return; }
    setState("checking"); setError("");
    const r = await resolveInvite(cc);
    if (!r.ok) { setState("bad"); setError(r.error); setShake((n) => n + 1); input.current?.focus(); return; }
    setHousehold(r.found.state.name);
    setState("welcome");
    // a beat to greet them by name, then the invitation — with the reply card already in view
    setTimeout(() => { window.location.replace(`/${r.found.code}#rsvp`); }, 900);
  }

  useEffect(() => { if (initialCode) void open(initialCode); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <>
      <Ambience />
      <main className="relative z-[1] min-h-[100svh] flex flex-col items-center justify-center px-5 py-16 text-center overflow-x-clip">
        <Reveal>
          <p className="micro text-taupe">Répondez s&apos;il vous plaît · {couple}</p>
          <h1 className="script text-wine text-script mt-3 [text-shadow:0_1px_0_rgba(255,255,255,.8),0_14px_26px_rgba(110,31,46,.12)]">Your Reply Card</h1>
          <p className="font-serif italic text-body text-taupe mt-4 max-w-sm mx-auto text-balance">
            {fullDate(info.date)} · Bahrain. Kindly open your invitation with the code we sent you.
          </p>
          <Flourish className="w-44 md:w-56 mx-auto mt-4 text-taupe/70" />
        </Reveal>

        <Tilt max={4} glare={false}>
          <div className="relative mt-10 w-full max-w-md">
            <div className="paper-card relative px-6 py-9 md:px-12 md:py-12 shadow-[0_2px_3px_rgba(61,47,38,.15),0_40px_70px_-40px_rgba(61,47,38,.55)]">
              <Corners className="w-14 h-14 md:w-20 md:h-20 text-wine/25" inset="0.4rem" />
              {/* the wax seal that the code breaks */}
              <motion.div
                animate={state === "welcome" ? { scale: [1, 1.15, 0], rotate: [-8, 6, 24], opacity: [1, 1, 0] } : { rotate: [-6, -8, -6] }}
                transition={state === "welcome" ? { duration: 0.8, ease: EASE } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="relative mx-auto w-20 h-20 md:w-24 md:h-24 mb-6"
              >
                <img src="/img/seal.webp" alt="" className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_6px_8px_rgba(61,47,38,.4)]" />
                <span className="absolute inset-0 grid place-items-center font-serif font-semibold text-[#F3DCD8] text-base md:text-lg tracking-[0.12em] [text-shadow:0_1px_1px_rgba(0,0,0,.45)]">RSVP</span>
              </motion.div>

              <AnimatePresence mode="wait" initial={false}>
                {state === "welcome" ? (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                    <p className="font-serif text-lead text-mocha">Welcome, {household.split(" ")[0]}.</p>
                    <p className="micro text-taupe mt-3 tracking-[0.18em]">Unsealing your invitation…</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="gate"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={(e) => { e.preventDefault(); void open(code); }}
                    className="text-left"
                  >
                    <label htmlFor="invite-code" className="micro text-taupe block">Your invitation code</label>
                    <motion.div animate={{ x: shake ? [0, -9, 8, -5, 0] : 0 }} transition={{ duration: 0.45, ease: EASE }} key={shake}>
                      <div className="flex items-end gap-3 mt-2">
                        <input
                          id="invite-code" ref={input} autoFocus={state !== "checking"} autoComplete="off" spellCheck={false} autoCapitalize="characters"
                          inputMode="text" maxLength={16} aria-invalid={state === "bad"}
                          value={code}
                          onChange={(e) => { setCode(cleanCode(e.target.value)); if (state === "bad") setState("idle"); }}
                          placeholder="JS-7KQF"
                          className="field flex-1 !text-2xl md:!text-3xl text-center tracking-[0.18em] uppercase"
                        />
                        <button
                          type="submit" disabled={state === "checking"}
                          className="micro shrink-0 bg-wine text-lace rounded-full px-6 md:px-7 py-4 hover:bg-mocha transition-colors disabled:opacity-60"
                        >
                          {state === "checking" ? "Opening…" : "Open"}
                        </button>
                      </div>
                    </motion.div>
                    <p className="font-serif italic text-fine text-taupe mt-4 leading-snug">
                      Use the last 4 characters of the link we sent you (so <span className="text-wine not-italic tracking-[0.12em]">7KQF</span> is
                      enough), or the whole code. Only the guest you are replying for can see it.
                    </p>
                    <AnimatePresence>
                      {state === "bad" && error && (
                        <motion.p key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden font-serif text-fine text-burgundy mt-4" role="alert">
                          {error}
                        </motion.p>
                      )}
                      {state === "checking" && !error && (
                        <motion.p key="chk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="micro text-taupe mt-4 tracking-[0.18em]">
                          Looking for your invitation…
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Tilt>

        <Reveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 mt-9 micro text-taupe">
            <a href="/preview" className="hover:text-wine tracking-[0.18em]">Just looking? See the invitation preview →</a>
            <a href="/" className="hover:text-wine tracking-[0.18em]">← Back to the front door</a>
            <span className="text-wine">Lost your code? Message {couple}</span>
          </div>
        </Reveal>
      </main>
    </>
  );
}
