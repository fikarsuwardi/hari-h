-- Paket berbayar (Free Trial sudah di-seed Fase 0). Idempoten via not exists.
insert into packages (name, price, original_price, theme_access, duration_days, features)
select 'Non Foto', 49000, 98000, 'non_photo', 180,
  '["Akses semua tema non-foto","Aktif 6 bulan","RSVP & ucapan","Amplop digital","Hitung mundur"]'::jsonb
where not exists (select 1 from packages where name = 'Non Foto');

insert into packages (name, price, original_price, theme_access, duration_days, features)
select 'Dengan Foto', 99000, 198000, 'photo', 365,
  '["Akses semua tema dengan foto","Aktif 1 tahun","Galeri foto & prewed","RSVP & ucapan","Amplop digital","Hitung mundur"]'::jsonb
where not exists (select 1 from packages where name = 'Dengan Foto');
