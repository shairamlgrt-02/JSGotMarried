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

create table if not exists vendors (id text primary key default gen_random_uuid()::text, type text, name text, quote numeric default 0, contact text, status text default 'pending', notes text);
create table if not exists checklist (id text primary key default gen_random_uuid()::text, task text, category text default 'medium', due_date date, completed boolean default false);
create table if not exists attire (id text primary key default gen_random_uuid()::text, "group" text, label text, colors jsonb default '[]', reserved boolean default false, notes text, swatch_url text default '', "order" int default 0);
create table if not exists entourage (id text primary key default gen_random_uuid()::text, role text, name text, title text, "order" int default 0);
create table if not exists faq (id text primary key default gen_random_uuid()::text, question text, answer text, "order" int default 0);

-- ── attire palette (round 20): the beetle becomes a greenish Scarab; weaves softened to liquid shine ──
insert into attire (id, "group", label, colors, reserved, notes, swatch_url, "order") values
  ('a3', 'shai_family', 'Shai''s Family', '[{"name":"Copper","hex":"#8C3617"}]'::jsonb, true, '', '', 3),
  ('a4', 'jeg_family', 'Jeg''s Family', '[{"name":"Burgundy","hex":"#5C1223"}]'::jsonb, true, '', '', 4),
  ('a5', 'bridesmaids', 'Bridesmaids', '[{"name":"Turquoise","hex":"#0F7E7A"},{"name":"Amethyst","hex":"#5E2487"},{"name":"Garnet","hex":"#8E1226"},{"name":"Sapphire","hex":"#0A2A6E"},{"name":"Ruby","hex":"#B01A63"},{"name":"Citrine","hex":"#BE8B0F"}]'::jsonb, true, 'Five bridesmaids in jewel stones; the Maid of Honor shines in Citrine gold', '', 5),
  ('a7', 'groomsmen', 'Groomsmen', '[{"name":"Grey","hex":"#6E6E6E"},{"name":"Black","hex":"#101010"}]'::jsonb, true, 'Satin-lapel tux or suit', '', 6),
  ('a6', 'guests', 'Our Guests', '[{"name":"Emerald","hex":"#0A5C33","fabric":"Velvet"},{"name":"Laurel","hex":"#35562B","fabric":"Fine suit wool"},{"name":"Jade","hex":"#23825A","fabric":"Silk charmeuse"},{"name":"Scarab","hex":"#2C8C3C","fabric":"Shiny polyester · dry-fit"},{"name":"Olive","hex":"#5F6B24","fabric":"Duchesse satin"},{"name":"Peridot","hex":"#9AA62C","fabric":"Silk charmeuse"},{"name":"Coffee","hex":"#452A18","fabric":"Velvet"},{"name":"Smoky Topaz","hex":"#5E4630","fabric":"Fine suit wool"},{"name":"Bronze","hex":"#6F4F1D","fabric":"Duchesse satin"},{"name":"Toffee","hex":"#7C5230","fabric":"Silk charmeuse"},{"name":"Dark Honey","hex":"#8A5A0C","fabric":"Liquid satin · poly"},{"name":"Caramel","hex":"#9C6A28","fabric":"Velvet"}]'::jsonb, false, 'Black tie in glossy greens and warm shining browns — kindly avoid black, white, burgundy and copper. Shine welcome: satin, velvet, silk, fine suit or liquid poly — please skip tulle, chiffon and anything fully matte.', '', 7)
on conflict (id) do update set "group" = excluded."group", label = excluded.label, colors = excluded.colors,
  reserved = excluded.reserved, notes = excluded.notes, swatch_url = excluded.swatch_url, "order" = excluded."order";
-- the Maid of Honor no longer has her own card — she sits with the bridesmaids, in Citrine
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

-- Seed data is loaded from the admin: Settings → "Push starter data to Supabase" (safe to press any
-- time: guests are skipped, the attire palette is refreshed from the code, everything else only
-- fills in rows that are missing — nothing the couple wrote or uploaded is overwritten).

-- Tell PostgREST to re-read the schema, so freshly added columns (guests.code, guests.approved,
-- guests.plus_one …) are usable right away instead of throwing “schema cache” errors.
notify pgrst, 'reload schema';
