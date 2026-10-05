"use client";

import { useEffect, useState } from "react";
import { Btn, Card, PageHead } from "./ui";

type Note = { id: string; contentType: string; fileSizeBytes: number; durationMs: number; createdAt: string; audioUrl: string };

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function duration(ms: number) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Bahrain",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AudioGuestbook() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/guestbook", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The guestbook couldn't be loaded.");
      setNotes(result.messages ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The guestbook couldn't be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const remove = async (note: Note) => {
    if (!window.confirm("Permanently delete this anonymous voice note?")) return;
    setBusyId(note.id);
    setError("");
    try {
      const response = await fetch(`/api/guestbook?id=${encodeURIComponent(note.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "That note couldn't be deleted.");
      setNotes((current) => current.filter((item) => item.id !== note.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That note couldn't be deleted.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <PageHead kicker="Anonymous messages · invitation-only uploads" title="Audio guestbook.">
        <Btn variant="ghost" onClick={() => void load()} disabled={loading}>↻ Refresh</Btn>
      </PageHead>
      <Card className="mb-5 !bg-[#F8F2E7]">
        <p className="font-serif text-lg text-ink">Listen to the little wishes, greetings, and prayers left for you.</p>
        <p className="mt-2 text-sm text-ink/60">Guests aren&apos;t asked for their names, and their invitation codes aren&apos;t kept with recordings. Audio stays in a private bucket; player links expire after one hour.</p>
        {!loading && !error && <p className="label !text-[10px] text-ink/45 mt-3">{notes.length} {notes.length === 1 ? "note" : "notes"} · {fileSize(notes.reduce((sum, note) => sum + note.fileSizeBytes, 0))} of audio stored</p>}
      </Card>
      {error && <p role="alert" className="mb-5 rounded-xl border border-burgundy/20 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">{error}</p>}
      {loading && <Card><p className="font-serif text-xl italic text-ink/50">Gathering your messages…</p></Card>}
      {!loading && !error && !notes.length && (
        <Card className="py-12 text-center">
          <p className="script text-4xl text-wine">Nothing just yet</p>
          <p className="mt-2 font-serif text-ink/60">When a guest leaves a note, it will be waiting here.</p>
        </Card>
      )}
      {!loading && notes.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {notes.map((note, index) => (
            <Card key={note.id} className="!p-4 md:!p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="label text-wine">Voice note {notes.length - index}</p>
                  <p className="mt-1 text-sm text-ink/55">{when(note.createdAt)} <span className="px-1">·</span> {duration(note.durationMs)} <span className="px-1">·</span> {fileSize(note.fileSizeBytes)}</p>
                </div>
                <Btn variant="danger" disabled={busyId === note.id} onClick={() => void remove(note)} className="shrink-0 !px-3 !py-2">{busyId === note.id ? "Removing…" : "Delete"}</Btn>
              </div>
              <audio controls preload="none" src={note.audioUrl} className="w-full" aria-label={`Anonymous voice note ${notes.length - index}`}>
                Your browser does not support audio playback.
              </audio>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
