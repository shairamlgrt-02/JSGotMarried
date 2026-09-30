import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { serverSupabase } from "@/lib/supabase-server";
import { PUBLIC_TABLES, TABLES, TableName } from "@/lib/types";

export const dynamic = "force-dynamic";

async function guard(table: string, write: boolean) {
  if (!TABLES.includes(table as TableName)) return NextResponse.json({ error: "unknown table" }, { status: 404 });
  const db = serverSupabase();
  if (!db) return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  const authed = await isAuthed(cookies().get(COOKIE)?.value);
  if ((write || !PUBLIC_TABLES.includes(table as TableName)) && !authed)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return db;
}

export async function GET(_: NextRequest, { params }: { params: { table: string } }) {
  const db = await guard(params.table, false);
  if (db instanceof NextResponse) return db;
  const { data, error } = await db.from(params.table).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** Upsert one row or an array of rows. */
export async function POST(req: NextRequest, { params }: { params: { table: string } }) {
  const db = await guard(params.table, true);
  if (db instanceof NextResponse) return db;
  const body = await req.json();
  const { data, error } = await db.from(params.table).upsert(body).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { table: string } }) {
  const db = await guard(params.table, true);
  if (db instanceof NextResponse) return db;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await db.from(params.table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
