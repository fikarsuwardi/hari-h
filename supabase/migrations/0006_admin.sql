-- Helper: apakah user saat ini admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- RLS admin: tulis themes/packages, kelola profiles
drop policy if exists "themes_admin_write" on themes;
create policy "themes_admin_write" on themes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "packages_admin_write" on packages;
create policy "packages_admin_write" on packages for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: admin boleh lihat semua + update (role/status). (User biasa tetap hanya dirinya.)
drop policy if exists "profiles_admin_select" on profiles;
create policy "profiles_admin_select" on profiles for select using (public.is_admin());
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles for update using (public.is_admin());

-- Bucket thumbnail tema (public read, admin write)
insert into storage.buckets (id, name, public) values ('themes', 'themes', true) on conflict (id) do nothing;
drop policy if exists "themes_bucket_read" on storage.objects;
create policy "themes_bucket_read" on storage.objects for select using (bucket_id = 'themes');
drop policy if exists "themes_bucket_admin_write" on storage.objects;
create policy "themes_bucket_admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'themes' and public.is_admin());
drop policy if exists "themes_bucket_admin_update" on storage.objects;
create policy "themes_bucket_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'themes' and public.is_admin());
