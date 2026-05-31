-- RPC: kembalikan undangan publik (hanya status 'active') + data tampilan + theme key.
-- security definer agar bisa baca meski RLS invitation_data owner-only.
create or replace function public.get_public_invitation(p_slug text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'title', i.title,
    'slug', i.slug,
    'themeKey', t.component_key,
    'data', json_build_object(
      'couple', coalesce(d.couple, '{}'::jsonb),
      'events', coalesce(d.events, '[]'::jsonb),
      'quotes', d.quotes,
      'loveStory', d.love_story,
      'gallery', coalesce(d.gallery, '[]'::jsonb),
      'prewedVideoUrl', d.prewed_video_url,
      'musicUrl', d.music_url,
      'livestream', d.livestream,
      'gift', d.gift,
      'settings', coalesce(d.settings, '{}'::jsonb)
    )
  )
  from invitations i
  join themes t on t.id = i.theme_id
  left join invitation_data d on d.invitation_id = i.id
  where i.slug = p_slug and i.status = 'active'
  limit 1;
$$;

grant execute on function public.get_public_invitation(text) to anon, authenticated;

-- Tema minimalis-01 (component_key dipakai registry)
insert into themes (name, slug, category_id, has_photo, component_key, badge, popularity, is_active)
select 'Minimalis - 01', 'minimalis-01', c.id, true, 'minimalis-01', 'new', 10, true
from categories c where c.slug = 'pernikahan'
on conflict (slug) do nothing;

-- Undangan demo: idempoten, hanya insert jika profile tersedia
-- (user demo dibuat via psql seed terpisah sebelum langkah ini dibutuhkan)
insert into invitations (user_id, theme_id, title, slug, status)
select
  p.id,
  t.id,
  'Andi & Sari',
  'andi-dan-sari',
  'active'
from profiles p, themes t
where t.slug = 'minimalis-01'
limit 1
on conflict (slug) do nothing;

insert into invitation_data (invitation_id, couple, events, quotes, gallery, gift)
select
  i.id,
  '{"groom":{"name":"Andi","fullName":"Andi Firmansyah","parents":"Bpk. Hendra & Ibu Wati"},"bride":{"name":"Sari","fullName":"Sari Dewi","parents":"Bpk. Ahmad & Ibu Nani"}}'::jsonb,
  '[{"name":"Akad Nikah","date":"2026-09-01","startTime":"08:00","venue":"Masjid Agung","address":"Jl. Masjid Agung No. 1"},{"name":"Resepsi","date":"2026-09-01","startTime":"11:00","venue":"Gedung Serbaguna","address":"Jl. Gedung Serbaguna No. 5","mapsUrl":"https://maps.google.com/?q=Gedung+Serbaguna"}]'::jsonb,
  '{"text":"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri.","source":"QS. Ar-Rum: 21"}'::jsonb,
  '[]'::jsonb,
  '[{"type":"bank","bank":"BCA","number":"1234567890","holder":"Andi Firmansyah"}]'::jsonb
from invitations i
where i.slug = 'andi-dan-sari'
  and not exists (select 1 from invitation_data d where d.invitation_id = i.id);
