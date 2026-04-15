alter table public.paints add column if not exists hexes text[];
alter table public.paints alter column name drop not null;
