-- Layerup initial schema

create type public.temp_sensitivity as enum ('runs_cold', 'neutral', 'runs_hot');
create type public.fit_pref as enum ('relaxed', 'fitted', 'oversized');
create type public.item_slot as enum ('base', 'mid', 'outer', 'bottom', 'one_piece', 'shoes', 'accessory');
create type public.tag_status as enum ('pending', 'tagged', 'confirmed', 'failed');
create type public.day_context as enum ('work', 'casual', 'active', 'going_out');

-- Allowlist: no policies, so only the service role / dashboard can read or edit it.
create table public.allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.allowlist enable row level security;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  vibes text[] not null default '{}',
  temp_sensitivity public.temp_sensitivity not null default 'neutral',
  fit_pref public.fit_pref,
  day_start time not null default '08:00',
  day_end time not null default '20:00',
  location_name text,
  location_lat double precision,
  location_lon double precision,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Tag columns are nullable because they stay empty while tag_status = 'pending'.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  is_generic boolean not null default false,
  photo_path text,
  category text,
  subtype text,
  slot public.item_slot,
  colors text[] not null default '{}',
  pattern text,
  warmth smallint check (warmth between 1 and 5),
  waterproof boolean not null default false,
  windproof boolean not null default false,
  breathable boolean not null default false,
  tag_status public.tag_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (is_generic = (photo_path is null))
);
alter table public.items enable row level security;
create index items_user_id_idx on public.items (user_id);

create policy "items: all own" on public.items
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- One row per generated outfit. Shuffles in the same morning share a session_id;
-- "Wear this" sets worn_at. Doubles as the wear log and feedback history.
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  session_id uuid not null,
  context public.day_context not null,
  weather jsonb not null,
  outfit jsonb not null,
  rationale text,
  feedback text[],
  worn_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.suggestions enable row level security;
create index suggestions_user_created_idx on public.suggestions (user_id, created_at desc);

create policy "suggestions: all own" on public.suggestions
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Block signups whose email isn't allowlisted. Magic-link sign-in creates the
-- auth user on first use, so this runs before any account exists.
create function public.enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.allowlist where email = lower(new.email)) then
    raise exception 'Email % is not on the Layerup invite list', new.email;
  end if;
  return new;
end;
$$;

create trigger enforce_allowlist
  before insert on auth.users
  for each row execute function public.enforce_allowlist();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private photo bucket. Objects live at "<user_id>/<item_id>.<ext>".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

create policy "wardrobe: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe: insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
