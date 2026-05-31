# 04 — Rincian Fitur per Subsistem

Diturunkan langsung dari analisis produk asli (`../example/`).

## 1. Landing Page
- Hero: judul, subjudul, 2 CTA (Buat Undangan / Coba Gratis), trust badge "500+ pasangan".
- Galeri tema dengan filter **Dengan Foto / Non-Foto**, kartu (badge, harga coret+diskon, Lihat/Pilih).
- Pricing 3 paket (lihat [00](00-overview.md)).
- Section "Fitur Umum" (grid ikon).
- FAQ accordion (6 pertanyaan).
- CTA penutup + footer (kontak, sosial, daftar tema, menu, reseller).
- Pop-up social proof ("X baru membeli ...").

## 2. Auth
- Register (nama, email, no WA, password), login, lupa password.
- **Pendaftaran sederhana ala walimatul: TANPA OTP / verifikasi email.** Daftar → langsung login (auto-login) → masuk dashboard. (Supabase "Confirm email" dimatikan.)
- Status akun: `trial` otomatis saat daftar (2 hari), `active`, `expired`.
- Redirect pattern pasca-login ke `/dashboard`.

## 3. Dashboard User
- **Galeri tema** (`/dashboard/invitation/create`): tab kategori, search, sort (A-Z / Terbaru / Populer), kartu tema (Lihat → demo, Pilih → modal).
- **Buat undangan**: modal judul + slug → buat draft → redirect ke editor.
- **Editor undangan**: form per-section (lihat fitur undangan di bawah), preview live.
- **Daftar undangan**: status, aksi (edit, bagikan, RSVP, aktifkan, perpanjang).
- **Kelola RSVP**: lihat daftar RSVP & ucapan, moderasi spam, export.
- **Beli/Upgrade paket**.

## 4. Fitur Undangan (yang dibuat user, tampil ke tamu)

Dari checklist paket + "Fitur Umum" produk asli:

| Fitur | Deskripsi |
|---|---|
| Detail mempelai | Nama, foto, orang tua, sosial media kedua mempelai |
| Detail acara | Akad & resepsi: tanggal, jam, lokasi |
| Navigasi lokasi | Embed maps + tombol "buka di Google Maps" |
| Hitung mundur | Countdown ke hari-H |
| Quotes / Ayat | Kutipan/ayat pembuka |
| Love story | Timeline kisah pasangan |
| Galeri foto | Album foto |
| Foto mempelai | (paket "Dengan Foto") |
| Video prewed | Embed video |
| Musik latar | Audio autoplay + tombol mute, ganti lagu |
| Amplop digital | Rekening bank / e-wallet / alamat kado |
| RSVP + ucapan & doa | Form kehadiran + buku tamu |
| Live streaming | Link streaming akad/resepsi |
| Custom tamu | Personalisasi nama via `?to=` |
| Unlimited share | Bagikan link tanpa batas |
| QR code | (dari `qr-code.js` asli) — untuk share/check-in |

## 5. Mesin Render Undangan
Lihat [05-rendering-engine.md](05-rendering-engine.md).

## 6. Pembayaran & Paket
- Checkout paket → gateway lokal (Midtrans/Xendit): VA, e-wallet, QRIS.
- Webhook verifikasi → aktivasi paket + set `expires_at` undangan.
- Trial expiry otomatis (cron / cek saat akses).
- Upgrade kapan saja.

## 7. Admin
- CRUD tema (upload thumbnail, set kategori, has_photo, badge, popularity, component_key).
- CRUD paket & harga.
- Lihat/kelola transaksi.
- Kelola user (status, plan).
- Kelola konten landing & FAQ.

## 8. Reseller
- Pendaftaran reseller (approval admin).
- Kode referral, atribusi transaksi, laporan komisi.

## Prioritas (MoSCoW)
- **Must:** Auth, galeri tema, buat undangan, render publik + OG, RSVP, 1–3 tema, pembayaran 1 gateway.
- **Should:** Semua fitur undangan, dashboard RSVP, trial expiry, admin tema/paket.
- **Could:** Reseller, social-proof popup, QR, multi-gateway, export.
- **Won't (sekarang):** Page builder, mobile native, kategori non-pernikahan.
