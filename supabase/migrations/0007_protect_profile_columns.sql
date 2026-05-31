-- C1 (CRITICAL): cegah privilege escalation. Policy `profiles_self_update` (0001)
-- mengizinkan user update barisnya sendiri, dan RLS bersifat row-level (bukan
-- column-level), sehingga user bisa self-set role='admin' atau memberi paket
-- berbayar gratis. Trigger ini membatasi kolom terproteksi hanya untuk admin
-- (atau konteks tanpa JWT / service-role untuk job billing nanti).
create or replace function public.guard_profile_protected_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Admin atau konteks service-role (auth.uid() null) boleh ubah apa saja.
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.account_status is distinct from old.account_status
     or new.plan_id is distinct from old.plan_id
     or new.plan_expires_at is distinct from old.plan_expires_at then
    raise exception 'Tidak diizinkan mengubah kolom profil terproteksi';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_protected on public.profiles;
create trigger profiles_guard_protected
  before update on public.profiles
  for each row execute function public.guard_profile_protected_cols();

-- I1: konsistenkan with check pada update admin profiles.
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- M1: izinkan admin menghapus thumbnail tema (hindari orphan).
drop policy if exists "themes_bucket_admin_delete" on storage.objects;
create policy "themes_bucket_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'themes' and public.is_admin());
