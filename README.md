# JS Wedding OS — Shaira & Jeger · 11.11.26

A digital art piece plus a wedding binder, in one Next.js app.

| Part | URL | What it is |
|---|---|---|
| **Front door** | `/` | The compact, phone-first hub: tiles for the **gift list** (`/gifts`), the **photo & video upload album** (`/upload`), the code-locked **RSVP**, **Instagram** and the sealed **games & raffles** door (opens on the day), plus a live countdown pill and a quiet link to the full invitation at the bottom. Nothing private is on this page. |
| **The invitation preview** | `/preview` | The one-page editorial site in the Midnight Botanical style as the world may see it: loader, hero + countdown, story chapters, 11.11, dress code, entourage, gallery, moments, hashtags. **No venue, no programme, no reply card, no FAQ.** Safe to post anywhere. |
| **An invitation** | `/JS-7KQF` | The same site, unsealed for one household: the invitation wording, the pinned programme, the venue + map, the postcard, the RSVP card and the FAQ. This is the link you send. |
| **RSVP** | `/rsvp` | The code door for guests who lost the link: type the **last 4 characters** of your code (or the whole thing) and you're taken to your own reply card. |
| **The Binder** | `/admin` | Private admin (password: `ADMIN_PASSWORD`, default `JS2026`). Tabs: Overview · Details · Schedule (drag to reorder) · Checklist · Budget · **Invite Codes** · **Guests & RSVP** · **Guest Roles** · **Audio Guestbook** · **Compose / Templates / Tracker** · Vendors · Attire & Colors · **Bridesmaid Cards** · Content · Settings |

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

## Add to Calendar (the button under the verse)
The 11.11 dedication — names, date, the 1 Corinthians verse — closes with the one thing a guest
should do first: **Add to Calendar**. One big button, and a small sheet that asks which calendar
they use, so nobody has to know what an `.ics` is:

| Tap | What happens |
|---|---|
| **Apple Calendar** | opens `/api/calendar` — a real `text/calendar` file. iOS Safari hands it straight to Calendar's **Add event** card; Mac, Outlook, Samsung and Xiaomi open or download the same file. |
| **Google Calendar** | opens Google Calendar's pre-filled *add event* screen in a new tab — the Android path. |

Both carry the same times (ceremony → send-off, 4–10 PM Bahrain time), the venue with its map link,
a note with the couple's hashtags and the guest's own invitation link, plus a **reminder the day
before** they can change in their app. The row for the phone in hand is marked *Suggested*. The
note also carries the one rule of the day — *be seated before 4:00 PM, the doors close as the procession
begins; everyone is welcome from 5:30 PM* — so a guest who only ever reads their calendar still
arrives in time (the hour is the ceremony time from **Details**).

* **Everything comes from the binder.** The date, time, names and venue are read from
  `wedding_info`, so moving the wedding in **Details** moves every calendar with no redeploy — and
  the day is always read off the Bahrain calendar, never the guest's device time zone.
* **The venue stays sealed.** The file is served with the guest's `?code=`, through the same gate as
  `/api/data`: an issued code (or the binder's cookie) unlocks the address, a preview visitor gets
  the date and nothing more. The client never guesses — a guest on a personalised link passes their
  code along automatically.
* **A real URL, on purpose.** iOS Safari blocks top-level `data:` navigations and drops blob
  downloads into Files, so the `.ics` is a server response instead (`app/api/calendar/route.ts`,
  `Content-Disposition: inline`). Edit the wording, the title or the reminder in `lib/calendar.ts`.

## The programme (and the two cards)
The order of the day lives in **one file, `lib/program.ts`**, and every surface reads it so they can
never disagree: the six-stop timeline and the three "How the day unfolds" cards in the **Program**
section, the guest's downloadable **invitation card** (the PNG offered after they reply), the
downloadable **programme card** (below), and — for the two times that matter — the FAQ and the
calendar note.

**The one flow of the day (updated with The Heaven's rule):** the hall is **closed 2:00 – 4:00 PM**
while The Heaven's team clean and prepare it — so *nobody* enters before 4:00, and *everyone*
(entourage and wedding team included) comes **straight to the majlis**, where the coordinators meet
them, the entourage is briefed, and snacks & refreshments are served. A few minutes before 4:00 the
whole party **walks into the hall together**, and the doors close as the procession begins. Every
surface tells the same story: the timeline's first stop, the "read this first" panel and the map on
the programme card, the keepsake's programme, the FAQ's *Where do I go when I arrive?* and the
calendar note. Change an hour in `lib/program.ts` (`HALL_CLOSED_FROM`, `CEREMONY_DOORS_CLOSE`,
`ENTOURAGE_CALL_TIME`, `ALL_WELCOME_FROM`, `RECEPTION_AT`) and every one of them follows.

| | Where it shows |
|---|---|
| `WEDDING_PROGRAM_STOPS` | the timeline, and the *Order of the day* on both cards. A stop's short `tag` ("Doors close at 4:00 PM", "Everyone welcome") sits under its name on the timeline and beside it on the programme card; its one-line `note` is printed under it on the keepsake; its `programmeNote` — the warm line, where the facts are already said higher up — under it on the programme card. |
| `WEDDING_PROGRAM_HIGHLIGHTS` | the three cards: the span of hours on the ribbon and the couple's own warm description underneath. Wrap the parts a guest must not miss in `*asterisks*` — `*4:00 PM*`, `*everyone is welcome*` — and the card sets them in bold wine. |
| `HALL_CLOSED_FROM` · `CEREMONY_DOORS_CLOSE` · `ENTOURAGE_CALL_TIME` · `ALL_WELCOME_FROM` · `RECEPTION_AT` | the hours guests must not miss, written once: the **hall rests 2:00 – 4:00 PM** while it is cleaned and prepared; the entourage's call time is **3:30 PM at the majlis** (coordinators brief them there); everyone walks in together just before **4:00 PM**; from **5:30 PM everyone is welcome** for the Welcome Toast & Snacks, then the reception at **6:30**. |
| `PROGRAM_HEADLINE` · `ARRIVAL_NOTES` · `GUEST_ARRIVAL_GUIDE` | the programme card's wording (and the two one-line "who arrives when" tiles under the timeline): *You don't need to be there at 4:00 PM*, the note for the entourage & wedding team (3:30 — straight to the majlis, the coordinators brief you there), the note for every other guest (5:30 at the majlis, reception at 6:30), and where a guest should go if they arrive at another hour (before 4:00 → the majlis, everyone walks in together; 4:00–5:30 → the majlis, the ceremony is behind closed doors). A stop's `programmeNote` is the warm line under it on that card. |

Edit the words there and the next deploy carries them to the site and to every card a guest saves
afterwards. The FAQ's *Can I watch the ceremony?* answer repeats the same two facts; on a project
seeded before this wording, press **Content → FAQ → Refresh wording** once to update it.

### The programme card
A second downloadable PNG, a sister to the invitation keepsake, offered under the **Program**
section (**Download the programme card**) and again beside the keepsake after a guest replies
*yes*. It is drawn in the guest's own browser (`lib/program-card.ts`, no server, no upload) and is
about the *day* rather than the guest, so it leads with the thing guests keep getting wrong:

1. **one panel to read first** — *You don't need to be there at 4:00 PM*, the ceremony in a few warm
   sentences (the hall is being prepared until 4:00, so everyone gathers at the majlis first and
   walks in together), and under a hairline the two notes side by side in large type: **Entourage &
   wedding team: 3:30 PM**, head to the majlis — the coordinators meet & brief you there, snacks &
   refreshments served · **All other guests: 5:30 PM**, head to the majlis for the welcome toast,
   snacks & photos, then the reception at 6:30 (wishing to witness the ceremony? come to the majlis
   before 4:00 instead);
2. the **small plan of the venue** (`lib/venue-map.ts`: the hall with its reserved rows and doors,
   the majlis just outside, the courtyard, the entrance and the path in — numbered to match the
   one-line legend under it, with the hall's *closed 2:00–4:00 PM* band and the dashed walk-in
   arrow from majlis to doors, *just before 4:00 PM · all together*) and, **beside it, the
   wayfinding notes**: where to go if you arrive at another hour (before 4:00 → the majlis;
   4:00–5:30 → the majlis, the ceremony is behind closed doors — we will come and find you) and
   where the cars go (parking → a separate area, not the courtyard; The Heaven's team tell you
   where at the gate);
3. the order of the day — each fact as a short tag beside its stop (*doors close at 4:00 PM*,
   *everyone welcome*) and the couple's own line under the two hours that hold the evening
   (`programmeNote`: *the hour we get to hug you*; *dinner, our film on the big screen, games and
   giveaways — then we dance*) — the dress code in one line and the sign-off.

The card is a **9:16 portrait — 1500 × 2667, a phone screen, a story** — so it is seen whole and
never scrolled. Every fact is said once and the card uses its width wherever two things belong side
by side, so everything fits that frame in type that reads without zooming (the first version
stacked six sections, repeated the hours in each, and ran to 1200 × 4000+). Whatever room is left
over inside the frame is shared out between the sections as air, so the frame is always full and
never crowded; should the wording ever outgrow it (a two-line dress code, say), the card grows
taller rather than cut a line — the type is never set smaller.

The plan in `lib/venue-map.ts` is a schematic drawn in a logical 640 × 440 space, with the two
arrival notes written onto it (*Closed 2:00–4:00 PM · being prepared* on the hall, *Everyone
gathers at the majlis first · entourage 3:30 PM · guests 5:30 PM* on the majlis) and the parking
note at the entrance. **Parking is deliberately not on the plan**: the open yard beside the path is
just the courtyard, and the cars go to a separate area that The Heaven's team point each guest to
when they arrive at the gate — so the map, the parking note beside it and the FAQ's *Is there
parking?* all say exactly that (`PARKING_NOTE`). Redraw the shapes there from the couple's own
sketch of The Heaven and every card follows.
Like the venue itself, the card is only offered on an unsealed invitation — never on `/preview`.

### The FAQ card
A third downloadable PNG, offered at the foot of the **Questions** section (`lib/faq-card.ts` —
**Download the FAQ card**). Same paper, same inks, same 9:16 frame, and one plain idea: the whole
little rulebook of the day, kept on a phone instead of scrolled. It prints **the exact questions
and answers the section shows** (binder → Content → FAQ is the one source — edit a question there
and the next guest's card carries it), with the *Where do I go when I arrive?* answer set first in
a "read this first" panel, a dotted hairline between pairs, and the couple's sign-off at the foot.
Like the programme card it grows taller rather than cut a line, and it is only offered on an
unsealed invitation.

## Bridesmaid cards (`Bridesmaid Cards`)
One A4 thank-you card for each of the girls — *thank you for saying yes* — in the keepsake's paper
and inks, with **her jewel cut in her colour** at the top. The binder tab holds a card per
bridesmaid; the page for each is a form on the left and the real card, drawn live, on the right,
with **Download A4 PNG** (2480 × 3508, 300 dpi — exactly A4, ready for a print shop or a phone)
and **Download all** on the tab's header.

The idea behind the cards is Proverbs 31:10 — *she is far more precious than jewels*. Each
bridesmaid is given a jewel because that is how the bride sees her: rare, bright and lasting. But the
jewel is only a picture; the card says she is worth far more than it. So **no jewel is given powers,
luck or protection anywhere** — a jewel's line speaks of its colour (*Deep, warm red — the colour of
commitment and of a heart that keeps its word*), and the card prints the verse itself right under it.

**Jewels** are the bridesmaids' palette from the Dress Code, and who wears what is settled there:
**Garnet** for the Maid of Honor, the Matron of Honor and the bride's sister-in-law; **Turquoise,
Citrine, Sapphire and Ruby** for the four bridesmaids (Amethyst was retired in Ruby's favour; the
greens, browns and greys are the groom's side's and the guests' — so none of those are offered here,
and a jewel of your own is just a word and a swatch). Picking a jewel sets her colour and cut, the
script greeting (*Thank you, my Garnet* — the jewel's name picked out in its colour) and the line on
what its colour says of her.

**Roles** are picked separately, because three women share Garnet and each needs her own job:
*Keeper of the Vows & Calm in the Storm*, *Peacekeeper & Family Anchor*, *Glow-Up & Scent
Specialist*, *Hydration, Fuel & Bathroom Captain*, *Fashion Surgeon & Wardrobe Medic*, *Content
Creator Girl*, *Hype Girl & Energy Officer*, and six more (timekeeper, documents, messenger,
bodyguard, keeper of hearts, morning light & first coffee). Each role prints a title in capitals, a
motto, *Your mission*, *The duties* as bullets and a *Pro tip*. Five of the roles were written with a
jewel in mind (Sapphire's is the keeper of the vows, Garnet's the wardrobe medic…), which is what a
new card starts with — but any role fits any jewel: the mission always opens with *why I chose this
jewel for you* (*Garnet is the deepest, warmest red — I chose it for you because you are commitment
itself…*) and goes on with the role's own sentence.

**Every line is editable** — the capitals at the top (*For my maid of honor*, *For my bridesmaid*…),
the greeting, the subline, the jewel's line, **the verse** (the words before the dash print in italic,
the reference after it in small capitals; empty prints none), the whole note (new line = new
paragraph), the role's heading, title, motto, mission, duties and tip, the sign-off and the footer —
and the gem's colour and cut are pickers. *Rewrite from Garnet & the role* puts the presets' lines
back if you want to start over; the verse, the note and the sign-off are never touched by it.

`Add the N from the entourage` creates a card for every Maid of Honor, Matron of Honor and bridesmaid
named under Content → Entourage who doesn't have one yet: the honour roles in Garnet (with the matching
capitals at the top), a bridesmaid whose title says *sister-in-law* in Garnet too, everyone else down the
bridesmaid jewels in order — and no two new cards start with the same role. Long words don't fall off
the page: the card is measured first and its type steps down a little (never below 78 %) when a note
runs long, and the preview says so; whatever room is left is shared out between the sections.

The cards live in their own private table (`bridesmaid_cards` — the public site never reads it). A
project already on Supabase runs `supabase/schema.sql` once more to add it (and, if the table is older
than the verse, the `verse` column — the script adds it to an existing table too); locally nothing is
needed.
Jewels & roles: `lib/jewels.ts` · drawing: `lib/bridesmaid-card.ts` · tab: `components/admin/bridesmaids.tsx`.

## Invite codes: generate, send, track (`Invite Codes`)
One row per household, one code per row, one reply per code — and a ledger that tells you where
every single invitation stands.

1. `/admin` → **Invite Codes** → **✦ Generate codes**.
   * **Paste your list**, one household per line — `Ana & Ivan, 973 1234 5678, 2 pax`, `Faisal`,
     `Nadia +2, 973 7777 1234, cousins`. Numbers that look like phone numbers become numbers, a
     `+2` / `2 pax` / `(3 seats)` becomes the seat cap, and anything left over becomes your note.
     Each name lands in **Who it's for**; households already on the list are skipped, so re-pasting
     is safe.
   * or **add N blank codes** (seats 1 to 4) for a card table, and write who each one is for later.
   * Tick *copy every new link afterwards* and your clipboard holds one line per household:
     `name — JS-7KQF — https://your-site/JS-7KQF`. Paste into a chat, done.
2. Per row: **Who it's for** (the name the WhatsApp letter greets — `Ana & Ivan`), **Their name**
   (left blank on purpose: it is the field the guest's reply card pre-fills, so it is theirs to type,
   and it fills itself in when they answer), then **copy link**, **copy message** (the WhatsApp text,
   ready), **send ↗** (opens WhatsApp to that number), **mark sent** (or undo), **new code** (retires
   the old link), **issue code** for a row that never had one, and **✕** to remove the household.
3. Every link you copy or send is marked `sent`; the first time the guest opens it the server stamps
   `opened`; when they answer, the row becomes `confirmed`, `needs review` (more than one seat, which
   you approve with one click) or `declined`. Filter by any of those words, search a name or a code, and read the
   counts at the top. **Copy this view** / **Mark all sent** work on whatever the filter left showing,
   and **Export CSV** carries who it's for, name, code, link, status, sent/opened/replied timestamps,
   seats, plus-one and message.
4. The guest's reply is written **onto that same row**, so nobody is ever duplicated — and the row
   appears on **Guests & RSVP** (the list of people who actually answered, plus anyone you added by
   hand). Guests who already replied see a sealed "welcome" card instead of the form, and the same
   code can't reply twice. If your list still shows doubled rows from an older build, the
   **Merge N duplicates** button at the top of Guests & RSVP folds each household back into one row.

**Seats on the reply card.** The card offers **1 to 4 seats**, never more than the row's **Seats**
value: a household invited with five seats can answer for four of them online, and the couple settles
any further guest in person. Picking 2, 3 or 4 opens one name field per extra guest, so a party of
three stores `Ana` plus `Ben, Carla` in the row's plus-one line — and the whole party waits in
**needs review** for the couple's confirmation. The binder splits those names into their own rows on
**Guests & RSVP** (and paints a small `card offers 4` note beside any row invited with more seats
than the card can take).

`greet` and `note` are required for the **Who it's for** and notes fields to persist. On a project
created before those columns were added, re-run `supabase/schema.sql` in Supabase → SQL Editor (it is
idempotent). The Binder now shows a clear migration error instead of claiming those edits were saved.
The activity timestamps `sent_at` and `viewed_at` remain optional and can be omitted on older projects.

### The WhatsApp message
**copy message** and **send ↗** send the same letter — the couple's own wording, with the name,
seat count, wedding date, reply-by date and personal invitation link filled in for each household:

```
*Shaira & Jeger · 11.11.2026*

Hi Ana & Ivan! 🥰

We’re getting married! 💍
Wednesday, 11 November 2026.

You’ve been part of our lives in your own special way, and we’d be so happy to celebrate this day with you.

*Here’s an invitation made especially for you:*
https://your-site/JS-7KQF

We’ve saved 2 seats just for you.

Everything you need is on the website—our story, the programme, dress code and venue. You can RSVP there too.

Please let us know by 25 October.

We can’t wait to celebrate with you! ❤️

With love,
Shaira & Jeger
```

* **The greeting** comes from **Who it's for** (falling back to the row's name). A blank or placeholder
  label becomes `Hi there!`, so `Household 7` never reaches a guest.
* **The saved seat count** uses the row's **Seats** and handles singular/plural automatically: `1 seat`
  or `2 seats`. A row with no seats leaves the sentence out.
* **The date and the reply-by date** come from **Details** and **Settings → Website & sharing**;
  empty the reply-by date and that line leaves the message. The invitation URL is the guest's own
  code link, and stays as a plain URL so WhatsApp makes it tappable.
* **Emoji on Mac** — the message is UTF-8 encoded when the **send ↗** link hands it to WhatsApp.
  If the WhatsApp app still replaces an emoji with `?`, use **copy message** and paste it directly
  into WhatsApp; that bypasses the link handoff. Updating WhatsApp/macOS can also help with newer emoji.
* **Proof before you send** — the **✦ Generate codes** panel prints one real household's letter
  under *The message they receive*, and **Settings → The WhatsApp invitation** keeps the wording in
  view with a note on where to change it.
* **Changing the wording** — the template is one function: `lib/guests.ts` → `inviteMessage`, under
  the `── THIS IS THE MESSAGE TEMPLATE ──` heading. Edit those lines and the next deploy carries the
  new wording to every household.

### Ready-made templates (Templates tab)
The RSVP chase, written once in the code so nobody starts from a blank box
(`PRESET_TEMPLATES` in `lib/messaging.ts`). The **Templates** tab lists them under
**Ready-made templates ✦** with a preview and a one-click **Add to my templates** — the added copy
is an ordinary template, free to reword or delete; nothing is pushed behind your back:

| Template | For | Tone |
|---|---|---|
| **RSVP · Gentle Reminder** | Pending RSVP | warm, no pressure — "one quiet minute, please fill in the short form" |
| **RSVP · Final Check-in (No Reply = Not Coming)** | Pending RSVP | short and personal — "we noticed yours hasn't come in yet", warm and understanding, but clear: *no RSVP by the deadline is lovingly taken as a "no" and the seats are released* |
| **RSVP · Thank You for Your Yes** | Confirmed (Yes) | thanks + the one arrival fact (majlis first, everyone walks in together) |
| **RSVP · Thank You, Wedding Team (3:30 PM Call Time)** | entourage / wedding-team groups (pick when sending) | thanks for saying yes — *3:30 PM* call time at the majlis, doors close *4:00 PM* so arrive earlier, late arrivals watch the livestream at the majlis with refreshments; adults-only closed-door ceremony note (children in the ceremony excepted — otherwise the majlis livestream, and little ones welcomed at the reception); toast & photos after, everyone into the hall at *7:00 PM* |
| **RSVP · Thank You for Your Yes (5:30 PM Majlis · 7 PM Hall)** | Confirmed (Yes) | thanks + the full guest flow: *5:30 PM* majlis welcome toasts & snacks, ceremony on the livestream, children welcome from the reception, couple joins the majlis afterwards, all guests enter the hall together at *7:00 PM* |
| **RSVP · Thank You for Letting Us Know** | Declined (No) | all love, zero guilt, "coffee soon" |
| **RSVP · Confirmed Personally? Please Add Your Details** | households who said yes in person/by chat (pick when sending) | grateful, seats saved — but please fill in the details personally through `{rsvp_link}` so names and seating are exactly right; if the link won't open, they can reply instead with their full name, the full names of everyone coming with them and their mobile number (needed for the seating tables, programme and final announcements) |
| **RSVP · Missed the Deadline? Join via Livestream** | late / missed-RSVP households (pick when sending) | warm and understanding — the list is locked so no reception seat, but they are welcome at the majlis livestream with refreshments, "coffee soon" |
| **RSVP · With Love — the Guest List Is Finalised** | Pending RSVP | loving but firm closure for non-responders — final numbers are due, the deadline has passed and the guest list is finalised; no hard feelings |
| **Broadcast · 2 Weeks To Go (Attire · IG · Gifts)** | Confirmed (Yes) | the first countdown broadcast — `{instagram}`, the dress code on the invitation site, the Note on Gifts and `{invitation_link}` |
| **Broadcast · 1 Week To Go (Map · Arrival Times)** | Confirmed (Yes) | the Google Maps pin (`{venue_map_link}`), the 3:30 PM wedding-team call time, the 5:30 PM majlis arrival and 7:00 PM hall entry |
| **Broadcast · Tomorrow! (Tag Us)** | Confirmed (Yes) | the-eve hype — tag `{instagram}` and `{hashtag}` in every story and clip |
| **Broadcast · The Morning After (Share Your Photos)** | Confirmed (Yes) | thank-you + the `{upload_link}` (`/upload`) so guests send up to 25 photos and videos straight to the private album |
| **Day-of Role · We'd Love to Entrust You** | any role group | asks a household to serve in `{role}` — pair it with the Guest Roles tab |

Each arrives with its recipient groups pre-ticked (Compose fills the rest in one click), and the
merge tags — `{first_name}`, `{seats}` ("2 seats" / "1 seat" / "a seat"), `{rsvp_deadline}`,
`{rsvp_link}`, `{invitation_link}`, `{wedding_date}`, `{couple_names}`, `{role}`, `{instagram}`,
`{venue_map_link}`, `{upload_link}`… — fill themselves in per household, exactly like the tracker's
logs expect. The chase messages use `{rsvp_link}`: the
guest's own page, landed **straight on the reply card** (`…/JS-7KQF#rsvp` — the site's own deep
link, the same handoff the `/rsvp` door uses), while the thank-you keeps the plain invitation link
so a confirmed guest lands on the whole letter.

## Guest Roles (the day-of jobs)
One role per household — the coffee & tea station, the souvenir table, the ushers, the parking
point person — assigned in the binder's **Guest Roles** tab (`components/admin/roles.tsx`). A role
is stored on the guest row itself (`guests.role`), as a preset id from the shared dictionary
`lib/roles.ts` (fourteen suggested roles, each with a one-line brief) **or the couple's own words**
— which then *are* the id, the same trick the guest tags use, so nothing needs a table of its own.
A short `role_note` carries the "how" ("bring the thermos", "handles the espresso machine").

* **By household** — search a name, code or role; pick from the suggested list or type your own.
* **By role** — the teams, each with **Copy list** and **📨 Message this team**, which jumps into
  Compose with that role pre-ticked as the recipient group (the *Day-of Role* ready-made template
  fills the `{role}` in). Roles resolve in the messaging module exactly like tags, including ones
  you invented.
* **Copy roster** pastes the whole assignment into Excel/Sheets; **Export CSV** keeps it in the
  binder's paper trail.

On a live Supabase project run `supabase/schema.sql` once more (it adds `guests.role` and
`guests.role_note`); until then a save shows the same clear migration message the greet/note
columns taught the binder to give, instead of silently dropping the edit.

## The Checklist (the couple's sheet, plus the fine detail)
The binder's Checklist now carries the whole sheet, not just the words: each row has a
**section** (the sheet's Category — *Venue & Catering*, *Programs & Speeches*…), an
**owner** (Person In-charge) and **details** (Details / Notes), all editable inline, with a
**Section filter** and **Export CSV** beside the priority/date filters. The columns are optional —
`supabase/schema.sql` adds `checklist.section/owner/details`; an older project saves without them
and is told the one line of SQL to catch up.

The starter data (`lib/seed.ts`) holds it in two untouched halves:

* **c1…c24** — the original starter list, never reworded: a live project already holds those rows
  (ticked, edited, re-dated) and *push starter data* only fills in rows whose id is missing.
* **k1…k116** — the couple's updated sheet transcribed row by row (their four pre-done rows come
  across already ticked), **plus** the finer-grained tasks a review of that sheet grew: vendor
  entry at 4:00 PM with the hall closed 2–4, the majlis briefing refreshments, the walk-in
  marshals, speech time limits, the do-not-play list, cake delivery & placement, cash envelopes
  with a designated payer, the coordinator master document, a pocket timeline for the couple, and
  so on. Press **Settings → Push starter data** once and every missing k-row appears — a handful
  overlap the old c-rows (rings, vows, rehearsal, emergency kit, headcount, street food); keep
  whichever copy you like and delete the other.

### The guest's side
* Their link is `https://your-site/JS-7KQF`. The older `https://your-site/?rsvp=JS-7KQF` you may
  already have sent still works — it lands on the same page.
* No link handy? `https://your-site/rsvp` asks for a code and the **last four characters are enough**
  (`7KQF`), in any case, spaces and all trimmed. A tail that could belong to two households is refused
  rather than guessed, and one code answers for exactly one household.
* Nothing about the venue, the programme or the FAQ is reachable without a code, and a wrong code
  unlocks nothing.

## Anonymous audio guestbook
The 11.11.2026 dedication opens the letter scroll with the couple’s names, the 1 Corinthians 11:11 verse and the line “A wish made at 11:11 — a prayer answered by God.” Further down, invited guests can leave a short wish, greeting or prayer in the vintage-phone guestbook. Playback and delete/re-record are available before sending; the live timer stops at the **20-second maximum**. The browser asks for microphone permission only when a guest taps the phone. The `/test` demo lets you try the microphone and player, but intentionally never saves demo audio.

Each upload must include an issued invitation code; the server checks it with the same invite gate used by the private site, then discards it. Guests aren't asked for names, and the guestbook stores no name, invite code, transcript or IP address. Clips are uploaded as audio objects to the **private `guestbook-audio` Supabase Storage bucket**; Supabase holds only a random object path, MIME type, file size, duration and timestamp. The couple can listen and delete notes under **The Binder → Audio Guestbook**, which also totals the guestbook's stored audio. Playback uses short-lived signed links returned only to the authenticated binder.

Run the latest `supabase/schema.sql` in the Supabase SQL Editor to create the metadata table and private bucket. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side and configured: there are no public Storage or table policies, and guests only upload through the invitation-validated `/api/guestbook` endpoint. Microphone recording requires HTTPS and browser permission; the browser usually asks on the first tap. If permission was previously denied, the guest must allow it in site settings and reload—websites cannot switch the microphone on themselves. The 512 KB per-clip cap is generous for a 20-second compressed voice note and helps keep storage and egress low.

**Storage recommendation:** Supabase Storage is the best fit here because the site already integrates with Supabase, and private files plus signed playback links avoid public audio URLs. A direct Google Drive integration would still need server-side OAuth/API credentials and carefully managed file permissions. For future guest photos, resize/compress in the browser (WebP or JPEG, with a reasonable maximum dimension) and store the image object in Storage, keeping only its object path and photo metadata in Supabase—not a base64 image blob in a database row.

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

## Social Studio (`Social Studio` tab)
The binder's social desk for the final countdown — every download is drawn on canvas in the
wedding's paper/wine/Cormorant/Pinyon aesthetic and saved straight to the couple's phone. Two
formats: **1080 × 1920 stories (9:16)**, **1080 × 1350 feed posts (4:5 portrait — the tallest
size the Instagram grid accepts)** and **1080 × 1080 highlight covers (1:1, circle-cropped)**. Big
topics are *story series* — one template renders several numbered pages, posted in order. The
library (`lib/social-studio.ts`, registry `SOCIAL_TEMPLATES`) reads the live binder data so an
edit to the programme, attire palette or FAQ changes the next download:

| Category | Templates |
|---|---|
| **Announcements** | Save the Date story · auto-calculated countdown story |
| **Programme** | 3-story series (cover · full timeline from `lib/program.ts` · who arrives when) |
| **Attire** | 2–3-story series (dress-note cover · guest palette swatches · reserved family shades) |
| **FAQ** | cover + one story per FAQ row (first eight), text auto-shrinks to fit each page |
| **Instructions** | 2-story series (arrival rules, livestream & adults-only note · tag + upload-QR page) |
| **Reminders** | doors-close 4 PM · 5:30 majlis · tomorrow · tag us · adults-only · upload-QR |
| **Feed posts (4:5, 1080 × 1350)** | save the date · programme · palette · dashed-window photo frame · wine announcement |
| **Highlight covers** | set of eight circle-safe squares (Programme, Dress Code, Venue, Questions, RSVP, Entourage, Gifts, Moments) |

Below the registry sit the original **Add Yours** cards, the **transparent frame builder** and
the upload QR — the three ready-made **1080 × 1920** story cards on canvas, nothing sent anywhere:

| Story | What it is |
|---|---|
| **Wedding Bingo · 6-grid** | two-by-three bingo tiles (My Fit Check, POV From My Seat, The Couple, Cocktail Bites, Tearjerker Moment, After-Party) with tick circles — guests screenshot, tick their moments and repost with Instagram's Add Yours sticker |
| **What I Wore · arch frame** | a tall arch with empty paper inside for a guest's outfit photo |
| **Add Yours · prompt** | the "drop your favourite clip…" text card with a mock Add Yours sticker and the hashtag |

Names, date, handle and hashtags seed themselves from **Details**; every word (including the six
bingo tiles and the prompt) is editable in the tab, and **Reset** restores the suggested wording.

The same tab's **transparent story frames** export a 1080 × 1920 PNG with *no background* — only
the chosen elements (J&S monogram seal, couple names in Pinyon script, the Victorian flourish,
the date, the handle and the hashtags) in wine, paper-white or ink — so it can be overlaid on any
photo inside Instagram's own story editor. Placement presets are top ribbon, bottom ribbon,
centred or a compact corner mark (left/right), every element toggles independently, and the
preview has a checkerboard/dark/light backdrop to check contrast before downloading.

The tab also renders the **guest-upload QR code** (`https://your-site/upload`) as a downloadable
1024 px PNG — for the twelve double-sided table cards and the two A4 welcome/photo-area signs.

## Guest moments & private media (`/upload`)
The public Memory Wall is a social-style wedding feed: guests can post a note, photos, videos, or
both; add optional text over media; and use the phone camera from the page. Media also appears in a
Stories rail grouped by poster. Guests can uncheck **Also show this in the Newsfeed** to publish
photos/videos as Stories only. Feed thumbnails open a full-size viewer; each poster can edit their
caption/overlay or delete their own posts from the device they used to publish. The page loads 12
feed posts at a time, checks for new feed posts once a minute, and lets guests refresh manually.
The binder's Social Studio gallery can browse and remove every post.

Media bytes stay in the **private** `wedding-media` Supabase Storage bucket. Guests upload directly
with the anon key, which has insert-only Storage permission. `/api/moments` reads post metadata
server-side and issues short-lived signed media URLs; guests cannot list or browse raw bucket
objects. The server checks the posting device ID before allowing a guest to edit or delete a post;
the couple's service-role key remains server-side for the binder gallery.

* **Limits:** up to 8 media items in a post, 25 files and 1 GB per device, enforced in
  `lib/media-upload.ts`; the bucket's own `file_size_limit` (1 GB) backs up the per-file limit.
* **Accepted media:** photos and video including iPhone HEIC/HEIF and `.mov`.
* **One-time setup:** run the `wedding-media` and `wedding_moments` sections of
  `supabase/schema.sql`. Re-run the moments section on existing projects to add the `show_in_feed`
  migration (existing posts stay in the Newsfeed). In Vercel set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser uploads, plus `SUPABASE_SERVICE_ROLE_KEY` as a
  server-only secret for signed media URLs and moderation. Never prefix the service-role key with
  `NEXT_PUBLIC_`. Redeploy after changing environment variables.
* Files land under `YYYY-MM-DD/<guest-id>/<uuid>.<ext>`, so one phone's uploads stay grouped.

## Gift registry (`Gift List` tab → public `/gifts`)
A live, invite-code-free wish list every guest can use from the homepage tile. The couple builds
the list in the binder (**Gift List** tab): add and word items, reorder, delete, and release a
claim made by mistake. Guests tap **"I've bought this"** (optionally with their name) and the item
crosses off everywhere: the page re-reads the server every 8 seconds and on every tab focus, so
two guests looking at the same list see it update within seconds. The server settles races with a
conditional `WHERE claimed = false` update — the second guest gets a friendly "just bought by…"
message instead of a double purchase. A guest can only release a claim made on the same device;
the binder can release any of them. Each gift can carry an **uploaded picture (or a hosted image
link)** shown as a visual guide on the guest page; sets and bundles (the complete cookware set,
the décor and linen bundles) are single registry items whose detail line spells out everything
included, so one claim covers the whole bundle. The live poll is a lightweight `?light=1` call
that returns claim state only — pictures and notes are fetched with the full board, not every few
seconds. Above the list sits an editable, **public** note (default:
any gift would be a wonderful help and is deeply appreciated as the couple begin their new life
together). When the couple has
filled the BenefitPay number and/or IBAN in **Details → Note on Gifts**, `/gifts` also renders them
as **tap-to-copy transfer rows** (with a "check the JSGotMarried account name" prompt): the generic
data API still redacts those fields for sealed visitors, but the public `/api/gifts` endpoint
deliberately serves them, since the couple chooses to print them on the registry. Blank fields hide
the transfer card and the page instead points guests to their personal invitation link. Data lives
in the `gift_items` table; `wedding_info.registry_note` holds the note — both added by the latest
`supabase/schema.sql` (starter rows are included, and "push starter data" fills them on an existing
project).

## Note on Gifts (BenefitPay)
**Details → Note on Gifts** feeds a public section on the invitation site (after the FAQ, unlocked
guests only): a warm note, a BenefitPay mobile number and an optional IBAN, each row tap-to-copy.
The whole section stays hidden until at least one field is filled — leave all three blank and no
gift card is rendered anywhere. The columns (`gift_note`, `benefitpay_number`, `benefitpay_iban`)
are added by the latest `supabase/schema.sql`.

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
app/upload/page.tsx          the public guest photo/video upload page (private Storage bucket)
app/gifts/page.tsx           the public live gift registry — mark gifts bought, see them cross off live
app/[code]/page.tsx          a household's own unsealed invitation
app/admin/…                  binder + login
app/api/…                    login, data CRUD, rsvp, the calendar .ics, gift claims (/api/gifts)
components/admin/gifts.tsx   the binder's Gift List tab — registry CRUD, reorder, release claims, note
lib/gifts.ts                 gift-registry client logic — board loading, race-safe claim/release, local mode
lib/media-upload.ts          the /upload limits, per-guest quota and XHR upload with progress
lib/guests.ts                codes: matching, statuses, bulk paste, links
lib/invite-gate.ts           what a sealed visitor may read (server side)
components/public/…          sections + effects (Lenis, cursor, vines, magnetic, split text)
components/admin/…           binder tabs + UI kit
lib/program.ts               the order of the day — timeline, highlight cards, both cards' wording, in one place
lib/keepsake.ts              the guest's downloadable invitation card (canvas → PNG, in the browser)
lib/program-card.ts          the downloadable programme card — who arrives when, where to go, the map
lib/faq-card.ts              the downloadable FAQ card — every question & answer on one paper PNG
lib/venue-map.ts             the small plan of the venue printed on the programme card
lib/roles.ts                 the day-of roles dictionary (Guest Roles tab, messaging groups)
lib/messaging.ts             recipient groups, merge tags, ready-made templates (the RSVP chase + broadcasts)
lib/ig-stories.ts            the 1080×1920 Instagram Story canvas templates (bingo, outfit arch, Add Yours) + transparent overlay frames
lib/social-studio.ts         the Social Studio registry — 9:16 story series, 4:5 feed posts and 1:1 highlight covers from live binder data
lib/media-upload.ts          the /upload limits, per-guest quota and XHR upload with progress
lib/qr.ts                    branded QR code + data-URL download helper (the upload table signs)
lib/card-draw.ts             shared canvas lettering (paper, caps, wrap, pins) for the cards
lib/bridesmaid-card.ts       the bridesmaids' A4 thank-you card — her jewel, the verse, her note, her role (binder → Bridesmaid Cards)
lib/jewels.ts                the bridesmaids' jewels (colour, what it says of her) and the roles any of them can be given
lib/calendar.ts              the wedding event: .ics + Google Calendar + how the dates read
lib/seed.ts                  all starter data (budget, vendors, checklist, attire…)
lib/db.ts                    Supabase-via-API or localStorage data layer
supabase/schema.sql          database tables
```
