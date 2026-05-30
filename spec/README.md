# Spec — Hari-H (Replikasi Walimatul iD)

> Platform undangan pernikahan digital. Replikasi fungsional 100% dari Walimatul iD.
> Fitur & harga akan diubah pada iterasi berikutnya — spec ini mereplikasi dulu.
> Dibuat: 31 Mei 2026 · Status: **DRAFT untuk review**

## Daftar Dokumen

| File | Isi |
|---|---|
| [00-overview.md](00-overview.md) | Visi, model bisnis, ruang lingkup, asumsi |
| [01-tech-stack.md](01-tech-stack.md) | Keputusan stack (Next.js + Supabase) + alasan + alternatif |
| [02-architecture.md](02-architecture.md) | Arsitektur sistem, subsistem, alur data |
| [03-data-model.md](03-data-model.md) | Skema database (entitas + relasi) |
| [04-features.md](04-features.md) | Rincian fitur per subsistem |
| [05-rendering-engine.md](05-rendering-engine.md) | Mesin render tema undangan (template data-driven) |
| [06-roadmap.md](06-roadmap.md) | Dekomposisi jadi sub-proyek bertahap |
| [07-design-system.md](07-design-system.md) | Design system "Rukos" (token, tipografi, komponen) |

## Sumber Referensi

Analisis produk asli ada di `../example/`:
- `walimatul-home-analysis.md` — landing page
- `walimatul-create-analysis.md` — dashboard "Buat Undangan"
- `home-page.html`, `create-page.html`, `home-fullpage.jpeg`, `assets/`

## Ringkasan Keputusan (cepat)

- **Stack:** Next.js (App Router) + Supabase (Postgres, Auth, Storage, Realtime) — lihat [01](01-tech-stack.md)
- **Scope:** full platform, dipecah jadi 6 fase — lihat [06](06-roadmap.md)
- **Rendering tema:** template data-driven (user isi data, tema = komponen) — lihat [05](05-rendering-engine.md)
- **Pembayaran:** gateway lokal (Midtrans/Xendit) — pengganti JetFormBuilder
- **Pasar:** Indonesia (Bahasa Indonesia, IDR)
