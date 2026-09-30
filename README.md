# JS Wedding OS — Shaira & Jeger · 11.11.26

A digital art piece plus a wedding binder, in one Next.js app.

| Part | URL | What it is |
|---|---|---|
| **Public site** | `/` | The one-page editorial site in the Midnight Botanical style: loader, hero + countdown, story marquee, pinned schedule, venue map, interactive dress code, entourage, RSVP, FAQ |
| **The Binder** | `/admin` | Private admin (password: `ADMIN_PASSWORD`, default `JS2026`). Tabs: Overview · Details · Schedule (drag to reorder) · Checklist · Budget · Guests & RSVP · Vendors · Attire & Colors · Content · Settings |

Anything you edit in the Binder shows up on the public site.

## Run locally / StackBlitz
```bash
npm install
npm run dev        # http://localhost:3000   → admin at /admin
```
If you don't set any Supabase keys, the app runs in **local mode**: data is saved in *your browser only* (good for trying it out). Guests' RSVPs only reach you after you connect Supabase.

## Connect Supabase (free, recommended)
1. Create a project at https://supabase.com.
2. **SQL Editor** → paste `supabase/schema.sql` → Run. (It is idempotent — re-running it on an existing project safely adds any new columns, like the RSVP invite-code gate.)
3. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key.
4. Create `.env.local` (copy `.env.example`) and fill in:
   ```
   ADMIN_PASSWORD=JS2026
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
5. Restart, open `/admin` → **Settings → Push starter data to Supabase**.

**Security:** RLS is ON and there are no public policies. The browser never talks to Supabase directly. Every read and write goes through `/api/*` on the server with the service-role key. Public visitors can only read details, schedule, attire, entourage and FAQ, and send RSVPs. Guests, budget, vendors and the checklist need the admin cookie.

## Deploy (GitHub → Vercel)
Import the repo in Vercel, add the four env vars above, then deploy. To change the admin password, edit `ADMIN_PASSWORD` in Vercel and redeploy.

## Structure
```
app/page.tsx                 public site
app/admin/…                  binder + login
app/api/…                    login, data CRUD, rsvp
components/public/…          sections + effects (Lenis, cursor, vines, magnetic, split text)
components/admin/…           binder tabs + UI kit
lib/seed.ts                  all starter data (budget, vendors, checklist, attire…)
lib/db.ts                    Supabase-via-API or localStorage data layer
supabase/schema.sql          database tables
```
