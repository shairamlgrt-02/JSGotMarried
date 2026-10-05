/** Private Supabase Storage bucket. Guest clips are objects; the table stores only metadata + path. */
export const AUDIO_GUESTBOOK_BUCKET = "guestbook-audio";
export const AUDIO_GUESTBOOK_TABLE = "guestbook_messages";
export const AUDIO_GUESTBOOK_MAX_MS = 20_000;
export const AUDIO_GUESTBOOK_MAX_BYTES = 512 * 1024;

export const AUDIO_GUESTBOOK_MIME_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"] as const;
