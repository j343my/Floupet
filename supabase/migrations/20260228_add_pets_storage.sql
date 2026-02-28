-- Create storage bucket for pets
insert into storage.buckets (id, name, public)
values ('pets', 'pets', true)
on conflict (id) do nothing;

-- Set up RLS for Storage
-- Allow anyone to read photos (since it's a public bucket)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'pets' );

-- Allow authenticated users to upload photos
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'pets' 
  and auth.role() = 'authenticated'
);

-- Allow owners/admins to delete/update (Simplified for MVP: any authenticated user can update their own uploads, 
-- but since we don't track owner_id in storage.objects easily without more setup, 
-- we'll allow authenticated users to manage objects in 'pets' bucket for now)
create policy "Authenticated users can update/delete"
on storage.objects for update
using ( bucket_id = 'pets' and auth.role() = 'authenticated' );

create policy "Authenticated users can manage"
on storage.objects for delete
using ( bucket_id = 'pets' and auth.role() = 'authenticated' );
