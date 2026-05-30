# 02 — Arsitektur Sistem

## Peta Subsistem

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js (Vercel)                        │
│                                                              │
│  PUBLIC                    DASHBOARD (auth)        ADMIN      │
│  ├─ / (landing)            ├─ /dashboard            ├─ /admin │
│  ├─ /tema (galeri demo)    │   /invitation          │  tema  │
│  ├─ /[slug] (UNDANGAN)     │   /create              │  paket │
│  ├─ /api/og (OG image)     │   /edit/[id]           │  trx   │
│  └─ /auth/*                │   /rsvp/[id]            │  user  │
│                            └─ /upgrade              └─ resel.│
│                                                              │
│  ── Server Actions / Route Handlers (RPC ke Supabase) ──     │
└───────────────────────────────┬──────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                         │
   ┌────▼────┐            ┌──────▼──────┐          ┌───────▼──────┐
   │ Supabase│            │  Supabase   │          │   Midtrans/  │
   │ Postgres│            │ Auth/Storage│          │    Xendit    │
   │  + RLS  │            │  + Realtime │          │  (webhook)   │
   └─────────┘            └─────────────┘          └──────────────┘
```

## Subsistem & Tanggung Jawab

| Subsistem | Tanggung jawab | Route utama |
|---|---|---|
| **Landing** | Marketing, galeri tema, pricing, FAQ, CTA | `/`, `/tema`, `/undangan-video`, `/article` |
| **Auth** | Register, login, reset password, sesi | `/auth/login`, `/auth/register`, `/auth/lost-password` |
| **Dashboard** | CRUD undangan, pilih tema, edit data, kelola RSVP | `/dashboard/*` |
| **Invitation Engine** | Render undangan publik dari data + tema (SSR/ISR) | `/[slug]` |
| **OG Service** | Generate gambar preview share dinamis | `/api/og/[slug]` |
| **Payment** | Checkout paket, webhook, aktivasi | `/upgrade`, `/api/payment/webhook` |
| **Admin** | Kelola tema, paket, transaksi, user, reseller | `/admin/*` |
| **Reseller** | Pendaftaran & komisi | `/reseller/*` |

## Alur Data Inti

### A. Buat undangan (replikasi flow "Gunakan")
```
User pilih tema → modal (judul + slug) → Server Action create_invitation
  → cek kuota/paket user → insert row `invitations` (status=draft)
  → redirect ke /dashboard/edit/[id]
```

### B. Edit data undangan
```
Form section (mempelai, acara, gift, love story, galeri, musik...)
  → Server Action update_invitation_data (upsert ke `invitation_data` + tabel terkait)
  → preview live (render engine dgn data draft)
```

### C. Publish & share
```
User publish → status=active, set expires_at (sesuai paket)
  → halaman /[slug] aktif (ISR, revalidate on edit)
  → share link; OG image dari /api/og/[slug]
```

### D. Tamu buka & RSVP
```
Tamu buka /[slug]?to=<nama>  → SSR render tema + data
  → isi RSVP (hadir? jumlah, ucapan) → Server Action submit_rsvp (anon, RLS terbatas)
  → insert `rsvps` → Realtime push ke dashboard user
```

### E. Pembayaran
```
User /upgrade pilih paket → create transaction (status=pending)
  → redirect gateway (Midtrans/Xendit)
  → webhook /api/payment/webhook → verifikasi → update transaction=paid
  → set user plan + perpanjang masa aktif undangan
```

## Pola Backend

Produk asli pakai **satu endpoint dispatcher** (`run_wds` + param `name`). Di stack baru tidak perlu ditiru — pakai pola idiomatik Next.js:
- **Server Actions** untuk mutasi dari form (create/update/submit).
- **Route Handlers** (`/api/*`) untuk webhook & OG image.
- **RLS Supabase** sebagai lapis otorisasi (bukan cek manual di tiap handler).

## Strategi Caching

- Halaman `/[slug]`: **ISR** dengan `revalidateTag(slug)` dipanggil saat user edit/publish.
- Galeri tema landing: static / ISR panjang.
- Dashboard: dinamis (per-user, no cache).
