import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { fixRows } from "@/lib/content-fix";
import { codeIsIssued, invalidateIssuedCodeCache, redactSealed, SEALED_EMPTY_TABLES } from "@/lib/invite-gate";
import { invalidateSiteMetaCache } from "@/lib/site-meta";
import { serverSupabase } from "@/lib/supabase-server";
import { PUBLIC_TABLES, TABLES, TableName } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Short-lived server-side cache for the public display tables (wedding_info, schedule, attire,
 * entourage, faq, story). Guests opening invitations read from memory instead of re-downloading
 * multi-megabyte base64 photo rows from Supabase on every page load; any POST/DELETE from the
 * binder invalidates the table immediately so edits still go live right away.
 */
const publicTableCache = new Map<string, { rows: { id?: string }[]; expires: number }>();
const PUBLIC_CACHE_TTL_MS = 60_000;

function invalidateTableCache(table: string) {
  publicTableCache.delete(table);
  if (table === "wedding_info") invalidateSiteMetaCache();
  if (table === "guests") invalidateIssuedCodeCache();
}

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
  const isSealed = await sealed(req, db);
  // Sealed visitors receive [] for schedule and faq — skip the database query entirely.
  if (isSealed && (SEALED_EMPTY_TABLES as readonly string[]).includes(params.table)) {
    return NextResponse.json([]);
  }

  const isPublicTable = PUBLIC_TABLES.includes(params.table as TableName);
  const cached = isPublicTable ? publicTableCache.get(params.table) : undefined;
  let fixed: { id?: string }[];

  if (cached && Date.now() < cached.expires) {
    fixed = cached.rows;
  } else {
    const { data, error } = await db.from(params.table).select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []) as { id?: string }[];
    // Wording renamed in the code (#JSWeDo → #JSSayIDo) is repaired on the way out and saved back
    // once, so a project seeded before the rename catches up without anyone opening the SQL editor.
    const repaired = fixRows(params.table as TableName, rows);
    fixed = repaired.rows;
    if (repaired.patches.length) {
      try {
        await Promise.all(repaired.patches.map((p) => db.from(params.table).update(p.fields).eq("id", p.id)));
      } catch { /* the fixed copy is still what we serve */ }
    }
    if (isPublicTable) {
      publicTableCache.set(params.table, { rows: fixed, expires: Date.now() + PUBLIC_CACHE_TTL_MS });
    }
  }

  // A sealed visitor sees no venue, no programme and no FAQ — the pages a code unlocks. Answered
  // straight from the fetched rows: nothing of a redacted read is ever written back to the table.
  if (isSealed) return NextResponse.json(redactSealed(params.table, fixed as Record<string, unknown>[]));
  return NextResponse.json(fixed);
}

/** Upsert one row or an array of rows. */
export async function POST(req: NextRequest, { params }: { params: { table: string } }) {
  const db = await guard(params.table, true);
  if (db instanceof NextResponse) return db;
  const body = await req.json();
  let result = await db.from(params.table).upsert(body);
  if (!result.error) {
    invalidateTableCache(params.table);
    return NextResponse.json({ ok: true });
  }

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
      result = await db.from(params.table).upsert(Array.isArray(body) ? lite : lite[0]);
      if (!result.error) {
        invalidateTableCache(params.table);
        return NextResponse.json({ ok: true });
      }
    }

    const finalError = result.error;
    if (finalError && columnError(finalError.message)) {
      const knownColumns: { col: string; label: string; ddl: string }[] = [
        { col: "greet", label: "Who it's for", ddl: "ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS greet text DEFAULT '';" },
        { col: "note", label: "notes", ddl: "ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS note text DEFAULT '';" },
        { col: "tags", label: "guest tags", ddl: "ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS tags text DEFAULT '';" },
        { col: "role", label: "day-of role", ddl: "ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS role text DEFAULT '';" },
        { col: "role_note", label: "role note", ddl: "ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS role_note text DEFAULT '';" },
      ];
      const missing = knownColumns.filter(({ col }) => new RegExp(`\\b${col}\\b`, "i").test(finalError.message));
      if (missing.length) {
        const labels = missing.map((m) => m.label).join(" and ");
        const ddl = missing.map((m) => m.ddl).join(" ");
        return NextResponse.json({
          error: `Couldn't save ${labels}: this Supabase project's guests table is missing a required column. In Supabase → SQL Editor, run: ${ddl} Then reload the Binder and try again. This edit was not saved.`,
        }, { status: 409 });
      }
    }
  }
  if (params.table === "checklist" && columnError(result.error.message)) {
    // The sheet's Category (section), Person In-charge (owner) and Details/Notes columns: like
    // greet/note above, they are never silently dropped — a project that hasn't re-run
    // schema.sql gets the exact SQL to run, and the edit is not saved.
    const finalError = result.error;
    if (finalError && columnError(finalError.message)) {
      const knownColumns: { col: string; ddl: string }[] = [
        { col: "section", ddl: "ALTER TABLE public.checklist ADD COLUMN IF NOT EXISTS section text DEFAULT '';" },
        { col: "owner", ddl: "ALTER TABLE public.checklist ADD COLUMN IF NOT EXISTS owner text DEFAULT '';" },
        { col: "details", ddl: "ALTER TABLE public.checklist ADD COLUMN IF NOT EXISTS details text DEFAULT '';" },
      ];
      const missing = knownColumns.filter(({ col }) => new RegExp(`\\b${col}\\b`, "i").test(finalError.message));
      if (missing.length) {
        const ddl = missing.map((m) => m.ddl).join(" ");
        return NextResponse.json({
          error: `Couldn't save the checklist columns (section / owner / details): this Supabase project's checklist table is missing them. In Supabase → SQL Editor, run: ${ddl} Then reload the Binder and try again. This edit was not saved.`,
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
  invalidateTableCache(params.table);
  return NextResponse.json({ ok: true });
}
