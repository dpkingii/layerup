-- Background-removed PNG of the item photo, made in the browser at "<user_id>/<item_id>.png".
alter table public.items add column cutout_path text;
