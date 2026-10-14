-- Wandered — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ─── Users ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  avatar_url    text,
  share_slug    text unique not null,
  is_purchased  boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Public read for share slugs
create policy "Public read by share_slug"
  on public.users for select
  using (true);

-- ─── Visited Countries ────────────────────────────────────────────────────────
create table if not exists public.visited_countries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  country_code  text not null,           -- ISO 3166-1 alpha-2
  country_name  text not null,
  visited_at    timestamptz not null default now(),
  notes         text,
  unique(user_id, country_code)
);

alter table public.visited_countries enable row level security;

create policy "Users manage own countries"
  on public.visited_countries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public read visited countries"
  on public.visited_countries for select
  using (true);

-- ─── Visited Cities ───────────────────────────────────────────────────────────
create table if not exists public.visited_cities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  country_code  text not null,
  city_name     text not null,
  region        text,
  latitude      double precision,
  longitude     double precision,
  visited_at    timestamptz not null default now()
);

alter table public.visited_cities enable row level security;

create policy "Users manage own cities"
  on public.visited_cities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public read visited cities"
  on public.visited_cities for select
  using (true);

-- ─── Places ───────────────────────────────────────────────────────────────────
create table if not exists public.places (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  city_id       uuid references public.visited_cities(id) on delete set null,
  type          text not null check (type in ('restaurant','hotel','landmark','airport')),
  name          text not null,
  address       text,
  iata_code     text,
  rating        smallint check (rating between 1 and 5),
  notes         text,
  visited_at    timestamptz not null default now()
);

alter table public.places enable row level security;

create policy "Users manage own places"
  on public.places for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Bucket List ──────────────────────────────────────────────────────────────
create table if not exists public.bucket_list (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  country_code  text,
  country_name  text,
  city_name     text,
  type          text not null check (type in ('country','city')),
  notes         text,
  created_at    timestamptz not null default now()
);

alter table public.bucket_list enable row level security;

create policy "Users manage own bucket list"
  on public.bucket_list for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Country Reviews ─────────────────────────────────────────────────────────
create table if not exists public.country_reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  country_code    text not null,
  safety          smallint not null check (safety between 1 and 5),
  accommodation   smallint not null check (accommodation between 1 and 5),
  transport       smallint not null check (transport between 1 and 5),
  food            smallint not null check (food between 1 and 5),
  getting_around  smallint not null check (getting_around between 1 and 5),
  safety_women    smallint not null check (safety_women between 1 and 5),
  overall         smallint not null check (overall between 0 and 100),
  comment         text,
  created_at      timestamptz not null default now(),
  unique(user_id, country_code)
);

alter table public.country_reviews enable row level security;

create policy "Users manage own reviews"
  on public.country_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Goals ────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  year          smallint not null,
  target        smallint not null,
  type          text not null check (type in ('countries','cities','airports')),
  unique(user_id, year, type)
);

alter table public.goals enable row level security;

create policy "Users manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Trigger: auto-create profile on signup ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  slug text;
  dname text;
begin
  dname := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
  slug  := lower(regexp_replace(dname, '[^a-z0-9\s-]', '', 'g'));
  slug  := regexp_replace(trim(slug), '\s+', '-', 'g');

  insert into public.users (id, username, display_name, share_slug)
  values (new.id, slug, dname, slug)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
