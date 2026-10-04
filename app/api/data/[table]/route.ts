import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { fixRows } from "@/lib/content-fix";
import { codeIsIssued, redactSealed } from "@/lib/invite-gate";
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
  let result = await db.from(params.table).upsert(body).select();
  if (!result.error) return NextResponse.json(result.data);

  // Sent/opened timestamps are nice-to-have on older databases; retry without just those. Never
  // silently drop `greet` or `note`: they're couple-entered data, and doing so made the editor look
  // like it saved while the next reload restored the old values.
  const columnError = (message: string) => /column|does not exist|schema cache|Could not find/i.test(message);
  if (params.table === "guests" && columnError(result.error.message)) {
    const inputRows = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
    const timestampColumns = ["sent_at", "viewed_at"];
    const hasTimestamp = inputRows.some((row) => timestampColumns.some((column) => Object.prototype.hasOwnProperty.call(row, column)));
    if (hasTimestamp) {
      const lite = inputRows.map((row) => {
        const copy = { ...row };
        for (const column of timestampColumns) delete copy[column];
        return copy;
      });
      result = await db.from(params.table).upsert(Array.isArray(body) ? lite : lite[0]).select();
      if (!result.error) return NextResponse.json(result.data);
    }

    const finalError = result.error;
    if (finalError && columnError(finalError.message)) {
      const missingLabels = ["greet", "note"].filter((column) => new RegExp(`\\b${column}\\b`, "i").test(finalError.message));
      if (missingLabels.length) {
        const labels = missingLabels.map((column) => column === "greet" ? "Who it's for" : "notes").join(" and ");
        return NextResponse.json({
          error: `Couldn't save ${labels}: this Supabase project's guests table is missing a required column. In Supabase → SQL Editor, run: ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS greet text DEFAULT ''; ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS note text DEFAULT ''; Then reload the Binder and try again. This edit was not saved.`,
        }, { status: 409 });
      }
    }
  }
  return NextResponse.json({ error: result.error?.message || "save failed" }, { status: 500 });
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
