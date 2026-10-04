# JS Wedding OS — Shaira & Jeger · 11.11.26

A digital art piece plus a wedding binder, in one Next.js app.

| Part | URL | What it is |
|---|---|---|
| **Front door** | `/` | The hub — deliberately quiet for now: the invitation preview, your code-locked RSVP, and the door reserved for the day-of **games, raffles and giveaways**. Nothing private is on this page. |
| **The invitation preview** | `/preview` | The one-page editorial site in the Midnight Botanical style as the world may see it: loader, hero + countdown, story chapters, 11.11, dress code, entourage, gallery, moments, hashtags. **No venue, no programme, no reply card, no FAQ.** Safe to post anywhere. |
| **An invitation** | `/JS-7KQF` | The same site, unsealed for one household: the invitation wording, the pinned programme, the venue + map, the postcard, the RSVP card and the FAQ. This is the link you send. |
| **RSVP** | `/rsvp` | The code door for guests who lost the link: type the **last 4 characters** of your code (or the whole thing) and you're taken to your own reply card. |
| **The Binder** | `/admin` | Private admin (password: `ADMIN_PASSWORD`, default `JS2026`). Tabs: Overview · Details · Schedule (drag to reorder) · Checklist · Budget · **Invite Codes** · **Guests & RSVP** · Vendors · Attire & Colors · Content · Settings |

Anything you edit in the Binder shows up on the public site.

## What the preview hides (and how it is hidden)
`/preview` is what `jsgotmarried.vercel.app/preview` — and any link you paste into a group chat —
shows. The sealed pages are not merely `display:none`:

* `Site.tsx` never renders the invitation wording, the programme, the venue, the postcard, the RSVP
  card or the FAQ unless a code unlocked them;
* `/api/data/*` withholds the data itself — **venue name, address, both map links and the budget are
  blanked**, and `schedule` / `faq` come back empty, unless the request carries a code the couple
  actually issued (`?code=JS-7KQF`) or the admin cookie. So devtools shows nothing to find;
* `CountdownSection` drops the venue line while sealed, and the envelope card's venue line was
  already sealed-gated.

Two things stay in your hands, because they are your own uploaded words: **the save-the-date graphic**
(Content → Save the Date) and **the shared-link description** (Settings → Website & sharing) both
appear on the preview page and on the WhatsApp/Facebook link card. If the venue is written into either,
the binder now says so — the Settings field shows a heads-up the moment your description repeats your
venue's name.

Sign in to the binder and open `/preview` and you see the finished site instead, with an
`Admin preview` note — that's the one view of everything.

## Invite codes: generate, send, track (`Invite Codes`)
One row per household, one code per row, one reply per code — and a ledger that tells you where
every single invitation stands.

1. `/admin` → **Invite Codes** → **✦ Generate codes**.
   * **Paste your list**, one household per line — `Ana & Ivan, 973 1234 5678, 2 pax`, `Faisal`,
     `Nadia +2, 973 7777 1234, cousins`. Numbers that look like phone numbers become numbers, a
     `+2` / `2 pax` / `(3 seats)` becomes the seat cap, and anything left over becomes your note.
     Names already on the list are skipped, so re-pasting is safe.
   * or **add N blank codes** (labelled `Household 7`, seats 1 or 2) for a card table, and type the
     names in later.
   * Tick *copy every new link afterwards* and your clipboard holds one line per household:
     `name — JS-7KQF — https://your-site/JS-7KQF`. Paste into a chat, done.
2. Per row: **copy link**, **copy message** (the WhatsApp text, ready), **send ↗** (opens WhatsApp
   to that number), **mark sent** (or undo), **new code** (retires the old link), **issue code** for a
   row that never had one, and **✕** to remove the household.
3. Every link you copy or send is marked `sent`; the first time the guest opens it the server stamps
   `opened`; when they answer, the row becomes `confirmed`, `needs review` (a second seat you approve
   with one click) or `declined`. Filter by any of those words, search a name or a code, and read the
   counts at the top. **Copy this view** / **Mark all sent** work on whatever the filter left showing,
   and **Export CSV** carries name, code, link, status, sent/opened/replied timestamps, seats,
   plus-one and message.
4. The guest's reply is written **onto that same row**, so nobody is ever duplicated — and the row
   appears on **Guests & RSVP** (the list of people who actually answered, plus anyone you added by
   hand). Guests who already replied see a sealed "welcome" card instead of the form, and the same
   code can't reply twice. If your list still shows doubled rows from an older build, the
   **Merge N duplicates** button at the top of Guests & RSVP folds each household back into one row.

`sent_at`, `viewed_at` and `note` are new columns (re-run `supabase/schema.sql`; it is idempotent). A
project that hasn't caught up still works: those three are dropped quietly on save, and the RSVPs
themselves never depend on them.

### The guest's side
* Their link is `https://your-site/JS-7KQF`. The older `https://your-site/?rsvp=JS-7KQF` you may
  already have sent still works — it lands on the same page.
* No link handy? `https://your-site/rsvp` asks for a code and the **last four characters are enough**
  (`7KQF`), in any case, spaces and all trimmed. A tail that could belong to two households is refused
  rather than guessed, and one code answers for exactly one household.
* Nothing about the venue, the programme or the FAQ is reachable without a code, and a wrong code
  unlocks nothing.

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

> **Renamed a hashtag?** Because the site reads the saved row (not the starter data), a project seeded before a rename keeps the old words. The app repairs that itself: wording the code has renamed — `#JSWeDo` → `#JSSayIDo` — is fixed as the rows are read and saved back the first time the site loads, so the site, the FAQ, the share preview and the keepsake card all agree with no SQL. `supabase/schema.sql` carries the matching one-off `update` if you would rather run it in the SQL editor.

## Updating the FAQ / dress-code copy
Everything in the FAQ is editable any time in **Content → FAQ** (question, answer, order, add, delete). When the *standard* questions change in the code — the dress-code palette, the kids' policy, parking — press **Refresh wording** on that card: it rewrites the standard questions with the newest copy (and restores one you deleted) while leaving any question you wrote yourself untouched. The ordinary "Push starter data" in Settings only ever fills in missing rows, so it won't refresh wording that already exists.

## Run locally / StackBlitz
```bash
npm install
npm run dev        # http://localhost:3000   → admin at /admin
```
If you don't set any Supabase keys, the app runs in **local mode**: data is saved in *your browser only* (good for trying it out). Guests' RSVPs only reach you after you connect Supabase. Codes, the ledger, the tail-matching at `/rsvp` and the whole reply journey run in local mode too, so you can rehearse the guest experience before a single invite goes out.

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
app/page.tsx                 the front door (hub) + the legacy ?rsvp=… hop
app/preview/page.tsx         the sealed public preview
app/rsvp/page.tsx            the code-locked reply door
app/[code]/page.tsx          a household's own unsealed invitation
app/admin/…                  binder + login
app/api/…                    login, data CRUD, rsvp
lib/guests.ts                codes: matching, statuses, bulk paste, links
lib/invite-gate.ts           what a sealed visitor may read (server side)
components/public/…          sections + effects (Lenis, cursor, vines, magnetic, split text)
components/admin/…           binder tabs + UI kit
lib/seed.ts                  all starter data (budget, vendors, checklist, attire…)
lib/db.ts                    Supabase-via-API or localStorage data layer
supabase/schema.sql          database tables
```
