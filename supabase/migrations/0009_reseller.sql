-- Satu pendaftaran per user
create unique index if not exists resellers_user_id_unique on resellers (user_id);

-- RLS: user lihat & daftar miliknya; admin kelola semua
drop policy if exists "resellers_self_select" on resellers;
create policy "resellers_self_select" on resellers for select using (auth.uid() = user_id);

drop policy if exists "resellers_self_insert" on resellers;
create policy "resellers_self_insert" on resellers for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "resellers_admin_all" on resellers;
create policy "resellers_admin_all" on resellers for all
  using (public.is_admin()) with check (public.is_admin());
