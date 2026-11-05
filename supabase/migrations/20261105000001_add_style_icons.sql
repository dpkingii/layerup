-- People whose style the user likes. A placeholder has a name but no profile yet,
-- and stays out of outfit prompts until it's described.
create type public.style_icon_status as enum ('ready', 'placeholder');

create table public.style_icons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  status public.style_icon_status not null default 'ready',
  summary text,
  signature_pieces text[] not null default '{}',
  palette text[] not null default '{}',
  silhouette text,
  layering text,
  created_at timestamptz not null default now()
);
alter table public.style_icons enable row level security;
create index style_icons_user_id_idx on public.style_icons (user_id);

create policy "style_icons: all own" on public.style_icons
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
