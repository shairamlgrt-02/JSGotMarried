"use client";
import { useCallback, useEffect, useState } from "react";
import { deleteMoment, loadMoments, type WeddingMoment } from "@/lib/moments";
import { Btn, Card } from "./ui";

export function MomentGallery() {
  const [posts, setPosts] = useState<WeddingMoment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await loadMoments({ admin: true, limit: 24 });
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const loadOlder = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await loadMoments({ admin: true, limit: 24, before: nextCursor });
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...page.posts.filter((post) => !seen.has(post.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const remove = async (post: WeddingMoment) => {
    if (!window.confirm("Remove this moment and its uploaded photos/videos from the private album?")) return;
    setRemoving(post.id);
    setError("");
    try {
      await deleteMoment(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Card title={`Guest moments · ${posts.length} loaded`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink/55">Photos, videos and notes guests have shared on the Memory Wall.</p>
        <Btn variant="ghost" onClick={() => void reload()} disabled={loading}>{loading ? "Refreshing…" : "Refresh gallery ↻"}</Btn>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-burgundy/10 p-3 text-sm text-burgundy">{error}</p>}
      {loading && !posts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-oat/60" />)}
        </div>
      ) : posts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const showAll = expanded.has(post.id);
            const media = showAll ? post.media : post.media.slice(0, 4);
            const overflow = post.media.length - media.length;
            return (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-taupe/20 bg-white/70">
                {media.length > 0 && (
                  <div className="grid grid-cols-2 gap-0.5 bg-ink/5">
                    {media.map((item, index) => (
                      <div key={`${post.id}-${index}`} className={`relative aspect-square overflow-hidden bg-oat ${media.length === 1 ? "col-span-2" : ""}`}>
                        {item.contentType.startsWith("video/") ? (
                          <video src={item.url} controls playsInline preload="metadata" className="h-full w-full object-cover" />
                        ) : (
                          <img src={item.url} alt={`Guest moment ${index + 1}`} loading="lazy" className="h-full w-full object-cover" />
                        )}
                        {post.overlayText && <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded bg-ink/60 px-2 py-1 text-center text-xs text-white">{post.overlayText}</span>}
                        {overflow > 0 && index === media.length - 1 && (
                          <button type="button" onClick={() => setExpanded((old) => new Set(old).add(post.id))} className="absolute inset-0 grid place-items-center bg-ink/65 font-serif text-3xl text-white">+{overflow}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-mocha">{post.displayName}</p>
                      <p className="micro mt-0.5 text-taupe">{new Date(post.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <button type="button" onClick={() => void remove(post)} disabled={removing === post.id} className="micro shrink-0 text-burgundy/70 hover:text-burgundy disabled:opacity-50">
                      {removing === post.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                  {post.body && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/80">{post.body}</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : !error ? (
        <div className="rounded-xl border border-dashed border-taupe/30 bg-oat/25 px-5 py-10 text-center font-serif italic text-ink/45">No guest moments yet — shared notes and media will appear here.</div>
      ) : null}
      {posts.length > 0 && nextCursor && (
        <button type="button" onClick={() => void loadOlder()} disabled={loadingMore} className="micro mt-4 w-full rounded-full border border-taupe/25 bg-white/65 py-3 text-taupe transition-colors hover:border-wine hover:text-wine disabled:opacity-50">
          {loadingMore ? "Loading older moments…" : "Load older moments ↓"}
        </button>
      )}
    </Card>
  );
}
