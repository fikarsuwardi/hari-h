# 06 — Roadmap & Dekomposisi

Platform dipecah jadi **sub-proyek** berurutan. Tiap fase punya siklus spec → plan → implementasi sendiri. Urutan dipilih agar nilai inti (undangan yang bisa dibagikan) terbukti lebih dulu, monetisasi menyusul.

## Fase 0 — Fondasi
**Tujuan:** kerangka jalan.
- Setup Next.js + Supabase + Vercel + Tailwind/shadcn.
- Skema DB inti ([03](03-data-model.md)) + RLS dasar.
- Auth (register/login/reset, status trial).
- Layout dashboard (sidebar, header, theme switcher).
- **Selesai bila:** user bisa daftar, login, lihat dashboard kosong.

## Fase 1 — Mesin Undangan (pembeda inti)
**Tujuan:** satu undangan bisa dirender & dibagikan.
- Kontrak data + `ThemeRenderer` + registry ([05](05-rendering-engine.md)).
- **1 tema** lengkap (mis. Minimalis-01) dengan semua section.
- Halaman publik `/[slug]` (SSR/ISR) + OG image dinamis.
- **Selesai bila:** data undangan dummy → halaman publik tampil benar + preview WA rapi.

## Fase 2 — Buat & Edit Undangan
**Tujuan:** user bikin undangan sendiri.
- Galeri tema (filter, search, sort) + modal "Pilih" → buat draft.
- Editor form per-section + preview live.
- Daftar undangan + aksi (publish, bagikan, aktif/nonaktif).
- **Selesai bila:** user pilih tema → isi data → publish → link hidup.

## Fase 3 — Fitur Tamu
**Tujuan:** undangan interaktif.
- RSVP + ucapan & doa (insert anon, Realtime ke dashboard).
- Countdown, maps, galeri, musik latar, amplop digital, love story, livestream.
- Dashboard kelola RSVP (lihat, moderasi spam, export).
- **Selesai bila:** tamu buka link → RSVP → muncul live di dashboard.

## Fase 4 — Monetisasi
**Tujuan:** trial → bayar.
- Paket & halaman upgrade.
- Integrasi 1 gateway (Midtrans/Xendit) + webhook.
- Aktivasi paket + set `expires_at`; trial expiry otomatis.
- Kontrol akses tema sesuai paket (foto/non-foto).
- **Selesai bila:** user bayar → akses penuh + masa aktif benar.

## Fase 5 — Skala & Marketing
**Tujuan:** lengkapi platform.
- Landing page publik (hero, galeri, pricing, FAQ, social proof).
- Panel admin (tema, paket, transaksi, user).
- Program reseller.
- Tambah tema (Luxury, Floral, Art, dst) — tinggal tambah folder.
- Multi-gateway, QR, email notifikasi.

## Ketergantungan

```
Fase 0 ─→ Fase 1 ─→ Fase 2 ─→ Fase 3
                       │
                       └─→ Fase 4 ─→ Fase 5
```

Fase 1 bisa jalan paralel-konsep dgn 0 (mesin render bisa diuji dgn data dummy sebelum auth rapi), tapi urutan aman = berurutan.

## Catatan

- Tiap fase = 1 spec turunan + 1 plan implementasi (via skill writing-plans).
- Harga & fitur boleh diubah mulai Fase 4 (sesuai rencana ubah model bisnis).
- Tema asli berlisensi — **buat ulang desain sendiri**, jangan salin aset WeddingSaaS.
