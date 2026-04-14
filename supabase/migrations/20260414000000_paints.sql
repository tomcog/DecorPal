-- ── Paints ──────────────────────────────────────────────────
create table public.paints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null,
  brand text,
  color_code text,
  hex text,
  finish text,
  notes text,
  status text default 'considering',
  created_at timestamptz not null default now()
);

alter table public.paints enable row level security;

create policy "Users can view their own paints"
  on public.paints for select
  using (auth.uid() = user_id);

create policy "Users can insert their own paints"
  on public.paints for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own paints"
  on public.paints for update
  using (auth.uid() = user_id);

create policy "Users can delete their own paints"
  on public.paints for delete
  using (auth.uid() = user_id);

create index idx_paints_space_id on public.paints(space_id);
create index idx_paints_user_id on public.paints(user_id);
