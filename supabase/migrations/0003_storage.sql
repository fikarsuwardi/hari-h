-- Bucket publik untuk aset undangan
insert into storage.buckets (id, name, public)
values ('invitations', 'invitations', true)
on conflict (id) do nothing;

-- Baca publik
drop policy if exists "invitations_public_read" on storage.objects;
create policy "invitations_public_read" on storage.objects
  for select using (bucket_id = 'invitations');

-- Authenticated boleh tulis di folder miliknya: {uid}/...
drop policy if exists "invitations_owner_insert" on storage.objects;
create policy "invitations_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invitations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "invitations_owner_update" on storage.objects;
create policy "invitations_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'invitations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "invitations_owner_delete" on storage.objects;
create policy "invitations_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invitations' and (storage.foldername(name))[1] = auth.uid()::text);
