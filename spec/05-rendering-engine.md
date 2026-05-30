# 05 — Mesin Render Undangan (Template Data-Driven)

## Prinsip

Tema = **komponen React siap pakai**, bukan layout yang dibangun user. User hanya mengisi **data** (mempelai, acara, foto, dst). Satu data undangan bisa dirender oleh tema mana pun karena semua tema membaca **kontrak data yang sama**.

```
invitation_data (sumber data tunggal)
        │
        ▼
  <ThemeRenderer themeKey={...} data={...} />
        │
        ├─ themes/minimalis-01/  (komponen + style)
        ├─ themes/luxury-03/
        ├─ themes/floral-05/
        └─ ...
```

## Kontrak Data (TypeScript-ish)

Semua tema menerima props bertipe sama:

```ts
type InvitationData = {
  couple: {
    groom: Person; bride: Person;
  };
  events: Event[];              // akad, resepsi
  quotes?: { text: string; source?: string };
  loveStory?: StoryItem[];
  gallery?: string[];           // url foto
  prewedVideoUrl?: string;
  musicUrl?: string;
  livestream?: { platform: string; url: string };
  gift?: GiftAccount[];         // amplop digital
  settings?: { primaryColor?: string; ... };
  guestName?: string;           // dari ?to=
};
```

> `has_photo=false` → renderer mengabaikan blok foto/galeri/prewed (sesuai paket non-foto).

## Struktur Satu Tema

```
themes/minimalis-01/
  index.tsx        // komponen utama, menerima InvitationData
  sections/        // Cover, Couple, Events, Countdown, Gallery, RSVP, Gift, Footer
  styles.module.css
  meta.ts          // { key, name, hasPhoto, category, thumbnail }
```

Tema dipetakan via registry:
```ts
// themes/registry.ts
export const THEMES = {
  'minimalis-01': () => import('./minimalis-01'),
  'luxury-03':    () => import('./luxury-03'),
  // ...
};
```
`themes.component_key` di DB menunjuk ke key ini → lazy import sesuai tema undangan.

## Section Standar (semua tema mengimplementasikan, gaya beda)

Cover (nama + `?to=` tamu) · Pembuka/Quotes · Mempelai · Acara + Countdown · Lokasi/Maps · Love Story · Galeri · Video Prewed · Amplop Digital · Live Streaming · RSVP & Ucapan · Penutup + Musik control.

Tema boleh menyembunyikan section yang datanya kosong.

## Halaman Publik `/[slug]`

```
1. SSR: ambil invitation + invitation_data + theme by slug (RPC, kolom aman).
2. Jika status != active atau expired → tampilkan halaman "tidak aktif".
3. Render <ThemeRenderer> (RSC) → HTML.
4. ISR cache per-slug; revalidateTag(slug) saat user edit/publish.
5. Param ?to=<nama> diisi ke cover (tidak disimpan; murni tampilan).
```

## OG Image Dinamis (`/api/og/[slug]`)

- `@vercel/og` / Satori → generate gambar (judul + nama mempelai + tanggal + foto cover).
- Halaman publik set `<meta og:image>` ke URL ini → preview rapi saat share di WhatsApp.

## Preview Live di Editor

Editor render `<ThemeRenderer data={draftData} />` dalam iframe/panel; data draft belum tersimpan permanen. Tombol simpan → upsert `invitation_data`.

## Kenapa data-driven (bukan page builder)

- Konsisten dengan produk asli (user pilih tema, isi data).
- Tema baru = tambah folder + daftar di registry (skalabel).
- Hindari kompleksitas drag-drop (lihat "Won't" di [04](04-features.md)).
