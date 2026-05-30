# 01 — Tech Stack

## Keputusan: Next.js (App Router) + Supabase

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend & SSR | **Next.js 15 (App Router, React Server Components)** | Render halaman undangan publik via SSR/ISR + dynamic OG image untuk preview WhatsApp |
| Database | **Supabase Postgres** | Data relasional (undangan → tamu → RSVP → transaksi) + Row Level Security |
| Auth | **Supabase Auth** | Email/password + OAuth, terintegrasi dgn RLS |
| Storage | **Supabase Storage** | Foto mempelai, galeri, musik, video prewed |
| Realtime | **Supabase Realtime** | RSVP & ucapan masuk live ke dashboard |
| Hosting | **Vercel** | Deploy Next.js native, edge cache per-slug |
| Pembayaran | **Midtrans / Xendit** | Gateway lokal (VA, e-wallet, QRIS) — pengganti JetFormBuilder |
| Styling | **Tailwind CSS + shadcn/ui** | Dashboard cepat; tema undangan pakai CSS modular per tema |
| Email | **Resend** | Verifikasi akun, notifikasi |

## Kenapa bukan Firebase

Keputusan diambil dari karakteristik produk, bukan familiaritas (kamu kuasai keduanya).

**Inti produk = halaman undangan publik yang dibagikan via link, dibuka ratusan tamu.**

1. **OG preview untuk share** — link undangan di WhatsApp harus memunculkan kartu preview (judul + foto). Next.js dynamic OG image dibuat untuk ini; di Firebase SSR-nya berbelit.
2. **Biaya pada read tinggi** — 1 undangan dibuka ratusan kali. ISR + cache per-slug di Next.js murah & cepat. Firestore menagih per-read → biaya bisa membengkak tanpa caching manual.
3. **Data relasional** — undangan, tamu, RSVP, transaksi, reseller punya relasi jelas. Postgres + foreign key + RLS lebih bersih daripada dokumen Firestore yang denormalized.

**Firebase tetap valid jika:** real-time jadi kebutuhan dominan, atau kejar prototipe tercepat. Untuk replikasi ini, kualitas halaman publik + biaya skala lebih menentukan.

## Alternatif yang dipertimbangkan

| Opsi | Kelebihan | Kekurangan | Verdikt |
|---|---|---|---|
| **Next.js + Supabase** | SSR/ISR, OG dinamis, Postgres relasional, RLS, biaya prediktabel | Stack agak lebih banyak bagian | ✅ Dipilih |
| Firebase (Hosting+Firestore+Functions) | Cepat dibangun, real-time bawaan, free tier besar | SSR/OG berbelit, biaya read tinggi, data denormalized | Cadangan |
| WordPress + WeddingSaaS Pro | Tercepat (itu produk aslinya) | Terkunci lisensi & WP, susah ubah fitur dalam | Ditolak (tujuan: ubah fitur) |

## Catatan keamanan (pelajaran dari produk asli)

- Produk asli mengekspos `rsvp_password` di client. **Jangan ditiru** — proteksi RSVP private lewat server/RLS.
- Semua akses data lewat RLS Supabase: user hanya bisa baca/tulis undangan miliknya; halaman publik baca via view/anon role terbatas.
- Slug undangan jadi identitas publik — pastikan unik & tidak bisa di-enumerate untuk data sensitif.
