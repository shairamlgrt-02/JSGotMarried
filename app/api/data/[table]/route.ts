import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { fixRows } from "@/lib/content-fix";
import { OPTIONAL_GUEST_COLS, codeIsIssued, redactSealed } from "@/lib/invite-gate";
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

/**
 * The public pages read the same tables the binder edits, so a sealed visitor must not be able
 * to open devtools and fetch what the invitation is hiding. Everything a locked guest asks for
 * goes through `redactSealed` unless the request carries an issued invitation code (`?code=`)
 * or the admin cookie.
 */
async function sealed(req: NextRequest, db: ReturnType<typeof serverSupabase>): Promise<boolean> {
  const authed = await isAuthed(cookies().get(COOKIE)?.value);
  if (authed) return false;
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!code) return true;
  if (!db) return true;
  return !(await codeIsIssued(db as never, code));
}

export async function GET(req: NextRequest, { params }: { params: { table: string } }) {
  const db = await guard(params.table, false);
  if (db instanceof NextResponse) return db;
  const { data, error } = await db.from(params.table).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as { id?: string }[];
  // A sealed visitor sees no venue, no programme and no FAQ — the pages a code unlocks. Answered
  // straight from the fetched rows: nothing of a redacted read is ever written back to the table.
  if (await sealed(req, db)) return NextResponse.json(redactSealed(params.table, rows as Record<string, unknown>[]));
  // Wording renamed in the code (#JSWeDo → #JSSayIDo) is repaired on the way out and saved back
  // once, so a project seeded before the rename catches up without anyone opening the SQL editor.
  const { rows: fixed, patches } = fixRows(params.table as TableName, rows);
  if (patches.length) {
    try {
      await Promise.all(patches.map((p) => db.from(params.table).update(p.fields).eq("id", p.id)));
    } catch { /* the fixed copy is still what we serve */ }
  }
  return NextResponse.json(fixed);
}

/** Upsert one row or an array of rows. */
export async function POST(req: NextRequest, { params }: { params: { table: string } }) {
  const db = await guard(params.table, true);
  if (db instanceof NextResponse) return db;
  const body = await req.json();
  const { data, error } = await db.from(params.table).upsert(body).select();
  if (!error) return NextResponse.json(data);
  // Ledger columns (note / sent_at / viewed_at) arrive with the newest schema. A project that
  // hasn't re-run supabase/schema.sql yet must still be able to save a guest, so the write is
  // retried without them — the invite codes and RSVPs themselves never depend on those fields.
  const columnError = /column|does not exist|schema cache|Could not find/i.test(error.message);
  if (params.table === "guests" && columnError) {
    const lite = (Array.isArray(body) ? body : [body]).map((r: Record<string, unknown>) => {
      const o = { ...r };
      for (const k of OPTIONAL_GUEST_COLS) delete o[k];
      return o;
    });
    const retry = await db.from(params.table).upsert(Array.isArray(body) ? lite : lite[0]).select();
    if (!retry.error) return NextResponse.json(retry.data);
    return NextResponse.json({ error: retry.error.message }, { status: 500 });
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
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
