import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { icsFilename, icsText, weddingEvent } from "@/lib/calendar";
import { DEMO_CODE } from "@/lib/guests";
import { codeIsIssued, redactSealed } from "@/lib/invite-gate";
import { SEED } from "@/lib/seed";
import { serverSupabase } from "@/lib/supabase-server";
import type { WeddingInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The calendar file behind the site's "Add to Calendar" button — served as a real .ics at a real
 * URL, on purpose. iOS Safari refuses to open a calendar file built in the page (WebKit blocks
 * navigations to `data:` URLs, and a blob download just lands in Files), but it happily hands a
 * `text/calendar` *response* to Calendar's "Add event" card. Everything else — Android, Outlook,
 * Apple Calendar on the desktop — downloads the same file.
 *
 * `?code=` is the guest's own invitation code: the venue and the map link travel with the event
 * only for a code the couple issued (or the binder's cookie), exactly like /api/data. A sealed or
 * preview visitor saves the date, nothing more.
 */
async function weddingInfo(req: NextRequest, code: string): Promise<WeddingInfo> {
  const fallback = SEED.wedding_info[0] as WeddingInfo;
  const db = serverSupabase();
  // Local mode (no Supabase keys) has no database to ask, so the seeded invitation — the same one
  // the site itself renders — answers instead, and only the binder or the perpetual demo invite
  // unseals it. No keys, no leaked venue.
  const row = db
    ? (((await db.from("wedding_info").select("*").limit(1)).data ?? [])[0] as WeddingInfo | undefined) ?? fallback
    : fallback;

  const authed = await isAuthed(cookies().get(COOKIE)?.value);
  const issued = db ? await codeIsIssued(db as never, code) : code === DEMO_CODE;
  if (authed || issued) return row;

  // Sealed: the server withholds the venue from /api/data, and the calendar file follows.
  const [safe] = redactSealed("wedding_info", [row as unknown as Record<string, unknown>]) as unknown as WeddingInfo[];
  return safe;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() || "";
  const info = await weddingInfo(req, code);

  // The guest's own invitation travels inside the event, so their calendar links back to the
  // page they saved it from. Built from the request origin — never from a query parameter.
  const inviterUrl = code ? `${req.nextUrl.origin}/${encodeURIComponent(code)}` : `${req.nextUrl.origin}/`;
  const event = weddingEvent(info, inviterUrl);

  return new NextResponse(icsText(event, req.nextUrl.host), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // `inline` (not `attachment`) is what lets iOS open the Calendar import card instead of
      // dropping the file into Downloads. Desktop browsers download it either way.
      "Content-Disposition": `inline; filename="${icsFilename(info)}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
