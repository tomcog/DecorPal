-- Add products jsonb column for multiple product links per lighting idea.
-- Each entry: { "name": "...", "url": "https://..." }
alter table public.lighting_ideas
  add column products jsonb;

-- Migrate existing single product_url into the new products array
update public.lighting_ideas
  set products = jsonb_build_array(jsonb_build_object('name', '', 'url', product_url))
  where product_url is not null and product_url <> '';
