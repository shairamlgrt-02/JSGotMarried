import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUDIO_GUESTBOOK_BUCKET, AUDIO_GUESTBOOK_MAX_BYTES, AUDIO_GUESTBOOK_MAX_MS, AUDIO_GUESTBOOK_MIME_TYPES, AUDIO_GUESTBOOK_TABLE } from "@/lib/guestbook";
import { COOKIE, isAuthed } from "@/lib/auth";
import { cleanCode, DEMO_CODE } from "@/lib/guests";
import { codeIsIssued } from "@/lib/invite-gate";
import { serverSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });
const allowedMime = new Set<string>(AUDIO_GUESTBOOK_MIME_TYPES);

function matchesAudioSignature(bytes: Buffer, mime: string) {
  if (mime === "audio/webm") return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mime === "audio/ogg") return bytes.length >= 4 && bytes.toString("ascii", 0, 4) === "OggS";
  if (mime === "audio/mp4") return bytes.length >= 8 && bytes.toString("ascii", 4, 8) === "ftyp";
  if (mime === "audio/mpeg") return bytes.length >= 3 && (
    bytes.toString("ascii", 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  );
  return false;
}

/**
 * POST /api/guestbook — invite-only, anonymous audio upload.
 * The invitation code is validated, then deliberately discarded: neither it, a name nor an IP
 * address is written to the message row. The media itself goes to a private Storage bucket.
 */
export async function POST(req: NextRequest) {
  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > AUDIO_GUESTBOOK_MAX_BYTES + 32 * 1024) return jsonError("That recording is too large. Please record a shorter note.", 413);

  let form: FormData;
  try { form = await req.formData(); }
  catch { return jsonError("The recording could not be read. Please try again.", 400); }

  const codeField = form.get("code");
  const code = cleanCode(typeof codeField === "string" ? codeField : "");
  if (!code || code === DEMO_CODE) return jsonError("Open your personal wedding invitation to leave a note.", 403);
  const upload = form.get("file");
  if (!upload || typeof upload === "string") return jsonError("Choose a recording before sending it.", 400);
  if (upload.size < 1 || upload.size > AUDIO_GUESTBOOK_MAX_BYTES) return jsonError("That recording is too large. Please record again.", 413);

  const mime = upload.type.split(";")[0].trim().toLowerCase();
  if (!allowedMime.has(mime)) return jsonError("This audio format isn't supported by the guestbook.", 415);
  const durationMs = Number(form.get("durationMs"));
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > AUDIO_GUESTBOOK_MAX_MS) {
    return jsonError("Recordings need to be between half a second and 20 seconds.", 400);
  }

  const db = serverSupabase();
  if (!db) return jsonError("The audio guestbook isn't connected yet. Please let the couple know.", 503);
  try {
    if (!(await codeIsIssued(db as never, code))) return jsonError("We couldn't match that invitation. Open your personal link and try again.", 403);
  } catch (error) {
    console.error("guestbook invite validation failed:", error);
    return jsonError("We couldn't verify that invitation just now. Please try again.", 503);
  }

  let bytes: Buffer;
  try { bytes = Buffer.from(await upload.arrayBuffer()); }
  catch { return jsonError("The recording could not be read. Please try again.", 400); }
  if (!matchesAudioSignature(bytes, mime)) return jsonError("That file doesn't appear to be a supported audio recording.", 415);

  const extension = mime === "audio/webm" ? "webm" : mime === "audio/ogg" ? "ogg" : mime === "audio/mp4" ? "m4a" : "mp3";
  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await db.storage.from(AUDIO_GUESTBOOK_BUCKET).upload(path, bytes, {
    contentType: mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    console.error("guestbook audio upload failed:", uploadError.message);
    const message = /bucket not found|not found/i.test(uploadError.message)
      ? "The audio guestbook isn't set up yet. Please let the couple know."
      : "We couldn't save your note just now. Please try again in a little while.";
    return jsonError(message, 503);
  }

  const { error: insertError } = await db.from(AUDIO_GUESTBOOK_TABLE).insert({
    storage_path: path,
    content_type: mime,
    file_size_bytes: bytes.byteLength,
    duration_ms: Math.round(durationMs),
  });
  if (insertError) {
    console.error("guestbook metadata insert failed:", insertError.message);
    await db.storage.from(AUDIO_GUESTBOOK_BUCKET).remove([path]);
    return jsonError("The guestbook couldn't save that note just now. Please try again.", 503);
  }

  return NextResponse.json({ ok: true, message: "Your note has been left with love." }, { status: 201 });
}

/** Couple-only list endpoint. Audio links are short-lived signed URLs, never public bucket URLs. */
export async function GET() {
  if (!(await isAuthed(cookies().get(COOKIE)?.value))) return jsonError("Sign in to the wedding binder to listen to notes.", 401);
  const db = serverSupabase();
  if (!db) return jsonError("Supabase isn't configured yet.", 503);

  const { data, error } = await db.from(AUDIO_GUESTBOOK_TABLE)
    .select("id, storage_path, content_type, file_size_bytes, duration_ms, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("guestbook list failed:", error.message);
    return jsonError("The audio guestbook isn't set up yet. Run the guestbook section in supabase/schema.sql.", 503);
  }

  const messages = await Promise.all((data ?? []).map(async (row: { id: string; storage_path: string; content_type: string; file_size_bytes: number; duration_ms: number; created_at: string }) => {
    const { data: signed, error: signError } = await db.storage.from(AUDIO_GUESTBOOK_BUCKET).createSignedUrl(row.storage_path, 60 * 60);
    if (signError) throw signError;
    return {
      id: row.id,
      contentType: row.content_type,
      fileSizeBytes: row.file_size_bytes,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
      audioUrl: signed.signedUrl,
    };
  })).catch((error: unknown) => {
    console.error("guestbook signing failed:", error);
    return null;
  });

  if (!messages) return jsonError("The audio files aren't available right now. Check the private Storage bucket and try again.", 503);
  return NextResponse.json({ messages });
}

/** Couple-only removal; remove the private object as well as its metadata row. */
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed(cookies().get(COOKIE)?.value))) return jsonError("Sign in to the wedding binder to manage notes.", 401);
  const db = serverSupabase();
  if (!db) return jsonError("Supabase isn't configured yet.", 503);
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return jsonError("A valid note id is required.", 400);

  const { data: row, error: readError } = await db.from(AUDIO_GUESTBOOK_TABLE)
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (readError) return jsonError("The note couldn't be loaded. Please try again.", 503);
  if (!row) return jsonError("That note has already been removed.", 404);

  const { error: storageError } = await db.storage.from(AUDIO_GUESTBOOK_BUCKET).remove([row.storage_path]);
  if (storageError) {
    console.error("guestbook audio delete failed:", storageError.message);
    return jsonError("The audio file couldn't be removed. Please try again.", 503);
  }
  const { error: rowError } = await db.from(AUDIO_GUESTBOOK_TABLE).delete().eq("id", id);
  if (rowError) {
    console.error("guestbook metadata delete failed:", rowError.message);
    return jsonError("The file was removed, but its list entry couldn't be cleared. Refresh the page.", 503);
  }
  return NextResponse.json({ ok: true });
}
