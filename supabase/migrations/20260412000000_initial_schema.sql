-- ============================================================
-- DecorPal — Initial Schema
-- ============================================================

-- ── Spaces ──────────────────────────────────────────────────
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text,
  description text,
  cover_photo_url text,
  style_tags text[],
  budget numeric,
  created_at timestamptz not null default now()
);

alter table public.spaces enable row level security;

create policy "Users can view their own spaces"
  on public.spaces for select
  using (auth.uid() = user_id);

create policy "Users can insert their own spaces"
  on public.spaces for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own spaces"
  on public.spaces for update
  using (auth.uid() = user_id);

create policy "Users can delete their own spaces"
  on public.spaces for delete
  using (auth.uid() = user_id);


-- ── Furnishing Items ────────────────────────────────────────
create table public.furnishing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null,
  category text,
  description text,
  notes text,
  photo_urls text[],
  vendor text,
  product_url text,
  price numeric,
  status text default 'considering',
  acquired boolean not null default false,
  final_vendor text,
  final_price numeric,
  final_purchase_date date,
  final_purchase_notes text,
  created_at timestamptz not null default now()
);

alter table public.furnishing_items enable row level security;

create policy "Users can view their own furnishing items"
  on public.furnishing_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own furnishing items"
  on public.furnishing_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own furnishing items"
  on public.furnishing_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own furnishing items"
  on public.furnishing_items for delete
  using (auth.uid() = user_id);


-- ── Palettes ────────────────────────────────────────────────
create table public.palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text,
  swatches jsonb,
  created_at timestamptz not null default now()
);

alter table public.palettes enable row level security;

create policy "Users can view their own palettes"
  on public.palettes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own palettes"
  on public.palettes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own palettes"
  on public.palettes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own palettes"
  on public.palettes for delete
  using (auth.uid() = user_id);


-- ── Lighting Ideas ──────────────────────────────────────────
create table public.lighting_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  title text,
  notes text,
  photo_urls text[],
  product_url text,
  created_at timestamptz not null default now()
);

alter table public.lighting_ideas enable row level security;

create policy "Users can view their own lighting ideas"
  on public.lighting_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert their own lighting ideas"
  on public.lighting_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own lighting ideas"
  on public.lighting_ideas for update
  using (auth.uid() = user_id);

create policy "Users can delete their own lighting ideas"
  on public.lighting_ideas for delete
  using (auth.uid() = user_id);


-- ── Renders ─────────────────────────────────────────────────
create table public.renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text,
  image_url text,
  prompt_text text,
  prompt_metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.renders enable row level security;

create policy "Users can view their own renders"
  on public.renders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own renders"
  on public.renders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own renders"
  on public.renders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own renders"
  on public.renders for delete
  using (auth.uid() = user_id);


-- ── Indexes ─────────────────────────────────────────────────
create index idx_spaces_user_id on public.spaces(user_id);
create index idx_furnishing_items_space_id on public.furnishing_items(space_id);
create index idx_furnishing_items_user_id on public.furnishing_items(user_id);
create index idx_palettes_space_id on public.palettes(space_id);
create index idx_palettes_user_id on public.palettes(user_id);
create index idx_lighting_ideas_space_id on public.lighting_ideas(space_id);
create index idx_lighting_ideas_user_id on public.lighting_ideas(user_id);
create index idx_renders_space_id on public.renders(space_id);
create index idx_renders_user_id on public.renders(user_id);
