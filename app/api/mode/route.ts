import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseConfigured } from "@/lib/supabase-server";
import { COOKIE, isAuthed } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  // the binder's session unlocks a full-site preview for the couple (guests still need their codes)
  const admin = await isAuthed(cookies().get(COOKIE)?.value);
  return NextResponse.json({ mode: supabaseConfigured() ? "supabase" : "local", admin });
}
