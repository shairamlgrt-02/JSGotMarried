# JS Wedding OS — Shaira & Jeger · 11.11.26

A digital art piece plus a wedding binder, in one Next.js app.

| Part | URL | What it is |
|---|---|---|
| **Public site** | `/` | The one-page editorial site in the Midnight Botanical style: loader, hero + countdown, story marquee, pinned schedule, venue map, interactive dress code, entourage, RSVP, FAQ |
| **The Binder** | `/admin` | Private admin (password: `ADMIN_PASSWORD`, default `JS2026`). Tabs: Overview · Details · Schedule (drag to reorder) · Checklist · Budget · Guests & RSVP · Vendors · Attire & Colors · Content · Settings |

Anything you edit in the Binder shows up on the public site.

## Sending invite links (Guests & RSVP)
1. `/admin` → **Guests & RSVP** → **+ Add guest** — one row per household: name, WhatsApp number, and *pax* = how many seats you're inviting them to (1 or 2).
2. In the **Invite** column hit **issue code** — the row gets a personal code, e.g. `JS-7KQF`.
3. Hit **copy link** (`https://your-site/?rsvp=JS-7KQF`) or **send ↗** to open WhatsApp with the invitation already written, then send it to that guest. `https://your-site/JS-7KQF` works too.
4. They open the link, the private pages unseal and they fill the form once. Their reply is written **onto that same row** (never a second row), so the binder stays one row per household: the code turns into a `confirmed` or `needs review` tag, and a plus-one is approved with one click.

Guests who already replied see a sealed "welcome" card instead of the form, and the same code can't reply twice. If your list still shows doubled rows from an older build, the **Merge N duplicates** button at the top of the tab folds each household back into one row.

## Website settings (tab title, share preview, favicon)
**Settings → Website & sharing** controls how the site introduces itself, with a live mock of the shared-link card:

| Field | Where it shows |
|---|---|
| **Browser tab title** | the browser/bookmark tab |
| **Description on shared links** | the text under the title when the link is shared on WhatsApp, iMessage or Facebook (and in search results) |
| **Preview banner** | the image in that shared-link card — 1200 × 630 looks best; upload one or paste a link to a hosted image |
| **Favicon** | the little icon in the tab, bookmarks and phone home screens — square, 512 × 512 or smaller |

These are read from the database on every request, so edits go live without a redeploy. Uploaded banners are served through `/api/og-image` because WhatsApp/Facebook crawlers can't read images stored in the database. WhatsApp and Facebook cache link previews, so a new banner can take a few minutes to show up.

## Instagram: follow us & tag your moments
The site ends with a **Follow our story** section — a follow button for your page, and your wedding hashtags as tappable chips that open each tag on Instagram.

It is driven by **Details → Social** in the binder:

| Field | What it does |
|---|---|
| **Instagram** | the handle. The section (and the footer link) appear only when this is filled in — so while the account doesn't exist yet, leave the field empty and nothing links to a dead page. Create the account, type the handle, and the section appears instantly, no deploy needed. |
| **Hashtags** | space separated, `#` added for you. Each one becomes a tappable tag link. |
| **Follow & tag invitation** | the line inviting guests to follow along and tag their moments — write it however you like. |

The FAQ's photo answer and the footer keep pointing at the same handle and hashtags, so everything stays in step.

## Updating the FAQ / dress-code copy
Everything in the FAQ is editable any time in **Content → FAQ** (question, answer, order, add, delete). When the *standard* questions change in the code — the dress-code palette, the kids' policy, parking — press **Refresh wording** on that card: it rewrites the standard questions with the newest copy (and restores one you deleted) while leaving any question you wrote yourself untouched. The ordinary "Push starter data" in Settings only ever fills in missing rows, so it won't refresh wording that already exists.

## Run locally / StackBlitz
```bash
npm install
npm run dev        # http://localhost:3000   → admin at /admin
```
If you don't set any Supabase keys, the app runs in **local mode**: data is saved in *your browser only* (good for trying it out). Guests' RSVPs only reach you after you connect Supabase.

## Connect Supabase (free, recommended)
1. Create a project at https://supabase.com.
2. **SQL Editor** → paste `supabase/schema.sql` → Run.

> **Self-test any time:** open `/test` (or `/JS-DEMO`) on any deployment — the whole site unseals with a perpetual demo invite and the RSVP journey runs on throwaway data kept only in your browser ("test again" resets it). Demo replies never enter the guest list and never send e-mail. (It is idempotent — re-running it on an existing project safely adds any new columns, like the RSVP invite-code gate.)
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
