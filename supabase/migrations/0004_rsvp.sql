-- Submit RSVP hanya untuk undangan aktif (security definer).
-- TODO (Fase hardening): tambah rate-limit per IP/undangan atau moderasi
-- (RSVP publik default 'pending' sebelum tampil) untuk cegah spam anonim.
create or replace function public.submit_rsvp(
  p_slug text, p_name text, p_attendance text, p_headcount int, p_message text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    return json_build_object('ok', false, 'error', 'Nama harus diisi');
  end if;
  if p_attendance not in ('hadir', 'tidak', 'ragu') then
    return json_build_object('ok', false, 'error', 'Kehadiran tidak valid');
  end if;

  select i.id into v_id from invitations i
  where i.slug = p_slug and i.status = 'active'
    and (i.expires_at is null or i.expires_at > now())
  limit 1;

  if v_id is null then
    return json_build_object('ok', false, 'error', 'Undangan tidak aktif');
  end if;

  insert into rsvps (invitation_id, guest_name, attendance, headcount, message)
  values (v_id, left(trim(p_name), 120), p_attendance::attendance, least(20, greatest(1, coalesce(p_headcount, 1))), left(coalesce(p_message, ''), 1000));

  return json_build_object('ok', true);
end;
$$;

-- Buku tamu publik (tanpa kolom sensitif, exclude spam).
create or replace function public.get_public_rsvps(p_slug text)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'guestName', r.guest_name,
    'attendance', r.attendance,
    'message', r.message,
    'createdAt', r.created_at
  ) order by r.created_at desc), '[]'::json)
  from rsvps r
  join invitations i on i.id = r.invitation_id
  where i.slug = p_slug and i.status = 'active' and r.is_spam = false
  limit 200;
$$;

grant execute on function public.submit_rsvp(text, text, text, int, text) to anon, authenticated;
grant execute on function public.get_public_rsvps(text) to anon, authenticated;

-- Tutup jalur insert langsung anon (submit kini via RPC security definer).
drop policy if exists "rsvp_public_insert" on rsvps;

-- Owner update/delete policies (idempotent).
drop policy if exists "rsvp_owner_update" on rsvps;
create policy "rsvp_owner_update" on rsvps for update
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));

drop policy if exists "rsvp_owner_delete" on rsvps;
create policy "rsvp_owner_delete" on rsvps for delete
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));
