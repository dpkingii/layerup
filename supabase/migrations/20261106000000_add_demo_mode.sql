-- Demo mode: a recruiter clicks "Try the demo", signs in as an anonymous guest,
-- and gets their own copy of a sample closet. Real accounts stay invite-only.

create or replace function public.enforce_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_anonymous then
    return new;
  end if;
  if not exists (select 1 from public.allowlist where email = lower(new.email)) then
    raise exception 'Email % is not on the Layerup invite list', new.email;
  end if;
  return new;
end;
$$;

-- The sample closet every guest gets a copy of. Its photos stay where they are;
-- guests may read only these exact paths, so they can copy them into their own folder.
create table public.demo_items (
  id uuid primary key default gen_random_uuid(),
  photo_path text not null,
  cutout_path text,
  category text,
  subtype text,
  slot public.item_slot,
  colors text[] not null default '{}',
  pattern text,
  warmth smallint check (warmth between 1 and 5),
  waterproof boolean not null default false,
  windproof boolean not null default false,
  breathable boolean not null default false
);
alter table public.demo_items enable row level security;

create function public.is_demo_asset(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.demo_items where photo_path = object_name or cutout_path = object_name
  );
$$;

create policy "wardrobe: read demo assets" on storage.objects
  for select to authenticated
  using (bucket_id = 'wardrobe' and public.is_demo_asset(name));

create function public.is_guest()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_anonymous from auth.users where id = auth.uid()), false);
$$;

-- Gives the calling guest a ready profile, the sample closet and one style icon.
-- Returns where each new item's photos must be copied from; the app copies them.
create function public.seed_demo_closet()
returns table (item_id uuid, photo_from text, cutout_from text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if not public.is_guest() then
    raise exception 'Only demo guests get the demo closet';
  end if;
  if exists (select 1 from public.items where user_id = uid) then
    return;
  end if;

  update public.profiles
  set vibes = '{minimal,classic,smart-casual}', temp_sensitivity = 'neutral',
      day_start = '09:00', day_end = '20:00', onboarded_at = now()
  where id = uid;

  insert into public.style_icons (user_id, name, summary, signature_pieces, palette, silhouette, layering)
  values (
    uid, 'Tom Holland',
    'Smart-casual youth: high-waisted trousers with fitted knitwear and cropped jackets',
    '{high-waisted straight-leg trousers,cropped denim jacket,fitted crewneck sweater,white leather sneakers,oversized hoodie}',
    '{black,navy,cream,olive}',
    'Cropped top with high-rise bottoms defining the waist',
    'Light sweaters or hoodies under structured short jackets'
  );

  return query
  with src as materialized (
    select d.*, gen_random_uuid() as new_id from public.demo_items d
  ), inserted as (
    insert into public.items (
      id, user_id, photo_path, cutout_path, category, subtype, slot, colors, pattern,
      warmth, waterproof, windproof, breathable, tag_status
    )
    select
      s.new_id, uid, uid::text || '/' || s.new_id || '.jpg',
      case when s.cutout_path is not null then uid::text || '/' || s.new_id || '.png' end,
      s.category, s.subtype, s.slot, s.colors, s.pattern,
      s.warmth, s.waterproof, s.windproof, s.breathable, 'confirmed'
    from src s
    returning id
  )
  select s.new_id, s.photo_path, s.cutout_path from src s join inserted i on i.id = s.new_id;
end;
$$;

-- AI requests per guest. No policies: only use_ai_request() touches it, so guests can't reset it.
create table public.demo_usage (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  ai_requests integer not null default 0
);
alter table public.demo_usage enable row level security;

-- Call before each AI request. Always true for real accounts; guests get 10.
create function public.use_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if not public.is_guest() then
    return true;
  end if;
  insert into public.demo_usage as u (user_id, ai_requests)
  values (auth.uid(), 1)
  on conflict (user_id) do update set ai_requests = u.ai_requests + 1
  where u.ai_requests < 10
  returning ai_requests into used;
  return used is not null;
end;
$$;

revoke execute on function public.is_demo_asset(text) from public, anon;
revoke execute on function public.is_guest() from public, anon;
revoke execute on function public.seed_demo_closet() from public, anon;
revoke execute on function public.use_ai_request() from public, anon;
grant execute on function public.is_demo_asset(text) to authenticated;
grant execute on function public.is_guest() to authenticated;
grant execute on function public.seed_demo_closet() to authenticated;
grant execute on function public.use_ai_request() to authenticated;
