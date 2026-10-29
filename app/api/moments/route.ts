import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE, isAuthed } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";
import type { WeddingMoment } from "@/lib/moments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TABLE = "wedding_moments";
const BUCKET = "wedding-media";
const SIGNED_URL_SECONDS = 60 * 60 * 12;
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
const safeName = (value: unknown) => String(value ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 60) || "A guest";
const safeText = (value: unknown, max: number) => String(value ?? "").replace(/\u0000/g, "").trim().slice(0, max);

type StoredMedia = { path: string; contentType: string };
type Row = {
  id: string;
  display_name: string;
  body: string;
  overlay_text: string;
  media: StoredMedia[];
  device_id: string;
  created_at: string;
};

function configuredDb() {
  // This API must sign private media URLs and write through RLS; anon access is never enough.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return serverSupabase();
}

function validStoragePath(path: string, deviceId: string) {
  const parts = path.split("/");
  return parts.length === 3 &&
    /^\d{4}-\d{2}-\d{2}$/.test(parts[0]) &&
    parts[1] === deviceId &&
    /^[a-z0-9-]{18,50}\.[a-z0-9]{1,8}$/i.test(parts[2]);
}

async function toPublicPost(db: NonNullable<ReturnType<typeof serverSupabase>>, row: Row): Promise<WeddingMoment> {
  const media = await Promise.all((Array.isArray(row.media) ? row.media : []).map(async (item) => {
    if (!item?.path) return null;
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(item.path, SIGNED_URL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return { url: data.signedUrl, contentType: item.contentType || "application/octet-stream" };
  }));
  return {
    id: row.id,
    displayName: row.display_name || "A guest",
    body: row.body || "",
    overlayText: row.overlay_text || "",
    media: media.filter((x): x is NonNullable<typeof x> => Boolean(x)),
    createdAt: row.created_at,
  };
}

export async function GET(req: NextRequest) {
  const db = configuredDb();
  if (!db) return json({ error: "The private moments album needs its server key configured." }, 503);
  const url = req.nextUrl;

  if (url.searchParams.has("since")) {
    const since = url.searchParams.get("since") || "";
    if (!Number.isFinite(Date.parse(since))) return json({ error: "Invalid refresh cursor." }, 400);
    const { count, error } = await db.from(TABLE).select("id", { count: "exact", head: true }).gt("created_at", since);
    if (error) return json({ error: "The moments feed is not set up yet. Please let the couple know." }, 503);
    return json({ newCount: count ?? 0 });
  }

  const admin = url.searchParams.get("admin") === "1";
  if (admin && !(await isAuthed(cookies().get(COOKIE)?.value))) return json({ error: "Sign in to the binder to open the guest gallery." }, 401);
  const requested = Number(url.searchParams.get("limit"));
  const limit = Math.max(1, Math.min(admin ? 24 : 3, Number.isFinite(requested) && requested > 0 ? requested : 3));
  const before = url.searchParams.get("before");
  let query = db.from(TABLE).select("id, display_name, body, overlay_text, media, device_id, created_at").order("created_at", { ascending: false }).limit(limit);
  if (before && Number.isFinite(Date.parse(before))) query = query.lt("created_at", before);
  const { data, error } = await query;
  if (error) return json({ error: "The moments feed is not set up yet. Run the wedding-media and moments sections of supabase/schema.sql." }, 503);

  const rows = (data ?? []) as Row[];
  const posts = await Promise.all(rows.map((row) => toPublicPost(db, row)));
  const hasMore = rows.length === limit;
  return json({ posts, nextCursor: hasMore ? rows[rows.length - 1]?.created_at ?? null : null });
}

export async function POST(req: NextRequest) {
  const db = configuredDb();
  if (!db) return json({ error: "The private moments album needs its server key configured." }, 503);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "We couldn't read that post. Please try again." }, 400);
  }

  const deviceId = String(body.deviceId ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{6,100}$/.test(deviceId)) return json({ error: "Please refresh the page and try again." }, 400);
  const displayName = safeName(body.displayName);
  const text = safeText(body.body, 1200);
  const overlayText = safeText(body.overlayText, 120);
  const rawMedia = Array.isArray(body.media) ? body.media : [];
  if (rawMedia.length > 8) return json({ error: "A post can have up to 8 photos or videos." }, 400);
  const media: StoredMedia[] = [];
  for (const raw of rawMedia) {
    const item = raw as Partial<StoredMedia>;
    const path = String(item.path ?? "");
    const contentType = String(item.contentType ?? "");
    if (!validStoragePath(path, deviceId) || !/^(image|video)\/[a-z0-9.+-]+$/i.test(contentType))
      return json({ error: "One of those media files could not be verified. Please choose it again." }, 400);
    const { error } = await db.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error) return json({ error: "A photo or video is still uploading. Please wait and try again." }, 400);
    media.push({ path, contentType });
  }
  if (!text && !media.length) return json({ error: "Add a note, photo or video before sharing." }, 400);

  // Soft per-device limit; the client has a larger file quota, while this prevents accidental floods.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db.from(TABLE).select("id", { count: "exact", head: true }).eq("device_id", deviceId).gt("created_at", dayAgo);
  if ((count ?? 0) >= 30) return json({ error: "You've shared lots of lovely moments today. Please try again tomorrow." }, 429);

  const { data, error } = await db.from(TABLE)
    .insert({ device_id: deviceId, display_name: displayName, body: text, overlay_text: overlayText, media })
    .select("id, display_name, body, overlay_text, media, device_id, created_at")
    .single();
  if (error || !data) return json({ error: "Your post couldn't be saved just now. Please try again." }, 503);
  return json({ post: await toPublicPost(db, data as Row) }, 201);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed(cookies().get(COOKIE)?.value))) return json({ error: "Sign in to the binder to remove a post." }, 401);
  const db = configuredDb();
  if (!db) return json({ error: "The private moments album needs its server key configured." }, 503);
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "A valid post is required." }, 400);
  const { data: row, error } = await db.from(TABLE).select("id, media").eq("id", id).maybeSingle();
  if (error) return json({ error: "That post couldn't be loaded." }, 503);
  if (!row) return json({ error: "That post has already been removed." }, 404);
  const paths = (Array.isArray(row.media) ? row.media : []).map((m: StoredMedia) => m.path).filter(Boolean);
  if (paths.length) {
    const { error: removeError } = await db.storage.from(BUCKET).remove(paths);
    if (removeError) return json({ error: "The attached media couldn't be removed. Please try again." }, 503);
  }
  const { error: deleteError } = await db.from(TABLE).delete().eq("id", id);
  if (deleteError) return json({ error: "The post couldn't be removed. Please try again." }, 503);
  return json({ ok: true });
}
