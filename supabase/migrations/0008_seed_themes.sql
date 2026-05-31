-- Seed Elegan and Floral themes (idempotent)
insert into themes (name, slug, category_id, has_photo, component_key, badge, popularity, is_active)
select 'Elegan', 'elegan-01', c.id, true, 'elegan-01', 'new', 8, true
from categories c where c.slug = 'pernikahan'
on conflict (slug) do nothing;

insert into themes (name, slug, category_id, has_photo, component_key, badge, popularity, is_active)
select 'Floral', 'floral-01', c.id, true, 'floral-01', 'new', 7, true
from categories c where c.slug = 'pernikahan'
on conflict (slug) do nothing;
