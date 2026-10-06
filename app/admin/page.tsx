"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AttireEditor, Budget, Checklist, Content, Details, Guests, Overview, PrintBinder, ScheduleBuilder, Settings, Vendors, getMode } from "@/components/admin/tabs";
import { InviteCodes } from "@/components/admin/invites";
import { AudioGuestbook } from "@/components/admin/guestbook";
import { TemplatesTab, ComposeTab, TrackerTab } from "@/components/admin/messaging";

const TABS = [
  ["overview", "Overview", "◐"], ["details", "Details", "✎"], ["schedule", "Schedule", "◷"], ["checklist", "Checklist", "☑"],
  ["budget", "Budget", "◎"], ["invites", "Invite Codes", "✦"], ["guests", "Guests & RSVP", "♡"], ["audio", "Audio Guestbook", "☎"],
  ["messaging-compose", "📨 Compose", "✉"], ["messaging-templates", "📋 Templates", "▤"], ["messaging-tracker", "📊 Tracker", "◈"],
  ["vendors", "Vendors", "◇"], ["attire", "Attire & Colors", "◉"],
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
      <div className="relative z-[1] min-h-screen bg-oat text-ink md:flex print:hidden">
        {/* Sidebar */}
        <aside className={`fixed md:sticky top-0 z-40 h-screen w-72 shrink-0 bg-ivory border-r border-taupe/20 flex flex-col transition-transform duration-500 ease-lux ${menu ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="p-6 flex items-center gap-3 border-b border-taupe/20">
            <div className="w-11 h-11 rounded-full border border-wine/40 grid place-items-center"><span className="script text-2xl text-wine">JS</span></div>
            <div><div className="font-serif text-xl leading-none">The Binder</div><div className="label !text-[9px] text-taupe mt-1">Wedding OS · 11.11.2026</div></div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {TABS.map(([id, label, icon]) => (
              <button key={id} onClick={() => go(id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${tab === id ? "bg-wine/10 text-wine" : "text-mocha hover:bg-oat hover:text-ink"}`}>
                <span className="w-5 text-center opacity-80">{icon}</span><span className="text-[15px]">{label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-taupe/20 space-y-2 text-xs text-taupe">
            <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${mode === "supabase" ? "bg-green-400" : "bg-wine"}`} />{mode === "supabase" ? "Synced to Supabase" : "Local mode"}</div>
            <a href="/preview?all=1" target="_blank" className="block hover:text-wine">Preview the site ↗</a>
            <a href="/preview" target="_blank" className="block hover:text-wine">See it as a guest ↗</a>
            <a href="/" target="_blank" className="block hover:text-wine">Front door (hub) ↗</a>
          </div>
        </aside>
        {menu && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMenu(false)} />}

        {/* Content */}
        <main className="flex-1 min-w-0 relative">
          <div className="md:hidden sticky top-0 z-20 bg-ivory/90 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-taupe/20">
            <button onClick={() => setMenu(true)} className="text-2xl">☰</button>
            <span className="font-serif text-xl">{TABS.find((t) => t[0] === tab)?.[1]}</span>
            <span className="script text-wine text-xl">JS</span>
          </div>
          <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(110,31,46,0.06),transparent_60%)] pointer-events-none" />
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }} className="relative p-5 md:p-10 max-w-7xl">
              {tab === "overview" && <Overview go={go} />}
              {tab === "details" && <Details />}
              {tab === "schedule" && <ScheduleBuilder />}
              {tab === "checklist" && <Checklist />}
              {tab === "budget" && <Budget />}
              {tab === "invites" && <InviteCodes go={go} />}
              {tab === "guests" && <Guests go={go} />}
              {tab === "audio" && <AudioGuestbook />}
              {tab === "messaging-compose" && <ComposeTab />}
              {tab === "messaging-templates" && <TemplatesTab />}
              {tab === "messaging-tracker" && <TrackerTab />}
              {tab === "vendors" && <Vendors />}
              {tab === "attire" && <AttireEditor />}
              {tab === "content" && <Content />}
              {tab === "settings" && <Settings mode={mode} onPrint={() => window.print()} go={go} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <PrintBinder />
    </>
  );
}
