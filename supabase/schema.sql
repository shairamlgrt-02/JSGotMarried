-- JS Wedding OS — run this once in Supabase → SQL Editor.
-- All admin writes go through the Next.js API using the SERVICE ROLE key,
-- so Row Level Security stays ON with no public policies (nobody can read guests with the anon key).

create table if not exists wedding_info (
  id text primary key default 'main',
  date timestamptz not null,
  bride text, groom text,
  venue_name text, venue_address text, venue_map_link text, venue_map_embed text,
  theme_name text, story text, instagram text,
  hashtags text[] default '{}',
  total_budget numeric default 2500, currency text default 'BHD',
  save_the_date_url text default '', gallery text[] default '{}',
  cover_photo text default '', music_url text default ''
);
alter table wedding_info add column if not exists cover_photo text default '';
alter table wedding_info add column if not exists music_url text default '';
alter table wedding_info add column if not exists rsvp_deadline text default '2026-10-25';
-- Website & sharing (Settings → Website & sharing in the binder): the browser tab title, the
-- description shown on shared links, the link-preview banner and the tab icon.
alter table wedding_info add column if not exists site_title text default '';
alter table wedding_info add column if not exists site_description text default '';
alter table wedding_info add column if not exists share_image text default '';
alter table wedding_info add column if not exists favicon text default '';
alter table wedding_info add column if not exists instagram_note text default '';
-- Note on Gifts (binder → Details): the public "Note on Gifts" card stays hidden until one of
-- these is filled, so an unfinished field never reaches the invitation site.
alter table wedding_info add column if not exists gift_note text default '';
alter table wedding_info add column if not exists benefitpay_number text default '';
alter table wedding_info add column if not exists benefitpay_iban text default '';
create table if not exists schedule (id text primary key default gen_random_uuid()::text, time text, title text, detail text, "order" int default 0);
create table if not exists budget (id text primary key default gen_random_uuid()::text, category text, item text, quoted_cost numeric default 0, paid_cost numeric default 0, status text default 'pending');
create table if not exists guests (
  id text primary key default gen_random_uuid()::text, name text not null, phone text, pax int default 1,
  attending text default 'pending', dietary text, message text, song_request text, source text default 'manual',
  created_at timestamptz default now()
);
-- One row per household: `code` is the household's personal invite key. While the row is
-- waiting it is the invitation (approved IS NULL); when the guest replies through their link
-- the SAME row is overwritten with the reply (approved NOT NULL), so the guest list never
-- doubles up. approved = true → confirmed · false → waiting for the couple's review.
alter table guests add column if not exists code text default '';
alter table guests add column if not exists approved boolean default null;
alter table guests add column if not exists plus_one text default '';
-- Independent category tags for each named plus-one, in the same order as `plus_one` names.
-- JSON string keeps the older household row shape while letting the binder edit individuals.
alter table guests add column if not exists plus_one_tags text not null default '[]';
-- The invite-code ledger (Invite codes tab): `sent_at` is when the link left the binder (you
-- copied or sent it), `viewed_at` is stamped by the server the first time a guest opens the
-- link, and `note` is your own reminder about the household. All three are optional — the app
-- drops them quietly and still saves the guest if a project hasn't re-run this file yet.
alter table guests add column if not exists note text default '';
alter table guests add column if not exists sent_at timestamptz;
alter table guests add column if not exists viewed_at timestamptz;
-- Who the link is for ("Ana & Ivan"): the WhatsApp invitation greets this and the guest's reply
-- card shows it above the form, while `name` stays blank until the guest types their own.
alter table guests add column if not exists greet text default '';
-- Guest tags: who a household belongs to, as a comma-separated list of tag ids ("bride_family,
-- bridesmaids"). Several at once is the point — a maid of honor who is also the bride's cousin is
-- both, and each tag on its own is a group you can filter by and message. Rows saved while the
-- binder still had a single-category picker are copied across on the first read (lib/content-fix.ts),
-- so this one line is all the SQL a live project needs.
alter table guests add column if not exists tags text default '';
-- Day-of role (binder → Guest Roles): the small job this household is entrusted with on the day —
-- a preset id from lib/roles.ts ("usher", "coffee_tea"…) or the couple's own words — plus a short
-- note on how they'll serve. One role per household; each role is also a recipient group in the
-- messaging module. Both columns optional: an older project gets a clear migration message
-- instead of a silently failed save.
alter table guests add column if not exists role text default '';
alter table guests add column if not exists role_note text default '';
-- one personal code per household: lookups by code (opening a link, the /rsvp gate) stay cheap
create index if not exists guests_code_idx on guests (upper(code));

create table if not exists vendors (id text primary key default gen_random_uuid()::text, type text, name text, quote numeric default 0, contact text, status text default 'pending', notes text);
create table if not exists checklist (id text primary key default gen_random_uuid()::text, task text, category text default 'medium', due_date date, completed boolean default false);
-- Checklist upgrades (the couple's own sheet, now in the binder): Category → section, Person
-- In-charge → owner, Details/Notes → details. Optional on every row — the binder drops them
-- quietly if a project hasn't re-run this file yet.
alter table checklist add column if not exists section text default '';
alter table checklist add column if not exists owner text default '';
alter table checklist add column if not exists details text default '';
create table if not exists attire (id text primary key default gen_random_uuid()::text, "group" text, label text, colors jsonb default '[]', reserved boolean default false, notes text, swatch_url text default '', "order" int default 0);
create table if not exists entourage (id text primary key default gen_random_uuid()::text, role text, name text, title text, "order" int default 0);
create table if not exists faq (id text primary key default gen_random_uuid()::text, question text, answer text, "order" int default 0);
-- Our Story, chapter by chapter (the swipeable carousel on the public site).
create table if not exists story (id text primary key default gen_random_uuid()::text, title text, text text, photo text default '', "order" int default 0);
-- Bridesmaid cards (binder → Bridesmaid Cards): one A4 thank-you card per bridesmaid, every line
-- of it editable. Private — the public site never reads this table.
create table if not exists bridesmaid_cards (
  id text primary key default gen_random_uuid()::text,
  name text default '', jewel text default '', color text default '', cut text default 'brilliant',
  kicker text default '', greeting text default '', subline text default '', embodies text default '', verse text default '',
  note text default '',
  role_kicker text default '', role_title text default '', tagline text default '', mission text default '',
  duties text default '', pro_tip text default '',
  closing text default '', footer text default '',
  "order" int default 0
);
-- the line of Scripture under the jewel ("She is far more precious than jewels" — Proverbs 31:10)
alter table bridesmaid_cards add column if not exists verse text default '';
-- Messaging module (binder → Compose / Templates / Tracker): reusable templates and the sent-message log.
create table if not exists message_templates (
  id text primary key default gen_random_uuid()::text,
  name text default '', label text default '', body text default '', categories text default '',
  created_at timestamptz default now()
);
create table if not exists messages (
  id text primary key default gen_random_uuid()::text,
  template_id text default '', template_name text default '',
  original_body text default '', body text default '',
  recipient_id text default '', recipient_name text default '', recipient_phone text default '',
  category text default '',
  sent boolean default false, responded boolean default false, link_opens int default 0,
  opened_at timestamptz,
  sent_at timestamptz, created_at timestamptz default now()
);
alter table messages add column if not exists opened_at timestamptz;

-- ── anonymous audio guestbook ─────────────────────────────────────────────────────────────────────
-- Audio itself lives in a private Storage bucket. This table contains no guest name, invite code,
-- transcript or IP address — only the random object path and the minimum playback metadata.
create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  content_type text not null check (content_type in ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg')),
  file_size_bytes int not null check (file_size_bytes between 1 and 524288),
  duration_ms int not null check (duration_ms between 500 and 20000),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_messages_created_at_idx on public.guestbook_messages (created_at desc);
alter table public.guestbook_messages enable row level security;
revoke all on public.guestbook_messages from anon, authenticated;
grant all on public.guestbook_messages to service_role;

-- Service-role API routes are the only way to read/write this private bucket. Do not add public
-- Storage policies: guests upload through /api/guestbook after their invitation code is validated.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guestbook-audio', 'guestbook-audio', false, 524288, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'])
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── anonymous guest photo & video uploads (/upload, QR codes on the table cards) ─────────────────
-- A PRIVATE bucket: guests add memories straight from their phone with the anon key, but no anon
-- policy lets them list, read or delete — only the service-role key (the binder) can view them.
-- The bucket's 1 GB file_size_limit is the server-side backstop; the 25-files / 1 GB per-guest
-- cap is enforced on the device (lib/media-upload.ts) and remembered in localStorage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-media',
  'wedding-media',
  false,
  1073741824,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'application/octet-stream'
  ]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anon may INSERT only, and only into this bucket. No SELECT/UPDATE/DELETE policy exists, so the
-- default-deny of RLS keeps every uploaded object invisible to other guests.
drop policy if exists "anon can insert wedding media" on storage.objects;
create policy "anon can insert wedding media"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'wedding-media');

-- ── attire palette (round 22): Garnet goes to the Maid of Honor, the Matron of Honor and the bride's
-- sister-in-law; the four bridesmaids wear Turquoise, Citrine, Sapphire and Ruby (Amethyst retired) ──
insert into attire (id, "group", label, colors, reserved, notes, swatch_url, "order") values
  ('a3', 'shai_family', 'Shai''s Family', '[{"name":"Copper","hex":"#8C3617"}]'::jsonb, true, '', '', 3),
  ('a4', 'jeg_family', 'Jeg''s Family', '[{"name":"Burgundy","hex":"#5C1223"}]'::jsonb, true, '', '', 4),
  ('a5', 'bridesmaids', 'Bridesmaids', '[{"name":"Garnet","hex":"#8E1226"},{"name":"Turquoise","hex":"#0F7E7A"},{"name":"Citrine","hex":"#BE8B0F"},{"name":"Sapphire","hex":"#0A2A6E"},{"name":"Ruby","hex":"#B01A63"}]'::jsonb, true, 'Garnet for the Maid of Honor, the Matron of Honor and the bride''s sister-in-law; the bridesmaids in Turquoise, Citrine, Sapphire and Ruby', '', 5),
  ('a7', 'groomsmen', 'Groomsmen', '[{"name":"Grey","hex":"#6E6E6E"},{"name":"Black","hex":"#101010"}]'::jsonb, true, 'Satin-lapel tux or suit', '', 6),
  ('a6', 'guests', 'Our Guests', '[{"name":"Emerald","hex":"#0A5C33","fabric":"Velvet"},{"name":"Laurel","hex":"#35562B","fabric":"Fine suit wool"},{"name":"Jade","hex":"#23825A","fabric":"Silk charmeuse"},{"name":"Scarab","hex":"#2C8C3C","fabric":"Shiny polyester · dry-fit"},{"name":"Olive","hex":"#5F6B24","fabric":"Duchesse satin"},{"name":"Peridot","hex":"#9AA62C","fabric":"Silk charmeuse"},{"name":"Coffee","hex":"#452A18","fabric":"Velvet"},{"name":"Smoky Topaz","hex":"#5E4630","fabric":"Fine suit wool"},{"name":"Bronze","hex":"#6F4F1D","fabric":"Duchesse satin"},{"name":"Toffee","hex":"#7C5230","fabric":"Silk charmeuse"},{"name":"Dark Honey","hex":"#8A5A0C","fabric":"Liquid satin · poly"},{"name":"Caramel","hex":"#9C6A28","fabric":"Velvet"}]'::jsonb, false, 'Black tie in glossy greens and warm shining browns — kindly avoid black, white, burgundy and copper. Shine welcome: satin, velvet, silk, fine suit or liquid poly — please skip tulle, chiffon and anything fully matte.', '', 7)
on conflict (id) do update set "group" = excluded."group", label = excluded.label, colors = excluded.colors,
  reserved = excluded.reserved, notes = excluded.notes, swatch_url = excluded.swatch_url, "order" = excluded."order";
-- the Maid of Honor no longer has her own card — she sits with the bridesmaids, in Garnet
delete from attire where id = 'a8' or "group" = 'moh';

alter table wedding_info enable row level security;
alter table schedule enable row level security;
alter table budget enable row level security;
alter table guests enable row level security;
alter table vendors enable row level security;
alter table checklist enable row level security;
alter table attire enable row level security;
alter table entourage enable row level security;
alter table faq enable row level security;
alter table story enable row level security;
alter table bridesmaid_cards enable row level security;
alter table message_templates enable row level security;
alter table messages enable row level security;

-- Explicit table grants (required for any new table created after Supabase's 2026-10-30 Data API
-- default-grants cutover): only the server's service_role key talks to these tables via PostgREST;
-- anon and authenticated never touch them directly.
revoke all on table
  public.wedding_info, public.schedule, public.budget, public.guests,
  public.vendors, public.checklist, public.attire, public.entourage,
  public.faq, public.story, public.bridesmaid_cards,
  public.message_templates, public.messages
from anon, authenticated;

grant all on table
  public.wedding_info, public.schedule, public.budget, public.guests,
  public.vendors, public.checklist, public.attire, public.entourage,
  public.faq, public.story, public.bridesmaid_cards,
  public.message_templates, public.messages
to service_role;

-- ── one-off rename: the second wedding hashtag is now #JSSayIDo (was #JSWeDo) ──────────────────
-- A project seeded before the rename still carries the old tag in its rows, and the site reads the
-- stored row rather than the starter data — so the old tag would linger on the live site. The app
-- repairs this on load as well (lib/content-fix.ts); running this here fixes it straight away.
-- Idempotent: safe to re-run, and it touches nothing else.
-- (JSWeDo → JSSayIDo matches with or without the leading #, and is safe to run twice.)
update wedding_info set
  hashtags         = array_replace(hashtags, '#JSWeDo', '#JSSayIDo'),
  site_description = replace(site_description, 'JSWeDo', 'JSSayIDo'),
  instagram_note   = replace(instagram_note,   'JSWeDo', 'JSSayIDo')
where hashtags @> array['#JSWeDo']
   or site_description like '%JSWeDo%'
   or instagram_note   like '%JSWeDo%';
update faq set
  question = replace(question, 'JSWeDo', 'JSSayIDo'),
  answer   = replace(answer,   'JSWeDo', 'JSSayIDo')
where question like '%JSWeDo%' or answer like '%JSWeDo%';

-- Seed data is loaded from the admin: Settings → "Push starter data to Supabase" (safe to press any
-- time: guests are skipped, the attire palette is refreshed from the code, everything else only
-- fills in rows that are missing — nothing the couple wrote or uploaded is overwritten).

-- ── gift registry: the live wish list on /gifts (Hub tile "Gift list") ────────────────────────
-- Guests mark items they have bought without an invitation code; every other guest's page then
-- crosses them off (the app re-reads this table every few seconds). Like the other binder tables,
-- anon/authenticated hold NO grants: the public reads & claims through /api/gifts with the
-- service-role key, where claim races are settled by a conditional update.
create table if not exists public.gift_items (
  id text primary key default gen_random_uuid()::text,
  title text not null default '',
  note text not null default '',
  image_url text not null default '',
  claimed boolean not null default false,
  claimed_by text not null default '',
  claimed_at timestamptz,
  "order" int not null default 0
);
-- Added after the first registry shipped; safe on databases that already have the table.
alter table public.gift_items add column if not exists image_url text not null default '';
alter table public.gift_items enable row level security;
revoke all on public.gift_items from anon, authenticated;
grant all on public.gift_items to service_role;

-- The public, invite-code-free wording above the list: that a monetary gift is most appreciated.
-- This column must never carry account details — BenefitPay/IBAN stay in the sealed gift_note
-- fields, visible only inside a personal invitation link (see lib/invite-gate.ts).
alter table public.wedding_info add column if not exists registry_note text not null default '';

-- Refresh only the original starter descriptions that are still untouched. This preserves any
-- wording the couple has already customized, while making this update safe to run repeatedly.
update public.gift_items as g
set note = revised.new_note
from (values
  ('g1', 'For slow mornings together at home — a compact machine with a milk frother would be lovely.', 'For slow mornings and little moments together in our first home. Thank you for helping make them special.'),
  ('g2', 'The baking dream — for cakes, fresh bread and birthday treats in our new kitchen.', 'For baking sweet things together and sharing them with the people we love.'),
  ('g3', 'A countertop blender for morning smoothies, soups and sauces.', 'For all the little kitchen moments we will share in our first home. Thank you for thinking of us.'),
  ('g4', 'With its chopping blade and slicing discs, to make everyday prep a little easier.', 'For the meals and memories we will make together. We are so grateful for your kindness.'),
  ('g5', 'For all the meals we hope to cook together — a matching set of pots and pans with their lids for our first kitchen. We would be so touched to receive it as a complete set.', 'For the meals we will share in our first home. We are so grateful for your kindness.'),
  ('g6', 'A standing hot-and-cold water dispenser for the dining area.', 'A thoughtful addition to our home and a little comfort to share each day. Thank you!'),
  ('g7', 'Twelve settings for hosting our favourite people — dinner plates, side plates and bowls.', 'For gathering around the table with the people we love. Thank you for being part of our new beginning.'),
  ('g8', 'Crisp cotton bedding made for a king-size bed: a fitted sheet, flat sheet, pillowcases and a duvet cover.', 'For cozy nights and restful mornings in our new home. Thank you for your kindness.'),
  ('g9', 'A large rug to anchor the living room — warm, neutral tones to suit a vintage-lace home.', 'To make our home feel warm and welcoming. We are grateful for your love and support.'),
  ('g10', 'A soundbar or connected home speaker to pair with the television, for film nights and living-room dancing.', 'For movie nights, music and laughter in our home. Thank you for celebrating with us.'),
  ('g11', 'A little smart speaker for music, timers and dancing in the kitchen.', 'For music, laughter and lovely moments in our first home. Thank you for thinking of us.'),
  ('g12', 'Towards the little touches that make a house a home — decorative vases, table lamps and ornaments. Any single piece from this bundle is welcome.', 'For the little touches that make a house feel like home. Thank you for helping us begin.'),
  ('g13', 'Soft furnishings for the home — bath and table linens, cushions and a throw or two.', 'For making our home a little softer and cozier. We are so grateful for your love.'),
  ('g14', 'A peaceful hotel stay for the two of us after the big day — our first little escape as a married couple.', 'A little time away together after the celebrations. Thank you for making it extra special.'),
  ('g15', 'A reserved table for two at one of our favourite places — dinner, on you.', 'A lovely meal for two as we celebrate this new chapter. We are so grateful.'),
  ('g16', 'For anyone feeling especially generous — a gift towards our honeymoon, the first big adventure of our married life. It would mean the absolute world to us.', 'A gift toward our first adventure as a married couple. Your kindness means so much to us.')
) as revised(id, old_note, new_note)
where g.id = revised.id and g.note = revised.old_note;

-- Starter wishes — "push starter data" also fills these if the table is created empty; the
-- conflict guard means re-running the schema never resurrects an item the couple deleted.
insert into public.gift_items (id, title, note, image_url, claimed, claimed_by, claimed_at, "order") values
  ('g1',  'Espresso machine',      'For slow mornings and little moments together in our first home. Thank you for helping make them special.',                                      '', false, '', null, 0),
  ('g2',  'Stand mixer',           'For baking sweet things together and sharing them with the people we love.',                                                                      '', false, '', null, 1),
  ('g3',  'Blender',               'For all the little kitchen moments we will share in our first home. Thank you for thinking of us.',                                               '', false, '', null, 2),
  ('g4',  'Food processor',        'For the meals and memories we will make together. We are so grateful for your kindness.',                                                          '', false, '', null, 3),
  ('g5',  'Complete cookware set', 'For the meals we will share in our first home. We are so grateful for your kindness.',                                                            '', false, '', null, 4),
  ('g6',  'Water dispenser',       'A thoughtful addition to our home and a little comfort to share each day. Thank you!',                                                             '', false, '', null, 5),
  ('g7',  'Dinnerware set',        'For gathering around the table with the people we love. Thank you for being part of our new beginning.',                                           '', false, '', null, 6),
  ('g8',  'King-size bed linen',   'For cozy nights and restful mornings in our new home. Thank you for your kindness.',                                                                '', false, '', null, 7),
  ('g9',  'Living room carpet',    'To make our home feel warm and welcoming. We are grateful for your love and support.',                                                             '', false, '', null, 8),
  ('g10', 'TV soundbar',           'For movie nights, music and laughter in our home. Thank you for celebrating with us.',                                                             '', false, '', null, 9),
  ('g11', 'Smart speaker',         'For music, laughter and lovely moments in our first home. Thank you for thinking of us.',                                                          '', false, '', null, 10),
  ('g12', 'Home décor bundle',     'For the little touches that make a house feel like home. Thank you for helping us begin.',                                                        '', false, '', null, 11),
  ('g13', 'Soft linens bundle',    'For making our home a little softer and cozier. We are so grateful for your love.',                                                               '', false, '', null, 12),
  ('g14', 'A night away for two',  'A little time away together after the celebrations. Thank you for making it extra special.',                                                     '', false, '', null, 13),
  ('g15', 'Dinner date for two',   'A lovely meal for two as we celebrate this new chapter. We are so grateful.',                                                                     '', false, '', null, 14),
  ('g16', 'Honeymoon trip',        'A gift toward our first adventure as a married couple. Your kindness means so much to us.',                                                       '', false, '', null, 15)
on conflict (id) do nothing;

-- Tell PostgREST to re-read the schema, so freshly added columns (guests.code, guests.approved,
-- guests.plus_one …) are usable right away instead of throwing “schema cache” errors.
notify pgrst, 'reload schema';
