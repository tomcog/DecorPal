-- Create storage bucket for furnishing item photos
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload item photos
create policy "Authenticated users can upload item photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'item-photos');

-- Allow public read access to item photos
create policy "Public read access for item photos"
  on storage.objects for select
  to public
  using (bucket_id = 'item-photos');

-- Allow authenticated users to delete their own item photos
create policy "Authenticated users can delete item photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'item-photos');
