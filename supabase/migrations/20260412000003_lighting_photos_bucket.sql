-- Create storage bucket for lighting idea photos
insert into storage.buckets (id, name, public)
values ('lighting-photos', 'lighting-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload lighting photos
create policy "Authenticated users can upload lighting photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lighting-photos');

-- Allow public read access to lighting photos
create policy "Public read access for lighting photos"
  on storage.objects for select
  to public
  using (bucket_id = 'lighting-photos');

-- Allow authenticated users to delete their own lighting photos
create policy "Authenticated users can delete lighting photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lighting-photos');
