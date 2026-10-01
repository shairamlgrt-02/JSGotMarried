"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Corners } from "@/components/public/ornaments";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  // set after mount only — reading window during render would break hydration
  const [framed, setFramed] = useState(false);
  const [here, setHere] = useState("");
  const [sandbox, setSandbox] = useState(false);
  useEffect(() => {
    setFramed(window.top !== window.self);
    setHere(window.location.href);
    setSandbox(/(^|\.)arena\.site$|(^|\.)e2b\.app$/.test(window.location.hostname));
  }, []);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(false);
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) window.location.href = "/admin"; else { setErr(true); setBusy(false); }
  }
  return (
    <main className="relative z-[1] min-h-screen grid place-items-center px-6">
      <motion.form onSubmit={go} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }} className="relative paper-card w-full max-w-md text-center px-8 py-14 shadow-[0_40px_80px_-40px_rgba(61,47,38,.5)]">
        <div className="absolute inset-3 border border-taupe/30 pointer-events-none" />
        <Corners className="w-14 h-14" inset="1rem" color="#B9A591" />
        <div className="mx-auto w-20 h-20 rounded-full bg-wine grid place-items-center mb-8 shadow-[inset_0_-6px_12px_rgba(0,0,0,.35),0_6px_14px_rgba(61,47,38,.4)]">
          <span className="script text-3xl text-[#E8C9CF]">J&amp;S</span>
        </div>
        <p className="label text-taupe">The Wedding Binder</p>
        <h1 className="script text-wine text-5xl mt-3 mb-10">For Jeg &amp; Shai only</h1>
        <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="field text-center" />
        {err && <p className="text-wine text-sm mt-4 font-serif italic">That&apos;s not the magic word.</p>}
        <button disabled={busy} className="label mt-10 w-full bg-wine text-lace rounded-full py-4 hover:bg-mocha transition-colors disabled:opacity-50">{busy ? "Opening…" : "Open binder"}</button>
        {framed && (
          <div className="mt-8 space-y-3">
            <p className="text-fine font-serif italic text-taupe text-balance">Embedded previews can&apos;t keep the binder session — open this page in its own tab to log in.</p>
            {!sandbox && (
              <>
                <a href={here} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); window.open(here, "_blank", "noopener,noreferrer"); }} className="label inline-block text-wine border border-wine/40 rounded-full px-5 py-2 hover:bg-wine hover:text-lace transition-colors">Open in new tab ↗</a>
                <p className="text-fine font-serif italic text-taupe text-balance">If the tab doesn&apos;t open, copy this address into a browser tab:<br /><code className="not-italic font-sans text-[10px] break-all select-all text-mocha">{here}</code></p>
              </>
            )}
            {sandbox && (
              <p className="text-fine font-serif italic text-taupe text-balance">Sandbox previews only open inside Arena — for the binder in a real browser tab, open your own deployment (your Vercel address, e.g. jsgotmarried….vercel.app/admin) and log in there with the same password.</p>
            )}
          </div>
        )}
        <a href="/" className="label block mt-8 text-taupe hover:text-wine">← Back to site</a>
      </motion.form>
    </main>
  );
}
