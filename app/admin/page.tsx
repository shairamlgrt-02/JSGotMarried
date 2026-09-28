"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AttireEditor, Budget, Checklist, Content, Details, Guests, Overview, PrintBinder, ScheduleBuilder, Settings, Vendors, getMode } from "@/components/admin/tabs";

const TABS = [
  ["overview", "Overview", "◐"], ["details", "Details", "✎"], ["schedule", "Schedule", "◷"], ["checklist", "Checklist", "☑"],
  ["budget", "Budget", "◎"], ["guests", "Guests & RSVP", "♡"], ["vendors", "Vendors", "◇"], ["attire", "Attire & Colors", "◉"],
  ["content", "Content", "▣"], ["settings", "Settings", "⚙"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  const [mode, setMode] = useState("…");
  const [menu, setMenu] = useState(false);
  useEffect(() => { getMode().then(setMode); const h = location.hash.slice(1) as Tab; if (TABS.some((t) => t[0] === h)) setTab(h); }, []);
  const go = (t: string) => { setTab(t as Tab); setMenu(false); history.replaceState(null, "", `#${t}`); window.scrollTo({ top: 0 }); };

  return (
    <>
      <div className="min-h-screen bg-ink text-paper md:flex print:hidden">
        {/* Sidebar */}
        <aside className={`fixed md:sticky top-0 z-40 h-screen w-72 shrink-0 bg-[#0a0907] border-r border-gold/10 flex flex-col transition-transform duration-500 ease-lux ${menu ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="p-6 flex items-center gap-3 border-b border-gold/10">
            <div className="w-11 h-11 rounded-full border border-gold/60 grid place-items-center"><span className="font-serif italic text-xl gold-foil">JS</span></div>
            <div><div className="font-serif text-xl leading-none">The Binder</div><div className="label !text-[9px] text-paper/40 mt-1">Wedding OS · 11.11.26</div></div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {TABS.map(([id, label, icon]) => (
              <button key={id} onClick={() => go(id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${tab === id ? "bg-gold/15 text-gold" : "text-paper/60 hover:bg-paper/5 hover:text-paper"}`}>
                <span className="w-5 text-center opacity-80">{icon}</span><span className="text-[15px]">{label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gold/10 space-y-2 text-xs text-paper/40">
            <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${mode === "supabase" ? "bg-green-400" : "bg-gold"}`} />{mode === "supabase" ? "Synced to Supabase" : "Local mode"}</div>
            <a href="/" target="_blank" className="block hover:text-gold">View public site ↗</a>
          </div>
        </aside>
        {menu && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMenu(false)} />}

        {/* Content */}
        <main className="flex-1 min-w-0 relative">
          <div className="md:hidden sticky top-0 z-20 bg-ink/90 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-gold/10">
            <button onClick={() => setMenu(true)} className="text-2xl">☰</button>
            <span className="font-serif text-xl">{TABS.find((t) => t[0] === tab)?.[1]}</span>
            <span className="font-serif italic text-gold">JS</span>
          </div>
          <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,106,0.10),transparent_60%)] pointer-events-none" />
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }} className="relative p-5 md:p-10 max-w-7xl">
              {tab === "overview" && <Overview go={go} />}
              {tab === "details" && <Details />}
              {tab === "schedule" && <ScheduleBuilder />}
              {tab === "checklist" && <Checklist />}
              {tab === "budget" && <Budget />}
              {tab === "guests" && <Guests />}
              {tab === "vendors" && <Vendors />}
              {tab === "attire" && <AttireEditor />}
              {tab === "content" && <Content />}
              {tab === "settings" && <Settings mode={mode} onPrint={() => window.print()} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <PrintBinder />
    </>
  );
}
