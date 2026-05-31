# Fase 5c — Tema Baru: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps pakai checkbox `- [ ]`.

**Goal:** Menambah **2 tema undangan baru** dengan estetika berbeda dari Minimalis-01, terdaftar di registry + galeri (showcase landing + dashanaboard), sehingga user punya pilihan.

**Architecture:** Tiap tema = folder `themes/<key>/` dengan `index.tsx` (default export `({view, guestName})`) yang merangkai section bergaya tema itu, MEMBACA kontrak data `InvitationData` yang sama, dan MEMAKAI ULANG komponen tamu bersama (`Countdown`, `MusicToggle`, `CopyButton`, `RsvpSection`). Didaftarkan di `lib/invitation/registry.ts`. Baris DB di-seed (component_key cocok). Desain ORIGINAL (bukan menyalin walimatul).

**Tech Stack:** Next.js 16 (RSC + client UI), CSS Modules, Supabase (seed).

**Prasyarat:** Fase 1–3, 5a–5b. Pola referensi: `themes/minimalis-01/{index,sections,styles.module.css}.tsx`. Shared client UI di `components/invitation/ui/`. `lib/invitation/types.ts` (`InvitationData`). Registry `THEMES`.

---

## Tema yang dibuat
1. **`elegan-01` — "Elegan"** (mewah, gelap-hangat): latar `#1d1a17` (espresso), teks krem `#efe7d9`, aksen emas `#c2a878`, heading serif Fraunces besar dengan letter-spacing, divider emas tipis, kartu transparan border emas. Nuansa malam/formal.
2. **`floral-01` — "Floral"** (lembut romantis, terang): latar `#fbf5f3` (blush), teks `#4a3b3b`, aksen rose `#c98a86` + sage `#8aa07c`, heading Fraunces italic, ornamen pemisah bunga (karakter ❀ / garis lengkung CSS), kartu putih lembut.

> Kedua tema WAJIB mengimplementasikan section yang sama seperti Minimalis-01: Cover (nama + tamu), Quote, Mempelai, Acara + Countdown, Galeri (jika ada), Amplop Digital, **RSVP (RsvpSection)**, Penutup, + MusicToggle bila `musicUrl`. Section disembunyikan bila datanya kosong (ikuti pola minimalis-01).

---

## File Structure
```
themes/elegan-01/{meta.ts,styles.module.css,sections.tsx,index.tsx}
themes/floral-01/{meta.ts,styles.module.css,sections.tsx,index.tsx}
lib/invitation/registry.ts (modify)        # daftarkan 2 tema
supabase/migrations/0008_seed_themes.sql    # seed baris DB themes
tests/e2e/themes.spec.ts
```

---

## Task 1: Tema "Elegan" (elegan-01)

**Files:** `themes/elegan-01/{meta.ts,styles.module.css,sections.tsx,index.tsx}`.

- [ ] **Step 1:** Buat folder tema mengikuti STRUKTUR `themes/minimalis-01/` (baca file itu sebagai referensi pola: `index.tsx` merangkai section, `sections.tsx` mengekspor Cover/QuoteSection/CoupleSection/EventsSection/GallerySection/GiftSection/Closing, `styles.module.css` berisi gaya). 
  - `meta.ts`: `export const meta = { key: "elegan-01", name: "Elegan", hasPhoto: true };` (catatan: meta tidak wajib diimpor, tapi sertakan untuk dokumentasi).
  - Default export `index.tsx`: `export default function Elegan01({ view, guestName }: { view: InvitationView; guestName?: string })` — rangkai: Cover → QuoteSection → CoupleSection → EventsSection → GallerySection → GiftSection → `<RsvpSection slug={view.slug} guestName={guestName} />` → Closing → `{data.musicUrl && <MusicToggle src={data.musicUrl} />}`.
  - Pakai `Countdown` di EventsSection, `CopyButton` di GiftSection (impor dari `@/components/invitation/ui/...`).
  - **Estetika Elegan** (lihat deskripsi di atas): latar espresso `#1d1a17`, teks krem `#efe7d9`, aksen emas `#c2a878`, Fraunces untuk heading. Layout terpusat max-width ~480px, mobile-first. Kontras teks cukup (krem di atas gelap).
  - Reuse data contract: `view.data.couple.{groom,bride}`, `events[]`, `quotes?`, `gallery[]`, `gift?`, dst. Sembunyikan section bila kosong (mis. `if (!data.gallery.length) return null`).
- [ ] **Step 2:** `npm run build` + `npm run lint` (gambar `<img>` butuh eslint-disable seperti minimalis-01). Belum dirender ke halaman (registry Task 3).
- [ ] **Step 3: Commit** `feat: add Elegan (elegan-01) theme`

---

## Task 2: Tema "Floral" (floral-01)

**Files:** `themes/floral-01/{meta.ts,styles.module.css,sections.tsx,index.tsx}`.

- [ ] **Step 1:** Sama seperti Task 1 tapi estetika **Floral** (blush `#fbf5f3`, teks `#4a3b3b`, aksen rose `#c98a86` + sage `#8aa07c`, Fraunces italic untuk display, pemisah ornamen bunga). Struktur section identik (termasuk `RsvpSection`). `meta.key = "floral-01"`, name "Floral", hasPhoto true.
- [ ] **Step 2:** build + lint.
- [ ] **Step 3: Commit** `feat: add Floral (floral-01) theme`

---

## Task 3: Daftarkan di registry + seed DB

**Files:** `lib/invitation/registry.ts` (modify), `supabase/migrations/0008_seed_themes.sql`.

- [ ] **Step 1: Registry** — tambah ke `THEMES`:
```ts
export const THEMES: Record<string, () => Promise<{ default: ThemeComponent }>> = {
  "minimalis-01": () => import("@/themes/minimalis-01"),
  "elegan-01": () => import("@/themes/elegan-01"),
  "floral-01": () => import("@/themes/floral-01"),
};
```
(`THEME_KEYS` otomatis ikut karena `Object.keys(THEMES)`.)

- [ ] **Step 2: Seed DB** `supabase/migrations/0008_seed_themes.sql` (idempoten):
```sql
insert into themes (name, slug, category_id, has_photo, component_key, badge, popularity, is_active)
select 'Elegan', 'elegan-01', c.id, true, 'elegan-01', 'new', 8, true
from categories c where c.slug = 'pernikahan'
on conflict (slug) do nothing;

insert into themes (name, slug, category_id, has_photo, component_key, badge, popularity, is_active)
select 'Floral', 'floral-01', c.id, true, 'floral-01', 'new', 7, true
from categories c where c.slug = 'pernikahan'
on conflict (slug) do nothing;
```
Apply via psql (DSN dari controller). Verify: `select name, component_key from themes order by name;` → ada Elegan & Floral. Paste output.

- [ ] **Step 3: Commit** `feat: register and seed Elegan and Floral themes`

---

## Task 4: E2E + verifikasi

**Files:** `tests/e2e/themes.spec.ts`.

- [ ] **Step 1: Test** preview tiap tema render (pakai sample data via `/tema/<key>`):
```ts
import { test, expect } from "@playwright/test";

for (const key of ["minimalis-01", "elegan-01", "floral-01"]) {
  test(`tema ${key} preview render`, async ({ page }) => {
    await page.goto(`/tema/${key}`);
    await expect(page.getByText("Rama", { exact: false })).toBeVisible(); // sampleView couple groom
  });
}
```
- [ ] **Step 2: Run** `npm run test:e2e` → semua pass (3 baru + 11 lama = 14).
- [ ] **Step 3: Verifikasi controller (live):** buka `/tema/elegan-01` dan `/tema/floral-01` → render dengan estetika masing-masing; cek galeri showcase landing `/` menampilkan 3 tema. Paste bukti (curl grep nama tema di `/`).
- [ ] **Step 4: Full check:** lint, test, build, test:e2e hijau.
- [ ] **Step 5: Commit** `test: add e2e for theme previews`

---

## Self-Review (penulis plan)

**Spec coverage:** Roadmap Fase 5 "tambah tema (Luxury/Floral/Art)" → 2 tema baru (Elegan + Floral) ✓. Pola data-driven dipertahankan (kontrak `InvitationData` sama, registry, seed) ✓.

**Placeholder scan:** Kode tema (sections/styles) digenerate implementer mengikuti pola lengkap `minimalis-01` + spec estetika eksplisit per tema — bukan placeholder, melainkan pekerjaan UI generatif dengan acuan konkret. Registry & seed diberi kode penuh.

**Type consistency:** Default export tiap tema `({view, guestName})` cocok `ThemeComponent`. `RsvpSection`/`Countdown`/`MusicToggle`/`CopyButton` diimpor dari path yang sama. `component_key` DB == key registry == folder name. `THEME_KEYS` (dipakai admin) otomatis mencakup tema baru.

**Catatan:** Tema baru otomatis muncul di galeri (dashboard create + showcase landing) karena keduanya membaca `themes` dari DB. Admin bisa atur badge/popularity/aktif via panel (Fase 5b).
