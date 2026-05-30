# 03 — Data Model (Postgres / Supabase)

Skema relasional. Semua tabel pakai `id uuid pk`, `created_at`, `updated_at`. RLS aktif di semua tabel user-owned.

## Diagram Relasi (ringkas)

```
profiles ──< invitations >── themes >── categories
                 │
   ┌─────────────┼───────────────┬──────────────┐
   │             │               │              │
invitation_data  guests       rsvps         gifts
                 │
              (rsvps.guest_id → guests.id, nullable)

profiles ──< transactions >── packages
profiles ──< resellers
```

## Tabel

### `profiles` (extend Supabase auth.users)
| kolom | tipe | catatan |
|---|---|---|
| id | uuid (=auth.uid) | pk |
| full_name | text | |
| phone | text | No WhatsApp |
| plan_id | fk packages | paket aktif |
| account_status | enum | `trial` / `active` / `expired` |
| plan_expires_at | timestamptz | |
| role | enum | `user` / `admin` / `reseller` |

### `packages`
| kolom | tipe | catatan |
|---|---|---|
| name | text | Free Trial / Non Foto / Dengan Foto |
| price | int | IDR |
| original_price | int | harga coret |
| theme_access | enum | `non_photo` / `photo` |
| duration_days | int | 2 / 180 / 365 |
| features | jsonb | daftar fitur (untuk display) |
| is_active | bool | |

### `categories`
| kolom | tipe | catatan |
|---|---|---|
| name | text | Pernikahan, dll |
| slug | text | |
| taxonomy | text | mis. `wds-pernikahan` |

### `themes`
| kolom | tipe | catatan |
|---|---|---|
| name | text | Minimalis - 01, Luxury - 03 |
| slug | text | unik, untuk demo `/tema/[slug]` |
| category_id | fk categories | |
| has_photo | bool | foto vs non-foto (kontrol akses paket) |
| thumbnail_url | text | |
| badge | enum null | `new` / `popular` |
| popularity | int | untuk sort "Populer" |
| component_key | text | id komponen render (lihat [05](05-rendering-engine.md)) |
| is_active | bool | |

### `invitations`
| kolom | tipe | catatan |
|---|---|---|
| user_id | fk profiles | |
| theme_id | fk themes | |
| title | text | "Putri & Putra" |
| slug | text | unik global → URL publik `/[slug]` |
| status | enum | `draft` / `active` / `expired` / `inactive` |
| expires_at | timestamptz | sesuai paket saat publish |
| published_at | timestamptz | |
| rsvp_protected | bool | proteksi lihat RSVP |

### `invitation_data` (1–1 dgn invitation, konten via jsonb terstruktur)
| kolom | tipe | catatan |
|---|---|---|
| invitation_id | fk invitations | unik |
| couple | jsonb | mempelai: nama, ortu, foto, sosmed |
| events | jsonb | array acara: nama, tanggal, jam, lokasi, maps |
| quotes | jsonb | ayat/kutipan |
| love_story | jsonb | timeline kisah |
| gallery | jsonb | array url foto |
| prewed_video_url | text | |
| music_url | text | lagu latar |
| livestream | jsonb | platform + link |
| gift | jsonb | rekening/e-wallet/alamat (amplop digital) |
| settings | jsonb | warna, opsi tampilan |

> `invitation_data` pakai jsonb untuk fleksibilitas konten antar-tema; tabel relasional dipakai untuk entitas yang di-query/agregasi (guests, rsvps, transactions).

### `guests`
| kolom | tipe | catatan |
|---|---|---|
| invitation_id | fk invitations | |
| name | text | nama tamu (untuk `?to=`) |
| token | text | slug tamu unik, opsional |
| group | text | keluarga/teman, opsional |

### `rsvps`
| kolom | tipe | catatan |
|---|---|---|
| invitation_id | fk invitations | |
| guest_id | fk guests null | jika dari tamu terdaftar |
| guest_name | text | nama pengirim |
| attendance | enum | `hadir` / `tidak` / `ragu` |
| headcount | int | jumlah orang |
| message | text | ucapan & doa |
| is_spam | bool | moderasi (replikasi commentpress) |

### `transactions`
| kolom | tipe | catatan |
|---|---|---|
| user_id | fk profiles | |
| package_id | fk packages | |
| invitation_id | fk invitations null | jika beli untuk undangan tertentu |
| amount | int | IDR |
| gateway | text | midtrans/xendit |
| gateway_ref | text | order id gateway |
| status | enum | `pending` / `paid` / `failed` / `expired` |
| paid_at | timestamptz | |
| reseller_id | fk resellers null | atribusi komisi |

### `resellers`
| kolom | tipe | catatan |
|---|---|---|
| user_id | fk profiles | |
| code | text | kode referral |
| commission_rate | numeric | |
| status | enum | `pending` / `active` |

## Catatan RLS (ringkas)
- `invitations`, `invitation_data`, `guests`: user hanya akses `user_id = auth.uid()`.
- `rsvps`: **insert** boleh anon (tamu), **select** hanya pemilik undangan.
- Halaman publik `/[slug]`: baca via RPC/view yang hanya mengembalikan data tampilan (tanpa kolom sensitif).
- `transactions`, `packages`, `themes`, `resellers`: tulis hanya admin/webhook; baca sesuai peran.
