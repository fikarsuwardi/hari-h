# 00 — Overview

## Visi

Platform SaaS untuk membuat **website undangan pernikahan digital**. Pengguna memilih tema, mengisi data acara, lalu mendapat halaman undangan publik berformat link unik yang dibagikan ke tamu (terutama via WhatsApp). Tamu membuka link, melihat detail acara, dan mengirim RSVP/ucapan.

## Model Bisnis (replikasi Walimatul)

Funnel: **trial gratis → upgrade berbayar.**

| Paket | Harga | Akses Tema | Masa Aktif |
|---|---|---|---|
| Free Trial | Rp 0 | Non-foto (terbatas) | 2 hari |
| Non Foto | Rp 49.000 | Semua tema non-foto | 6 bulan |
| Dengan Foto | Rp 99.000 | Semua tema dengan foto | 1 tahun |

- Pembeda paket hanya **2 sumbu**: akses tema (foto/non-foto) + durasi aktif. Checklist fitur identik di semua paket.
- Kanal tambahan: **program reseller**.
- *(Harga & struktur ini akan diubah pada iterasi berikut — spec mereplikasi dulu.)*

## Aktor

| Aktor | Kebutuhan |
|---|---|
| **Calon pengantin (user)** | Daftar, pilih tema, isi data undangan, kelola RSVP, bagikan link |
| **Tamu (guest)** | Buka undangan via link, lihat acara, kirim RSVP/ucapan, lihat lokasi |
| **Admin** | Kelola tema, paket, transaksi, user, konten landing |
| **Reseller** | Daftar, dapat akses jual paket (komisi) |

## Ruang Lingkup (full platform)

**Termasuk:**
1. Landing page marketing (hero, galeri tema, pricing, FAQ)
2. Auth (register, login, lupa password, status akun trial/active/expired)
3. Dashboard user (galeri tema, buat undangan, edit data, kelola RSVP)
4. Mesin render undangan publik (template data-driven)
5. Fitur tamu (RSVP, ucapan & doa, countdown, peta, galeri, musik, amplop digital, love story, livestream)
6. Pembayaran & manajemen paket (trial expiry, upgrade)
7. Panel admin (tema, paket, transaksi, user)
8. Program reseller

**Tidak termasuk (untuk sekarang):**
- Aplikasi mobile native (web-first, responsif)
- Page builder drag-drop (pakai template data-driven)
- Undangan non-pernikahan (khitan, ultah) — bisa menyusul

## Asumsi

- Pasar Indonesia: Bahasa Indonesia, mata uang IDR.
- Halaman undangan publik di-`noindex` (privat, diakses lewat link), tapi tetap butuh OG meta untuk preview share.
- Volume baca tinggi pada halaman undangan (1 undangan = ratusan view tamu).
- Pengembang solo, iterasi cepat diutamakan.

## Kriteria Sukses (replikasi)

- User bisa daftar → pilih tema → isi data → publish → bagikan link yang tampil benar di WhatsApp.
- Tamu bisa buka undangan (mobile, cepat) → kirim RSVP → muncul di dashboard user.
- Trial 2 hari otomatis expired; upgrade via pembayaran membuka akses penuh.
- Fungsionalitas setara produk asli pada fitur inti di [04-features.md](04-features.md).
