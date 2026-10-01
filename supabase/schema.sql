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
alter table guests add column if not exists code text default '';
alter table guests add column if not exists approved boolean default null;
alter table guests add column if not exists plus_one text default '';
create table if not exists vendors (id text primary key default gen_random_uuid()::text, type text, name text, quote numeric default 0, contact text, status text default 'pending', notes text);
create table if not exists checklist (id text primary key default gen_random_uuid()::text, task text, category text default 'medium', due_date date, completed boolean default false);
create table if not exists attire (id text primary key default gen_random_uuid()::text, "group" text, label text, colors jsonb default '[]', reserved boolean default false, notes text, swatch_url text default '', "order" int default 0);
create table if not exists entourage (id text primary key default gen_random_uuid()::text, role text, name text, title text, "order" int default 0);
create table if not exists faq (id text primary key default gen_random_uuid()::text, question text, answer text, "order" int default 0);

alter table wedding_info enable row level security;
alter table schedule enable row level security;
alter table budget enable row level security;
alter table guests enable row level security;
alter table vendors enable row level security;
alter table checklist enable row level security;
alter table attire enable row level security;
alter table entourage enable row level security;
alter table faq enable row level security;

-- Seed data is loaded from the admin: Settings → "Push starter data to Supabase".
