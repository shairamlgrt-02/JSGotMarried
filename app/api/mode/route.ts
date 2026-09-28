import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ mode: supabaseConfigured() ? "supabase" : "local" });
}
