"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTable } from "@/lib/hooks";
import { fullDate } from "@/components/public/Envelope";
import { deleteMoment, loadMoments, publishMoment, updateMoment, type WeddingMoment } from "@/lib/moments";
import { browserSupabase } from "@/lib/supabase-browser";
import {
  MAX_TOTAL_BYTES,
  UPLOAD_ACCEPT,
  addToQuota,
  formatBytes,
  guestId,
  mediaConfigured,
  objectPath,
  readQuota,
  uploadMediaFile,
  validateChatSelection,
  validateStorySelection,
  optimizeChatMedia,
} from "@/lib/media-upload";

type DraftMedia = {
  file: File;
  previewUrl: string;
  path?: string;
  progress: number;
  status: "waiting" | "uploading" | "uploaded" | "error";
};

const MAX_POST_MEDIA = 8;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "A guest";
const POSTER_TONES = [
  { ink: "#6B1D2A", edge: "#D8A7A8", wash: "#F8ECEA", deep: "#8F4650" },
  { ink: "#47614D", edge: "#A9BEA9", wash: "#EDF3EC", deep: "#607E65" },
  { ink: "#9A604E", edge: "#E0BDA9", wash: "#FAF0E9", deep: "#BA806B" },
  { ink: "#67547D", edge: "#C6B8D3", wash: "#F2EEF6", deep: "#88749E" },
  { ink: "#8A6B2D", edge: "#D9C68D", wash: "#F7F2E2", deep: "#A98943" },
  { ink: "#35666A", edge: "#A1C5C3", wash: "#EAF3F2", deep: "#548487" },
];
const posterTone = (name: string) => {
  const hash = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return POSTER_TONES[hash % POSTER_TONES.length]!;
};
const mediaContentType = (file: File) => {
  const type = file.type.split(";")[0]?.trim() || "";
  if (/^(image|video|audio)\//i.test(type)) return type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";
  if (extension === "mov") return "video/quicktime";
  if (extension === "m4a") return "audio/mp4";
  if (extension === "mp3") return "audio/mpeg";
  if (extension === "wav") return "audio/wav";
  if (extension === "ogg") return "audio/ogg";
  if (extension === "aac") return "audio/aac";
  return type || "application/octet-stream";
};
function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "just now";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function mergeChatMessages(current: WeddingMoment[], incoming: WeddingMoment[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function MomentMediaGrid({ post, expanded, onExpand }: { post: WeddingMoment; expanded: boolean; onExpand: () => void }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const visible = expanded ? post.media : post.media.slice(0, 4);
  const overflow = post.media.length - visible.length;
  const current = previewIndex === null ? undefined : post.media[previewIndex];
  const movePreview = useCallback((direction: 1 | -1) => {
    setPreviewIndex((index) => index === null ? null : (index + direction + post.media.length) % post.media.length);
  }, [post.media.length]);

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewIndex(null);
      if (event.key === "ArrowRight") movePreview(1);
      if (event.key === "ArrowLeft") movePreview(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, movePreview]);

  return (
    <>
      <div className={`mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${visible.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {visible.map((media, index) => (
          <div key={`${post.id}-${index}`} className={`relative overflow-hidden rounded-xl bg-ink/5 ${media.contentType.startsWith("audio/") ? "flex min-h-20 items-center p-2" : visible.length === 1 ? "aspect-[4/3] max-h-[340px]" : "aspect-square"}`}>
            {media.contentType.startsWith("audio/") ? (
              <div className="w-full"><p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-taupe">Voice note</p><audio src={media.url} controls preload="metadata" className="h-10 w-full" /></div>
            ) : (
              <button type="button" onClick={() => setPreviewIndex(index)} className="absolute inset-0 h-full w-full" aria-label={`Open ${media.contentType.startsWith("video/") ? "video" : "photo"} ${index + 1}`}>
                {media.contentType.startsWith("video/") ? (
                  <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img src={media.url} alt={`Shared moment ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
                )}
                {media.contentType.startsWith("video/") && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow">▶</span>}
                {post.overlayText && <span className="pointer-events-none absolute inset-x-2 bottom-2 line-clamp-2 rounded-lg bg-ink/55 px-3 py-2 text-center font-serif text-sm text-white shadow backdrop-blur-sm">{post.overlayText}</span>}
              </button>
            )}
            {overflow > 0 && index === visible.length - 1 && (
              <button type="button" onClick={onExpand} className="absolute inset-0 z-10 grid place-items-center bg-ink/65 text-white transition-colors hover:bg-ink/75" aria-label={`Show ${overflow} more attachments`}>
                <span className="font-serif text-4xl">+{overflow}</span>
                <span className="micro absolute mt-16 tracking-[0.16em]">MORE ATTACHMENTS</span>
              </button>
            )}
          </div>
        ))}
      </div>
      {!expanded && post.media.length > 4 && (
        <button type="button" onClick={onExpand} className="micro mt-2 text-wine underline underline-offset-4">Show all {post.media.length} moments</button>
      )}
      <AnimatePresence>
        {current && typeof document !== "undefined" && createPortal(
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17110f]/95 p-3 text-white sm:p-6" role="dialog" aria-modal="true" aria-label="Photo or video preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewIndex(null)}>
            <div className="relative flex h-[min(88vh,850px)] w-full max-w-5xl flex-col items-center justify-center" onClick={(event) => event.stopPropagation()}>
              <div className="absolute right-0 top-0 z-20 flex items-center gap-3">
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs">{(previewIndex ?? 0) + 1} / {post.media.length}</span>
                <button type="button" onClick={() => setPreviewIndex(null)} className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-2xl" aria-label="Close photo preview">×</button>
              </div>
              <button type="button" onClick={() => movePreview(-1)} className="absolute left-0 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/40 text-2xl hover:bg-black/65" aria-label="Previous photo">‹</button>
              {current.contentType.startsWith("video/") ? <video key={current.url} src={current.url} controls autoPlay playsInline className="max-h-full max-w-[88%] object-contain" /> : current.contentType.startsWith("audio/") ? <audio key={current.url} src={current.url} controls autoPlay className="w-full max-w-lg" /> : <img key={current.url} src={current.url} alt={`Shared moment ${(previewIndex ?? 0) + 1}`} className="max-h-full max-w-[88%] object-contain" />}
              <button type="button" onClick={() => movePreview(1)} className="absolute right-0 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/40 text-2xl hover:bg-black/65" aria-label="Next photo">›</button>
              {post.overlayText && <p className="absolute bottom-5 left-16 right-16 rounded-xl bg-black/55 px-4 py-3 text-center font-serif text-lg shadow-lg backdrop-blur-sm">{post.overlayText}</p>}
            </div>
          </motion.div>,
          document.body,
        )}
      </AnimatePresence>
    </>
  );
}

function MomentCard({ post, expanded, onExpand, onEdit, onDelete }: { post: WeddingMoment; expanded: boolean; onExpand: () => void; onEdit: (post: WeddingMoment) => void; onDelete: (post: WeddingMoment) => void }) {
  const mine = Boolean(post.canManage);
  const tone = posterTone(post.displayName);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[88%] min-w-[42%] rounded-2xl border px-3.5 py-2.5 shadow-sm sm:max-w-[78%] ${mine ? "rounded-br-md border-[#C6D8C5] bg-[#E9F2E7]" : "rounded-bl-md border-[#E7DAD5] bg-white"}`}>
        <header className="mb-1 flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: mine ? "#526B56" : tone.ink }}>{mine ? "You" : post.displayName}</p>
          {mine && <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => onEdit(post)} className="text-[9px] tracking-wide text-taupe hover:text-wine">EDIT</button>
            <button type="button" onClick={() => onDelete(post)} className="text-[9px] tracking-wide text-taupe hover:text-burgundy" aria-label="Delete your message">DELETE</button>
          </div>}
        </header>
        {post.body && <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-ink/90">{post.body}</p>}
        {post.media.length > 0 && <MomentMediaGrid post={post} expanded={expanded} onExpand={onExpand} />}
        <footer className="mt-1.5 flex justify-end text-[10px] text-taupe/80">{relativeTime(post.createdAt)}</footer>
      </div>
    </motion.article>
  );
}

function EditMomentDialog({ post, onClose, onSave }: { post: WeddingMoment; onClose: () => void; onSave: (body: string, overlayText: string) => Promise<void> }) {
  const [body, setBody] = useState(post.body);
  const [overlayText, setOverlayText] = useState(post.overlayText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try { await onSave(body, overlayText); } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };
  return (
    <motion.div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/65 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-moment-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ y: 8, scale: 0.98 }} animate={{ y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-paper p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="micro tracking-[0.18em] text-taupe">YOUR MESSAGE</p><h2 id="edit-moment-title" className="mt-1 font-serif text-2xl text-mocha">Edit message</h2></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-2xl text-taupe hover:bg-ink/5" aria-label="Close edit dialog">×</button>
        </div>
        <label className="micro mb-1 block text-taupe" htmlFor="edit-moment-body">Caption or note</label>
        <textarea id="edit-moment-body" value={body} onChange={(event) => setBody(event.target.value.slice(0, 1200))} rows={5} maxLength={1200} className="w-full resize-y rounded-xl border border-taupe/25 bg-white/80 p-3 text-sm leading-relaxed text-ink outline-none focus:border-wine/50" />
        {post.media.some((media) => media.contentType.startsWith("image/") || media.contentType.startsWith("video/")) && <div className="mt-3"><label className="micro mb-1 block text-taupe" htmlFor="edit-moment-overlay">Text over your photo/video</label><input id="edit-moment-overlay" value={overlayText} onChange={(event) => setOverlayText(event.target.value.slice(0, 120))} maxLength={120} className="w-full rounded-xl border border-taupe/25 bg-white/80 px-3 py-2 text-sm outline-none focus:border-wine/50" /></div>}
        {error && <p role="alert" className="mt-3 text-sm text-burgundy">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={saving} className="micro rounded-full border border-taupe/30 px-4 py-2 text-taupe">CANCEL</button><button type="button" onClick={() => void save()} disabled={saving} className="micro rounded-full bg-wine px-5 py-2 text-lace disabled:opacity-50">{saving ? "SAVING…" : "SAVE CHANGES"}</button></div>
      </motion.div>
    </motion.div>
  );
}

type NamePromptMode = "story" | "chat" | "edit";

function NamePromptDialog({ mode, initialName, onClose, onSave }: { mode: NamePromptMode; initialName: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const isChatPrompt = mode === "chat";
  const title = mode === "story" ? "Post as?" : mode === "chat" ? "What name should everyone see?" : "Edit your name";
  const description = mode === "story"
    ? "Your Story name also appears in the group chat. Your name is optional."
    : mode === "chat"
      ? "Add your name before sending your first message. You can change it any time."
      : "This name appears on your group chat messages and Stories.";
  const save = (event: FormEvent) => {
    event.preventDefault();
    onSave(name.trim());
  };
  return (
    <motion.div className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/65 p-4" role="dialog" aria-modal="true" aria-labelledby="name-prompt-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form onSubmit={save} initial={{ y: 8, scale: 0.98 }} animate={{ y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-paper p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h2 id="name-prompt-title" className="font-serif text-2xl text-mocha">{title}</h2><p className="mt-1 text-xs leading-relaxed text-taupe">{description}</p></div>
          <button type="button" onClick={onClose} aria-label="Close name dialog" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xl text-taupe hover:bg-ink/5">×</button>
        </div>
        <label htmlFor="moment-display-name" className="micro mb-1 block text-taupe">Your name{mode === "story" ? " (optional)" : ""}</label>
        <input id="moment-display-name" autoFocus value={name} onChange={(event) => setName(event.target.value.slice(0, 60))} placeholder={mode === "story" ? "Name (optional)" : "Your name"} maxLength={60} className="w-full rounded-xl border border-taupe/25 bg-white/90 px-3 py-2.5 text-sm text-ink outline-none focus:border-wine/50" />
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="micro rounded-full border border-taupe/30 px-4 py-2 text-taupe">CANCEL</button><button type="submit" disabled={isChatPrompt && !name.trim()} className="micro rounded-full bg-wine px-5 py-2 text-lace disabled:cursor-not-allowed disabled:opacity-45">{mode === "edit" ? "SAVE NAME" : mode === "story" ? "CONTINUE" : "CONTINUE TO CHAT"}</button></div>
      </motion.form>
    </motion.div>
  );
}

function StoryCardPreview({ media, fallback, tone }: { media: WeddingMoment["media"][number]; fallback: string; tone: ReturnType<typeof posterTone> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { rootMargin: "60px", threshold: 0.15 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [media.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) void video.play().catch(() => undefined);
    else video.pause();
  }, [inView]);

  return (
    <>
      <span className="absolute inset-0 grid place-items-center font-serif text-4xl" style={{ backgroundColor: tone.wash, color: tone.ink }}>{fallback}</span>
      <video ref={videoRef} src={inView ? media.url : undefined} muted loop playsInline autoPlay preload="none" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
    </>
  );
}

type StoryItem = {
  id: string;
  media: WeddingMoment["media"][number];
  body: string;
  overlayText: string;
  createdAt: string;
  post: WeddingMoment;
};
type StoryGroup = { key: string; displayName: string; items: StoryItem[]; latestAt: string };

function StoriesRail({ posts, displayName, onEdit, onDelete, onAddStory, uploadEnabled, uploading, progress }: { posts: WeddingMoment[]; displayName: string; onEdit: (post: WeddingMoment) => void; onDelete: (post: WeddingMoment) => void; onAddStory: () => void; uploadEnabled: boolean; uploading: boolean; progress: number }) {
  const [active, setActive] = useState<{ group: number; item: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const groups = useMemo(() => {
    const byName = new Map<string, StoryGroup>();
    for (const post of posts) {
      if (!post.media.some((media) => media.contentType.startsWith("image/") || media.contentType.startsWith("video/"))) continue;
      const key = post.displayName.trim().toLocaleLowerCase();
      let group = byName.get(key);
      if (!group) {
        group = { key, displayName: post.displayName, items: [], latestAt: post.createdAt };
        byName.set(key, group);
      }
      if (new Date(post.createdAt).getTime() > new Date(group.latestAt).getTime()) group.latestAt = post.createdAt;
      post.media.forEach((media, index) => {
        if (!media.contentType.startsWith("image/") && !media.contentType.startsWith("video/")) return;
        group!.items.push({
          id: `${post.id}-${index}`,
          media,
          body: post.body,
          overlayText: post.overlayText,
          createdAt: post.createdAt,
          post,
        });
      });
    }
    return [...byName.values()]
      .map((group) => ({ ...group, items: group.items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }))
      .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [posts]);

  const currentGroup = active ? groups[active.group] : undefined;
  const currentItem = currentGroup?.items[active?.item ?? 0];
  const advance = useCallback((direction: 1 | -1 = 1) => {
    setActive((current) => {
      if (!current) return current;
      const group = groups[current.group];
      if (!group) return null;
      const next = current.item + direction;
      if (next >= 0 && next < group.items.length) return { ...current, item: next };
      const nextGroup = current.group + direction;
      if (nextGroup >= 0 && nextGroup < groups.length) {
        return { group: nextGroup, item: direction > 0 ? 0 : groups[nextGroup].items.length - 1 };
      }
      return null;
    });
  }, [groups]);

  useEffect(() => {
    if (!currentItem || currentItem.media.contentType.startsWith("video/")) return;
    const timer = window.setTimeout(() => advance(), 5200);
    return () => window.clearTimeout(timer);
  }, [active, currentItem, advance]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") advance();
      if (event.key === "ArrowLeft") advance(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, advance]);

  return (
    <section aria-label="Stories from guests" className="mb-4 rounded-[20px] border border-[#E5D4CE] bg-[#FFFCF9]/90 px-3 py-3 shadow-[0_8px_24px_-20px_rgba(107,29,42,.4)] sm:px-4">
      <div className="mb-2.5 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold leading-tight text-[#6B1D2A]">Share your #JSGotMarried moments</h2>
          <p className="mt-0.5 max-w-xl text-[10px] leading-snug text-[#765E59]">Add to Stories below and upload your photos &amp; videos for the couple and everyone to see.</p>
        </div>
        <div className="shrink-0 pt-0.5 text-right text-[9px] leading-tight text-[#8B706A]">
          <p className="max-w-[100px] truncate">{displayName.trim() ? `Post as ${firstName(displayName)}` : "Post as a guest"}</p>
          <p className="mt-0.5">1 GB per device</p>
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
        <motion.button type="button" onClick={onAddStory} disabled={!uploadEnabled} aria-label="Add a Story"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015 }} whileTap={reduceMotion ? undefined : { scale: 0.975 }} transition={{ duration: 0.22 }}
          className="relative flex h-[164px] w-[108px] shrink-0 flex-col overflow-hidden rounded-[15px] border border-[#E6D5CE] bg-white text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
          <span className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_35%_20%,#fff8ee_0%,#f5e7e2_54%,#e9d6d1_100%)]">
            <span className="absolute -right-5 -top-6 h-20 w-20 rounded-full border border-[#D4B1A7]/40" />
            <span className="absolute -bottom-8 -left-5 h-24 w-24 rounded-full border border-[#D4B1A7]/40" />
            <motion.span animate={uploading || reduceMotion ? { scale: 1 } : { scale: [1, 1.08, 1] }} transition={uploading || reduceMotion ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="relative grid h-10 w-10 place-items-center rounded-full bg-[#6B1D2A] text-2xl font-light text-white shadow-md">{uploading ? "…" : "+"}</motion.span>
          </span>
          <span className="flex h-[48px] flex-col justify-center px-2.5">
            <span className="text-[11px] font-semibold leading-tight text-[#46362C]">{uploading ? `Uploading ${progress}%` : "Add to Story"}</span>
            <span className="mt-0.5 text-[9px] leading-tight text-[#8A746E]">Photos &amp; videos</span>
          </span>
        </motion.button>

        {groups.length ? groups.map((group, index) => {
          const first = group.items[0];
          const tone = posterTone(group.displayName);
          const initials = group.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "♡";
          return (
            <motion.button key={group.key} type="button" onClick={() => setActive({ group: index, item: 0 })}
              aria-label={`View ${group.displayName}'s Stories`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015 }} whileTap={reduceMotion ? undefined : { scale: 0.975 }} transition={{ duration: 0.22, delay: Math.min(index * 0.045, 0.25) }}
              className="group relative h-[164px] w-[108px] shrink-0 overflow-hidden rounded-[15px] border border-black/5 bg-[#EDE4DF] text-left shadow-sm">
              {first.media.contentType.startsWith("image/") ? (
                <img src={first.media.url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
              ) : (
                <StoryCardPreview media={first.media} fallback={initials} tone={tone} />
              )}
              <span className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" />
              <span className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-[#1684FF] bg-white font-serif text-xs font-semibold shadow-md" style={{ color: tone.ink }}>
                {first.media.contentType.startsWith("image/") ? <img src={first.media.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : initials.slice(0, 1)}
              </span>
              {group.items.some((item) => item.media.contentType.startsWith("video/")) && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/45 text-[10px] text-white">▶</span>}
              <span className="absolute inset-x-2 bottom-2.5 line-clamp-2 text-[11px] font-semibold leading-tight text-white drop-shadow">{group.displayName}</span>
            </motion.button>
          );
        }) : [0, 1].map((placeholder) => (
          <div key={`story-placeholder-${placeholder}`} aria-hidden="true" className={`relative flex h-[164px] w-[108px] shrink-0 flex-col justify-between overflow-hidden rounded-[15px] border border-dashed border-[#D8C7C1] px-2.5 py-2.5 ${placeholder === 0 ? "bg-[#F5EEEA]" : "bg-[#F1F0EB]"}`}>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-[#D9C8C1] bg-white/75 text-xs text-[#A88D85]">✦</span>
            <span className="mb-0.5 text-[10px] leading-snug text-[#9A8580]">Stories from your guests will appear here</span>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {active && currentGroup && currentItem && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17110f]/95 p-3 text-white sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${currentGroup.displayName}'s stories`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div initial={{ scale: 0.98, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98 }} onClick={(event) => event.stopPropagation()} className="relative flex h-[min(82vh,760px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[26px] bg-[#241b19] shadow-2xl">
              <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
                {currentGroup.items.map((item, index) => <span key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35"><span className={`block h-full rounded-full ${index <= (active?.item ?? 0) ? "bg-white" : "bg-transparent"}`} /></span>)}
              </div>
              <div className="absolute inset-x-4 top-7 z-20 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/10 font-serif">{currentGroup.displayName.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{currentGroup.displayName}</p><p className="text-[10px] text-white/65">{relativeTime(currentItem.createdAt)}</p></div>
                {currentItem.post.canManage && <>
                  <button type="button" aria-label="Edit this story" onClick={() => { onEdit(currentItem.post); setActive(null); }} className="rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] tracking-wide">EDIT</button>
                  <button type="button" aria-label="Delete this story" onClick={() => { onDelete(currentItem.post); setActive(null); }} className="rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] tracking-wide">DELETE</button>
                </>}
                <button type="button" aria-label="Close stories" onClick={() => setActive(null)} className="grid h-9 w-9 place-items-center rounded-full bg-black/25 text-2xl">×</button>
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/25">
                <button type="button" aria-label="Previous story" onClick={() => advance(-1)} className="absolute inset-y-16 left-0 z-10 w-1/5 cursor-w-resize" />
                {currentItem.media.contentType.startsWith("video/") ? (
                  <video key={currentItem.id} src={currentItem.media.url} controls autoPlay muted playsInline onEnded={() => advance()} className="max-h-full max-w-full object-contain" />
                ) : (
                  <img key={currentItem.id} src={currentItem.media.url} alt="A shared wedding moment" className="max-h-full max-w-full object-contain" />
                )}
                <button type="button" aria-label="Next story" onClick={() => advance()} className="absolute inset-y-16 right-0 z-10 w-1/5 cursor-e-resize" />
                {currentItem.overlayText && <p className="absolute bottom-16 left-4 right-4 z-10 rounded-xl bg-black/55 px-4 py-3 text-center font-serif text-lg shadow-lg backdrop-blur-sm">{currentItem.overlayText}</p>}
              </div>
              {currentItem.body && <p className="max-h-24 overflow-y-auto px-5 py-3 text-center text-sm leading-relaxed text-white/85">{currentItem.body}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const conversationPrompts = [
  "Mingle, say hello, and share the night.",
  "Pass along an update or a little announcement.",
  "Save a laugh or moment to remember later.",
];

function ConversationPrompt() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % conversationPrompts.length), 6500);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <motion.div initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: "easeOut" }} className="my-1 flex min-h-8 items-center gap-2.5 px-1.5" aria-live="polite">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#E7D3CB] bg-white/75 text-[11px] text-[#9A604E]" aria-hidden>✦</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={index} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 1.15, ease: "easeInOut" }} className="text-[10px] leading-relaxed text-[#806B65] sm:text-[11px]">
          {conversationPrompts[index]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

export default function UploadPage() {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];
  const configured = useMemo(() => mediaConfigured(), []);
  const galleryInput = useRef<HTMLInputElement>(null);
  const storyInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const deviceId = useMemo(() => guestId(), []);
  const voiceRecorder = useRef<MediaRecorder | null>(null);
  const voiceStream = useRef<MediaStream | null>(null);
  const voiceChunks = useRef<Blob[]>([]);

  const [quota, setQuota] = useState(readQuota());
  const [draftMedia, setDraftMedia] = useState<DraftMedia[]>([]);
  const draftRef = useRef(draftMedia);
  draftRef.current = draftMedia;
  const [displayName, setDisplayName] = useState("");
  const [namePromptMode, setNamePromptMode] = useState<NamePromptMode | null>(null);
  const [body, setBody] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const [editingPost, setEditingPost] = useState<WeddingMoment | null>(null);
  const [posts, setPosts] = useState<WeddingMoment[]>([]);
  const [storyPosts, setStoryPosts] = useState<WeddingMoment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [storyUploading, setStoryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const chatScroll = useRef<HTMLDivElement>(null);
  const postsRef = useRef<WeddingMoment[]>([]);
  const initialScrollDone = useRef(false);
  const touchStartY = useRef<number | null>(null);

  const couple = info?.bride && info?.groom ? `${info.groom} & ${info.bride}` : "the couple";
  const hashtag = info?.hashtags?.[0] || "";
  const remainingBytes = Math.max(0, MAX_TOTAL_BYTES - quota.bytes);

  const refreshFeed = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [page, storyPage] = await Promise.all([
        loadMoments({ limit: 24, deviceId }),
        loadMoments({ limit: 48, stories: true, deviceId }),
      ]);
      const knownIds = new Set(postsRef.current.map((message) => message.id));
      const arrived = page.posts.filter((message) => !knownIds.has(message.id));
      const node = chatScroll.current;
      const nearBottom = !node || node.scrollHeight - node.scrollTop - node.clientHeight < 140;
      setPosts((current) => {
        const merged = mergeChatMessages(current, page.posts);
        postsRef.current = merged;
        return merged;
      });
      if (quiet && arrived.length) {
        if (nearBottom) requestAnimationFrame(() => { if (chatScroll.current) chatScroll.current.scrollTop = chatScroll.current.scrollHeight; });
        else setUnreadCount((count) => count + arrived.length);
      }
      setStoryPosts(storyPage.posts);
      setNextCursor(page.nextCursor);
    } catch (e) {
      if (!quiet) setError((e as Error).message);
    } finally {
      if (!quiet) setLoading(false);
      setPulling(false);
    }
  }, [deviceId]);

  useEffect(() => {
    try { setDisplayName(localStorage.getItem("jsos:moment-name-v1") || ""); } catch { /* private mode */ }
    void refreshFeed();
    return () => draftRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, [refreshFeed]);

  useEffect(() => {
    if (loading || initialScrollDone.current || !posts.length) return;
    initialScrollDone.current = true;
    requestAnimationFrame(() => {
      const node = chatScroll.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
  }, [loading, posts.length]);

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) { setLiveStatus("offline"); return; }
    const channel = supabase
      .channel("wedding-newsfeed", { config: { private: true, broadcast: { ack: false, self: false } } })
      .on("broadcast", { event: "moments_changed" }, async (message) => {
        const payload = (message as { payload?: { operation?: string; id?: string } })?.payload;
        if (!payload?.id) return;
        if (payload.operation === "DELETE") {
          const remaining = postsRef.current.filter((item) => item.id !== payload.id);
          postsRef.current = remaining;
          setPosts(remaining);
          setStoryPosts((current) => current.filter((item) => item.id !== payload.id));
          return;
        }
        try {
          const result = await loadMoments({ id: payload.id, limit: 1, deviceId });
          const messagePost = result.posts[0];
          if (!messagePost) return;
          const isNew = !postsRef.current.some((item) => item.id === messagePost.id);
          const node = chatScroll.current;
          const nearBottom = !node || node.scrollHeight - node.scrollTop - node.clientHeight < 140;
          const next = messagePost.showInFeed
            ? mergeChatMessages(postsRef.current, [messagePost])
            : postsRef.current.filter((item) => item.id !== messagePost.id);
          postsRef.current = next;
          setPosts(next);
          if (messagePost.media.some((media) => media.contentType.startsWith("image/") || media.contentType.startsWith("video/"))) {
            setStoryPosts((current) => [messagePost, ...current.filter((item) => item.id !== messagePost.id)].slice(0, 48));
          }
          if (isNew && messagePost.showInFeed) {
            if (nearBottom) requestAnimationFrame(() => { if (chatScroll.current) chatScroll.current.scrollTop = chatScroll.current.scrollHeight; });
            else setUnreadCount((count) => count + 1);
          }
        } catch { /* a dropped event can be recovered by reconnecting or using Refresh */ }
      })
      .subscribe((status) => {
        const ready = status === "SUBSCRIBED";
        setLiveStatus(ready ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED" ? "offline" : "connecting");
        if (ready) void refreshFeed(true);
      });
    return () => {
      setLiveStatus("offline");
      void supabase.removeChannel(channel);
    };
  }, [deviceId, refreshFeed]);

  // A quiet fallback only runs while Realtime is disconnected, so messages still catch up after
  // a temporary socket outage without making guests manually refresh.
  useEffect(() => {
    if (!configured || liveStatus === "live") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshFeed(true);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [configured, liveStatus, refreshFeed]);

  const addFiles = (files: File[]): boolean => {
    const result = validateChatSelection(files);
    const room = Math.max(0, MAX_POST_MEDIA - draftMedia.length);
    const accepted = result.accepted.slice(0, room);
    const notices = [...result.errors];
    if (result.accepted.length > room) notices.push(`One message can include up to ${MAX_POST_MEDIA} attachments.`);
    if (!accepted.length && files.length) setError(notices[0] || "No more attachments can be added to this message.");
    else setError("");
    if (notices.length) setNotice(notices.join(" "));
    if (accepted.length) {
      setDraftMedia((current) => [...current, ...accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file), progress: 0, status: "waiting" as const }))]);
    }
    return accepted.length > 0;
  };

  const chooseFiles = (picked: FileList | null) => {
    setAttachmentMenu(false);
    if (picked) addFiles(Array.from(picked));
    if (galleryInput.current) galleryInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
    if (videoInput.current) videoInput.current.value = "";
  };

  const chooseStoryFiles = (picked: FileList | null) => {
    setAttachmentMenu(false);
    if (picked?.length) void uploadStories(Array.from(picked));
    if (storyInput.current) storyInput.current.value = "";
  };

  const uploadStories = async (files: File[]) => {
    const validation = validateStorySelection(files, quota);
    const accepted = validation.accepted;
    if (!accepted.length) {
      setError(validation.errors[0] || "Choose a photo or video to add to Stories.");
      return;
    }
    setPosting(true);
    setStoryUploading(true);
    setError("");
    setNotice("");
    try {
      const published: WeddingMoment[] = [];
      for (const file of accepted) {
        const path = objectPath(file, deviceId);
        setUploadProgress(0);
        await uploadMediaFile(file, path, (percent) => setUploadProgress(percent));
        setQuota(addToQuota([file]));
        const post = await publishMoment({
          deviceId, displayName: displayName.trim(), body: "", overlayText: "",
          media: [{ path, contentType: mediaContentType(file) }], showInFeed: false, showInStories: true,
        });
        published.push(post);
      }
      setStoryPosts((current) => [...published.reverse(), ...current].slice(0, 48));
      const skipped = validation.errors.length ? ` ${validation.errors.length} file(s) were skipped.` : "";
      setNotice(`${accepted.length === 1 ? "Added to Stories" : `Added ${accepted.length} items to Stories`} — not shared in the group chat. ♡${skipped}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your Story could not be uploaded. Please try again.");
    } finally {
      setPosting(false);
      setStoryUploading(false);
      setUploadProgress(0);
    }
  };

  const showStoryPicker = () => storyInput.current?.click();
  const openStoryPicker = () => setNamePromptMode("story");

  const saveNamePrompt = (name: string) => {
    const mode = namePromptMode;
    if (!mode) return;
    const cleanName = name.trim();
    setDisplayName(cleanName);
    try { localStorage.setItem("jsos:moment-name-v1", cleanName); } catch { /* private mode */ }
    setNamePromptMode(null);
    if (mode === "story") showStoryPicker();
    if (mode === "chat") void sharePost(cleanName);
  };

  const startVoiceNote = async () => {
    if (recording) {
      voiceRecorder.current?.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice notes aren't supported in this browser. You can still attach an audio file.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStream.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      voiceChunks.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) voiceChunks.current.push(event.data); };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const audio = new File(voiceChunks.current, `voice-note-${Date.now()}.${extension}`, { type });
        if (audio.size) addFiles([audio]);
        stream.getTracks().forEach((track) => track.stop());
        voiceStream.current = null;
        voiceRecorder.current = null;
        voiceChunks.current = [];
      };
      recorder.start();
      voiceRecorder.current = recorder;
      setRecordingSeconds(0);
      setRecording(true);
      setError("");
    } catch {
      voiceStream.current?.getTracks().forEach((track) => track.stop());
      voiceStream.current = null;
      voiceRecorder.current = null;
      setRecording(false);
      setError("Microphone access was blocked. Please allow it, or attach a photo, video or audio file instead.");
    }
  };

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    const recorder = voiceRecorder.current;
    if (recorder) {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    voiceStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const removeDraft = (index: number) => {
    const item = draftMedia[index];
    if (item) URL.revokeObjectURL(item.previewUrl);
    const remaining = draftMedia.filter((_, i) => i !== index);
    setDraftMedia(remaining);
  };

  const sharePost = async (providedName?: string) => {
    if (!configured || posting || (!body.trim() && !draftMedia.length)) return;
    const authorName = (providedName ?? displayName).trim();
    if (!authorName && providedName === undefined) {
      setNamePromptMode("chat");
      return;
    }
    setPosting(true);
    setError("");
    setNotice("");
    try {
      const readyMedia: { path: string; contentType: string }[] = [];
      for (let i = 0; i < draftMedia.length; i++) {
        let item = draftMedia[i];
        if (!item.path) {
          const optimizedFile = await optimizeChatMedia(item.file);
          const path = objectPath(optimizedFile, deviceId);
          setUploadProgress(0);
          setDraftMedia((current) => current.map((x, n) => n === i ? { ...x, status: "uploading", progress: 0 } : x));
          await uploadMediaFile(optimizedFile, path, (percent) => {
            setUploadProgress(percent);
            setDraftMedia((current) => current.map((x, n) => n === i ? { ...x, progress: percent } : x));
          });
          item = { ...item, file: optimizedFile, path, progress: 100, status: "uploaded" };
          setDraftMedia((current) => current.map((x, n) => n === i ? item : x));
        }
        readyMedia.push({ path: item.path!, contentType: mediaContentType(item.file) });
      }

      const post = await publishMoment({ deviceId, displayName: authorName, body, overlayText: "", media: readyMedia, showInFeed: true, showInStories: false });
      if (post.showInFeed) {
        setPosts((current) => {
          const next = mergeChatMessages(current, [post]);
          postsRef.current = next;
          return next;
        });
        setUnreadCount(0);
        requestAnimationFrame(() => { if (chatScroll.current) chatScroll.current.scrollTop = chatScroll.current.scrollHeight; });
      }
      setBody("");
      setEmojiOpen(false);
      draftRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setDraftMedia([]);
      setNotice("Sent to the group chat ♡ Chat photos and videos are optimized and stay out of Stories.");
      try { localStorage.setItem("jsos:moment-name-v1", authorName); } catch { /* private mode */ }
      window.setTimeout(() => setNotice(""), 4500);
    } catch (e) {
      setError((e as Error).message || "That didn't send — please try again.");
    } finally {
      setPosting(false);
      setUploadProgress(0);
    }
  };

  const removePost = async (post: WeddingMoment) => {
    if (!post.canManage || !window.confirm("Delete your message and its uploaded attachments? This can't be undone.")) return;
    setError("");
    try {
      await deleteMoment(post.id, deviceId);
      const remaining = postsRef.current.filter((item) => item.id !== post.id);
      postsRef.current = remaining;
      setPosts(remaining);
      setStoryPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice("Your moment has been deleted.");
      window.setTimeout(() => setNotice(""), 4500);
    } catch (e) {
      setError((e as Error).message || "That moment couldn't be deleted. Please try again.");
    }
  };

  const savePostEdit = async (bodyText: string, overlay: string) => {
    if (!editingPost) return;
    const updated = await updateMoment({ id: editingPost.id, deviceId, body: bodyText, overlayText: overlay });
    const changed = postsRef.current.map((item) => item.id === updated.id ? updated : item);
    postsRef.current = changed;
    setPosts(changed);
    setStoryPosts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setEditingPost(null);
    setNotice("Your changes have been saved ♡");
    window.setTimeout(() => setNotice(""), 4500);
  };

  const loadOlder = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const node = chatScroll.current;
      const oldHeight = node?.scrollHeight ?? 0;
      const oldTop = node?.scrollTop ?? 0;
      const page = await loadMoments({ before: nextCursor, limit: 24, deviceId });
      setPosts((current) => {
        const merged = mergeChatMessages(current, page.posts);
        postsRef.current = merged;
        return merged;
      });
      setNextCursor(page.nextCursor);
      requestAnimationFrame(() => {
        if (node) node.scrollTop = oldTop + node.scrollHeight - oldHeight;
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshFromTop = () => {
    setPulling(true);
    void refreshFeed();
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (window.scrollY <= 0) touchStartY.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartY.current;
    const end = event.changedTouches[0]?.clientY;
    touchStartY.current = null;
    if (start !== null && typeof end === "number" && end - start > 78 && window.scrollY <= 0) refreshFromTop();
  };

  return (
    <main className="relative min-h-screen paper-bg text-ink" style={{ backgroundImage: "radial-gradient(ellipse at 4% 12%,rgba(205,148,156,.13),transparent 29%),radial-gradient(ellipse at 80% 88%,rgba(218,190,126,.10),transparent 30%)" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative z-[1] mx-auto max-w-2xl px-3 pb-14 pt-4 sm:px-5 sm:pt-6">
        <header className="mb-4 flex items-center justify-between gap-4 border-b border-taupe/20 pb-3">
          <div className="min-w-0">
            <a href="/" className="micro inline-flex items-center gap-1.5 text-taupe no-underline transition-colors hover:text-wine">
              <span aria-hidden>←</span> BACK TO THE HOUSE
            </a>
            <h1 className="mt-1 font-serif text-2xl leading-tight text-wine sm:text-[1.7rem]">Wedding chat</h1>
            <p className="mt-0.5 truncate text-xs text-taupe">{info ? fullDate(info.date) : "11.11.2026"} · {couple}{hashtag ? ` · ${hashtag}` : ""}</p>
          </div>
          <button type="button" onClick={() => setNamePromptMode("edit")} title={displayName.trim() ? `Edit name: ${displayName}` : "Add your name"} aria-label={displayName.trim() ? `Edit your name, currently ${displayName}` : "Add your name"} className="flex max-w-[112px] shrink-0 items-center gap-1.5 rounded-full border border-[#D8B9AE] bg-white/75 px-2.5 py-2 text-[10px] font-medium text-[#70434A] shadow-sm transition-colors hover:bg-[#F7ECE9] sm:max-w-[150px] sm:px-3 sm:text-xs">
            <span className="truncate">{displayName.trim() ? `As ${firstName(displayName)}` : "Add your name"}</span><span aria-hidden>✎</span>
          </button>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#E1C8C2] bg-[#F2E5E2] px-4 py-2.5 text-[#6B1D2A] shadow-[0_8px_20px_-16px_rgba(107,29,42,.45)] sm:px-5">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D7B5AD] bg-white/60 text-lg text-[#9A604E]" aria-hidden>✦</span><p className="micro truncate !tracking-[0.16em]">YOUR DAY, THROUGH EVERYONE&apos;S EYES</p></div>
          <span className="script hidden shrink-0 text-3xl leading-none text-[#9A604E] sm:block">every moment matters</span>
        </div>

        {!configured && (
          <div className="mb-4 rounded-2xl border border-taupe/25 bg-white/70 p-5 text-center text-sm text-ink/65">
            The wedding chat isn't connected yet. Please let the couple know so they can finish the one-time setup.
          </div>
        )}

        <StoriesRail posts={storyPosts} displayName={displayName} onEdit={setEditingPost} onDelete={(post) => void removePost(post)} onAddStory={openStoryPicker} uploadEnabled={configured && !posting} uploading={storyUploading} progress={uploadProgress} />
        <ConversationPrompt />

        <section aria-label="Wedding conversation" className="mt-1 overflow-hidden rounded-[22px] border border-[#E3D1CB] bg-[#FFFCF8] shadow-[0_12px_32px_-22px_rgba(107,29,42,.5)]">
          <input ref={storyInput} type="file" accept="image/*,video/*,.heic,.heif,.mov" multiple hidden onChange={(event) => chooseStoryFiles(event.target.files)} />
          <input ref={galleryInput} type="file" accept={UPLOAD_ACCEPT} multiple hidden onChange={(event) => chooseFiles(event.target.files)} />
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(event) => chooseFiles(event.target.files)} />
          <input ref={videoInput} type="file" accept="video/*" capture="environment" hidden onChange={(event) => chooseFiles(event.target.files)} />
          <div className="flex items-center justify-between gap-3 border-b border-[#E8DCD7] bg-white/75 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E9F2E7] text-lg text-[#526B56]" aria-hidden>♡</span>
              <div className="min-w-0"><h2 className="font-serif text-xl leading-tight text-[#46362C]">Wedding conversation</h2><p className="text-[11px] text-taupe">Chat, share updates &amp; relive the night</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => setNamePromptMode("edit")} title={displayName.trim() ? `Edit name: ${displayName}` : "Add your name"} aria-label={displayName.trim() ? `Edit your name, currently ${displayName}` : "Add your name"} className="flex max-w-[88px] items-center gap-1 truncate rounded-full border border-[#E3D1CB] bg-white/80 px-2 py-1 text-[9px] font-medium text-[#70434A] hover:bg-[#F7ECE9] sm:max-w-[120px] sm:text-[10px]">
                <span className="truncate">{displayName.trim() ? `As ${firstName(displayName)}` : "Add name"}</span><span aria-hidden>✎</span>
              </button>
              <span title={liveStatus === "live" ? "Live" : liveStatus === "offline" ? "Offline" : "Connecting"} className="inline-flex items-center gap-1.5 text-[10px] text-taupe"><span className={`h-2 w-2 rounded-full ${liveStatus === "live" ? "bg-[#4D8A57]" : liveStatus === "offline" ? "bg-[#B66A62]" : "bg-[#C49A57]"}`} /><span className="hidden sm:inline">{liveStatus === "live" ? "LIVE" : liveStatus === "offline" ? "OFFLINE" : "CONNECTING"}</span></span>
              <button type="button" onClick={() => { setPulling(true); void refreshFeed(true); }} title="Refresh chat" aria-label="Refresh chat" className="grid h-8 w-8 place-items-center rounded-full border border-[#E3D1CB] text-lg text-[#806F68] transition-colors hover:bg-[#F5E9E6]">↻</button>
            </div>
          </div>

          <div ref={chatScroll} role="log" aria-label="Chat messages" aria-live="polite" onScroll={(event) => { const node = event.currentTarget; if (node.scrollHeight - node.scrollTop - node.clientHeight < 60) setUnreadCount(0); }} className="relative flex h-[min(56vh,560px)] min-h-[300px] flex-col gap-2 overflow-y-auto bg-[#F5F0E9] px-3 py-3 sm:px-4">
            {nextCursor && <button type="button" onClick={() => void loadOlder()} disabled={loadingMore} className="mx-auto mb-2 rounded-full border border-[#D8C7C1] bg-white/85 px-4 py-1.5 text-[10px] text-taupe shadow-sm disabled:opacity-50">{loadingMore ? "LOADING OLDER MESSAGES…" : "LOAD EARLIER MESSAGES"}</button>}
            {loading ? (
              <div className="mt-auto space-y-3" aria-label="Loading chat messages"><div className="h-12 w-2/3 animate-pulse rounded-2xl bg-white/70" /><div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-[#E5EEE2]" /><div className="h-12 w-3/5 animate-pulse rounded-2xl bg-white/70" /></div>
            ) : posts.length ? (
              <AnimatePresence initial={false}>
                {posts.map((post) => <MomentCard key={post.id} post={post} expanded={expandedIds.has(post.id)} onExpand={() => setExpandedIds((current) => new Set(current).add(post.id))} onEdit={setEditingPost} onDelete={(item) => void removePost(item)} />)}
              </AnimatePresence>
            ) : !error ? (
              <div className="m-auto max-w-sm py-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-[#D8C7C1] bg-white text-2xl text-[#9A604E]">✦</div><p className="font-serif text-xl text-[#6B1D2A]">Say hello to everyone</p><p className="mt-1 text-xs leading-relaxed text-ink/60">Chat with everyone, share updates and keep the night’s memories together.</p></div>
            ) : <p className="m-auto rounded-xl bg-white/75 p-4 text-center text-sm text-ink/55">The group chat is getting ready. Please try refreshing in a moment.</p>}
            {unreadCount > 0 && <button type="button" onClick={() => { if (chatScroll.current) chatScroll.current.scrollTop = chatScroll.current.scrollHeight; setUnreadCount(0); }} className="sticky bottom-1 mx-auto rounded-full bg-[#6B1D2A] px-4 py-2 text-xs font-medium text-white shadow-lg">{unreadCount} new {unreadCount === 1 ? "message" : "messages"} ↓</button>}
          </div>

          <div className="sticky bottom-0 z-20 border-t border-[#E8DCD7] bg-[#FFFCF8] p-3 shadow-[0_-8px_18px_-18px_rgba(54,43,35,.45)] sm:p-4">
            {emojiOpen && <div className="mb-2 flex flex-wrap gap-1.5 rounded-xl bg-[#F7F1E8] p-2" aria-label="Choose an emoji">{["🤍", "😂", "🥹", "🎉", "📸", "😍", "🙌", "✨", "💃", "🕺", "🥂", "❤️"].map((emoji) => <button key={emoji} type="button" onClick={() => { setBody((text) => `${text}${emoji}`); messageInput.current?.focus(); }} className="grid h-9 w-9 place-items-center rounded-lg text-xl transition-colors hover:bg-white" aria-label={`Add ${emoji}`}>{emoji}</button>)}</div>}
            {attachmentMenu && <div className="mb-2 flex flex-wrap gap-2 rounded-xl bg-[#F7F1E8] p-2" aria-label="Attachment options"><button type="button" onClick={() => galleryInput.current?.click()} className="rounded-full bg-white px-3 py-2 text-xs text-[#70434A] shadow-sm">▧ Upload files</button><button type="button" onClick={() => cameraInput.current?.click()} className="rounded-full bg-white px-3 py-2 text-xs text-[#70434A] shadow-sm">◉ Take a photo</button><button type="button" onClick={() => videoInput.current?.click()} className="rounded-full bg-white px-3 py-2 text-xs text-[#70434A] shadow-sm">▷ Record video</button></div>}
            {draftMedia.length > 0 && <div className="mb-2 flex gap-2 overflow-x-auto pb-1">{draftMedia.map((item, index) => <div key={`${item.file.name}-${index}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E3D1CB] bg-[#F5F0E9]">
              {item.file.type.startsWith("audio/") ? <div className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-[10px] text-[#526B56]"><span className="text-xl">🎙</span><span className="line-clamp-2">Voice note</span></div> : item.file.type.startsWith("video/") ? <video src={item.previewUrl} className="h-full w-full object-cover" /> : <img src={item.previewUrl} alt="Attachment preview" className="h-full w-full object-cover" />}
              {posting && <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[9px] text-white">{item.status === "uploading" ? `${uploadProgress}%` : item.status === "uploaded" ? "READY" : "WAITING"}</span>}
              {!posting && <button type="button" onClick={() => removeDraft(index)} aria-label={`Remove ${item.file.name}`} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-sm text-white">×</button>}
            </div>)}</div>}
            {recording && <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#F9E7E5] px-3 py-2 text-xs text-[#8B3030]"><span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />Recording voice note · {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")} · tap the mic to finish</div>}
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setEmojiOpen((open) => !open)} aria-label="Add emoji" title="Add emoji" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E3D1CB] bg-white text-xl text-[#806F68] hover:bg-[#F7F1E8]">☺</button>
              <textarea ref={messageInput} value={body} onChange={(event) => setBody(event.target.value.slice(0, 1200))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sharePost(); } }} placeholder="Message everyone…" aria-label="Write a message" rows={Math.min(4, Math.max(1, body.split("\n").length))} className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-2xl border border-[#E3D8D2] bg-white px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-taupe/75 focus:border-[#C99A91]" />
              <button type="button" onClick={() => setAttachmentMenu((open) => !open)} aria-label="Add photo, video or audio" title="Add photo, video or audio" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E3D1CB] bg-white text-lg text-[#70434A] hover:bg-[#F7ECE9]">＋</button>
              <button type="button" onClick={() => void startVoiceNote()} disabled={posting || !configured} aria-label={recording ? "Finish voice note" : "Record voice note"} title={recording ? "Finish voice note" : "Record voice note"} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${recording ? "border-red-300 bg-red-50 text-red-700" : "border-[#E3D1CB] bg-white text-[#70434A] hover:bg-[#F7ECE9]"} disabled:opacity-40`}>{recording ? "■" : "🎙"}</button>
              <button type="button" onClick={() => void sharePost()} disabled={posting || !configured || (!body.trim() && !draftMedia.length)} aria-label={posting ? "Sending message" : "Send message"} title="Send message" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#5D8061] text-lg text-white shadow-sm transition-colors hover:bg-[#47614D] disabled:cursor-not-allowed disabled:opacity-40">{posting ? "…" : "➤"}</button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[9px] text-taupe/75"><span>{MAX_POST_MEDIA} attachments per message · chat media stays in this chat</span><span>Stories: {formatBytes(quota.bytes)} / {formatBytes(MAX_TOTAL_BYTES)} used · private</span></div>
            {error && <p role="alert" className="mt-2 rounded-xl bg-burgundy/10 px-3 py-2 text-xs text-burgundy">{error}</p>}
            {notice && <motion.p role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-xl bg-[#EDF2E9] px-3 py-2 text-xs text-[#526B56]">{notice}</motion.p>}
          </div>
        </section>

        <div className="sr-only" aria-live="polite">{liveStatus === "live" ? "Live group chat connected" : liveStatus === "offline" ? "Live chat offline; manual refresh available" : "Connecting to live group chat"}</div>

        <footer className="mt-10 text-center">
          <p className="micro text-taupe/75">Stories: {formatBytes(remainingBytes)} remaining on this device</p>
          <p className="mt-2 font-serif text-xs italic text-taupe/70">A little live chat and keepsake wall for {firstName(couple)} and everyone who loves them.</p>
        </footer>
      </div>
      <AnimatePresence>
        {editingPost && <EditMomentDialog key={editingPost.id} post={editingPost} onClose={() => setEditingPost(null)} onSave={savePostEdit} />}
        {namePromptMode && <NamePromptDialog key={namePromptMode} mode={namePromptMode} initialName={displayName} onClose={() => setNamePromptMode(null)} onSave={saveNamePrompt} />}
      </AnimatePresence>
    </main>
  );
}
