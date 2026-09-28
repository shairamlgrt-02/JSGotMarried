"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(false);
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) window.location.href = "/admin"; else { setErr(true); setBusy(false); }
  }
  return (
    <main className="min-h-screen grid place-items-center px-6 bg-ink">
      <motion.form onSubmit={go} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }} className="w-full max-w-sm text-center">
        <div className="mx-auto w-28 h-28 rounded-full border border-gold/60 grid place-items-center mb-10">
          <span className="display text-5xl italic gold-foil">JS</span>
        </div>
        <p className="label text-gold">The Wedding Binder</p>
        <h1 className="display text-5xl mt-3 mb-10">For Shai & Jeg only.</h1>
        <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="field text-center text-lg" />
        {err && <p className="text-red-300 text-sm mt-4">That&apos;s not the magic word.</p>}
        <button disabled={busy} className="label mt-10 w-full bg-gold text-ink rounded-full py-4 hover:bg-paper transition-colors disabled:opacity-50">{busy ? "Opening…" : "Open binder"}</button>
        <a href="/" className="label block mt-8 text-paper/40 hover:text-gold">← Back to site</a>
      </motion.form>
    </main>
  );
}
