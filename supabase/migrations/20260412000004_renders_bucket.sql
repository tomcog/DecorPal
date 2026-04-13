-- Create storage bucket for AI-generated renders
insert into storage.buckets (id, name, public)
values ('renders', 'renders', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload renders
create policy "Authenticated users can upload renders"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'renders');

-- Allow public read access to renders
create policy "Public read access for renders"
  on storage.objects for select
  to public
  using (bucket_id = 'renders');

-- Allow authenticated users to delete their own renders
create policy "Authenticated users can delete renders"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'renders');
