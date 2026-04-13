-- Create storage bucket for space cover photos
insert into storage.buckets (id, name, public)
values ('space-covers', 'space-covers', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to space-covers
create policy "Authenticated users can upload cover photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'space-covers');

-- Allow public read access to cover photos
create policy "Public read access for cover photos"
  on storage.objects for select
  to public
  using (bucket_id = 'space-covers');

-- Allow authenticated users to delete their own cover photos
create policy "Authenticated users can delete cover photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'space-covers');
