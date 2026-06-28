insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'animal-photos',
  'animal-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
);

create policy "Public read access for animal photos"
on storage.objects for select
using (bucket_id = 'animal-photos');

create policy "Authenticated users can upload animal photos"
on storage.objects for insert
with check (
  bucket_id = 'animal-photos'
  and auth.role() = 'authenticated'
);

create policy "Users can delete own animal photos"
on storage.objects for delete
using (
  bucket_id = 'animal-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
