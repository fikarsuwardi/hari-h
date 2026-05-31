# Fase 5a — Landing Page Marketing: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Halaman publik `/` (beranda marketing) yang menjual produk: hero + showcase tema + pricing + fitur + FAQ + footer, dengan CTA daftar. Indexable (SEO) + OG image statis.

**Architecture:** Server Components (RSC) merakit section. Showcase tema & pricing membaca dari Supabase (`themes`, `packages`, public read). FAQ pakai `<details>` native (tanpa JS). Tombol paket/CTA → `/register` (checkout = Fase 4, dilewati). Pakai design system Rukos (cream + brand hijau + Fraunces/Jakarta) — TIDAK meniru tampilan walimatul.

**Tech Stack:** Next.js 16 (RSC), Tailwind v4 (token Rukos), Supabase (read), Playwright.

**Prasyarat:** Fase 0–3. `themes` punya `minimalis-01` (active). `packages` baru ada "Free Trial" → Task 1 menambah 2 paket. Tema preview publik `/tema/[slug]` sudah ada.

---

## Keputusan & batasan
- Landing **indexable** (`robots: index`), beda dari dashboard/`[slug]` undangan (noindex).
- Pricing & showcase **dari DB** (bukan hardcode) agar konsisten dgn data nyata.
- Tombol "Pilih Paket" / "Buat Undangan" → `/register` (belum checkout; Fase 4).
- Copy ORIGINAL Bahasa Indonesia untuk brand "Hari-H". Tidak menyalin teks walimatul.
- Header publik: logo "Hari-H" + anchor (#tema, #harga, #faq) + tombol Masuk/Daftar. Tidak ada dashboard shell (root layout saja).
- "Tema" di nav = anchor ke section showcase (bukan halaman terpisah).

---

## File Structure
```
supabase/migrations/0005_seed_packages.sql   # seed paket Non Foto & Dengan Foto (idempoten)
app/page.tsx (replace)                         # rakit landing + metadata indexable
app/opengraph-image.tsx                        # OG statis beranda
components/marketing/site-header.tsx           # header publik (sticky)
components/marketing/site-footer.tsx           # footer
components/marketing/hero.tsx                   # hero
components/marketing/theme-showcase.tsx         # server: fetch themes -> grid
components/marketing/pricing.tsx                # server: fetch packages -> 3 kartu
components/marketing/features.tsx               # grid fitur (statis)
components/marketing/faq.tsx                     # accordion <details> (statis)
tests/e2e/landing.spec.ts
```

---

## Task 1: Seed paket berbayar

**Files:** `supabase/migrations/0005_seed_packages.sql`. Apply via psql (DSN dari controller; jangan commit).

- [ ] **Step 1: Migrasi (idempoten)**
```sql
-- Paket berbayar (Free Trial sudah di-seed Fase 0). Idempoten via not exists.
insert into packages (name, price, original_price, theme_access, duration_days, features)
select 'Non Foto', 49000, 98000, 'non_photo', 180,
  '["Akses semua tema non-foto","Aktif 6 bulan","RSVP & ucapan","Amplop digital","Hitung mundur"]'::jsonb
where not exists (select 1 from packages where name = 'Non Foto');

insert into packages (name, price, original_price, theme_access, duration_days, features)
select 'Dengan Foto', 99000, 198000, 'photo', 365,
  '["Akses semua tema dengan foto","Aktif 1 tahun","Galeri foto & prewed","RSVP & ucapan","Amplop digital","Hitung mundur"]'::jsonb
where not exists (select 1 from packages where name = 'Dengan Foto');
```

- [ ] **Step 2: Apply & verify**
Run: `PGCONNECT_TIMEOUT=10 psql "<dsn>" -v ON_ERROR_STOP=1 -f supabase/migrations/0005_seed_packages.sql`
Verify: `psql "<dsn>" -tAc "select name, price, duration_days from packages order by price;"` → 3 baris (Free Trial 0, Non Foto 49000, Dengan Foto 99000). Paste output.

- [ ] **Step 3: Commit** `feat: seed paid packages`

---

## Task 2: Header & footer publik

**Files:** `components/marketing/site-header.tsx`, `components/marketing/site-footer.tsx`.

- [ ] **Step 1: Header**
`components/marketing/site-header.tsx`:
```tsx
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-brand">Hari-H</Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-ink-2">
          <a href="#tema" className="hover:text-ink">Tema</a>
          <a href="#harga" className="hover:text-ink">Harga</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-ink-2 px-3 py-2">Masuk</Link>
          <Link href="/register" className="text-sm bg-brand text-white rounded-sm px-4 py-2">Daftar</Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Footer**
`components/marketing/site-footer.tsx`:
```tsx
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-2 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-xl text-brand">Hari-H</p>
          <p className="text-sm text-ink-3 mt-2 max-w-xs">Undangan pernikahan digital yang elegan, praktis, dan mudah dibagikan ke semua tamu.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">Navigasi</p>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><a href="#tema" className="hover:text-ink">Tema</a></li>
            <li><a href="#harga" className="hover:text-ink">Harga</a></li>
            <li><a href="#faq" className="hover:text-ink">FAQ</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">Mulai</p>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link href="/register" className="hover:text-ink">Daftar gratis</Link></li>
            <li><Link href="/login" className="hover:text-ink">Masuk</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-3">© 2026 Hari-H. Semua hak dilindungi.</div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit** `feat: add marketing header and footer`

---

## Task 3: Hero, Features, FAQ (statis)

**Files:** `components/marketing/hero.tsx`, `features.tsx`, `faq.tsx`.

- [ ] **Step 1: Hero**
`components/marketing/hero.tsx`:
```tsx
import Link from "next/link";

export function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Undangan Pernikahan Digital</p>
      <h1 className="font-display text-4xl md:text-6xl text-ink mt-4 leading-tight">Rayakan hari bahagia,<br />bagikan dengan mudah</h1>
      <p className="text-ink-2 mt-5 max-w-xl mx-auto">Buat undangan pernikahan digital yang elegan dalam hitungan menit. Pilih tema, isi data, bagikan tautannya — tamu cukup membuka satu link.</p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <Link href="/register" className="bg-brand text-white rounded-sm px-6 py-3 font-semibold">Buat Undangan</Link>
        <a href="#tema" className="border border-line-strong text-ink-2 rounded-sm px-6 py-3">Lihat Tema</a>
      </div>
      <p className="text-sm text-ink-3 mt-6">Gratis dicoba · Tanpa kartu kredit</p>
    </section>
  );
}
```

- [ ] **Step 2: Features**
`components/marketing/features.tsx`:
```tsx
const FEATURES = [
  ["Galeri Foto", "Pamerkan momen terbaik kalian."],
  ["Hitung Mundur", "Bangun antisipasi menuju hari-H."],
  ["Navigasi Lokasi", "Tamu langsung diarahkan ke peta."],
  ["Amplop Digital", "Terima hadiah lewat transfer & e-wallet."],
  ["RSVP & Ucapan", "Kumpulkan konfirmasi & doa tamu."],
  ["Musik Latar", "Suasana hangat sejak halaman dibuka."],
];

export function Features() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Semua yang kalian butuhkan</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        {FEATURES.map(([title, desc]) => (
          <div key={title} className="bg-card border border-line rounded p-6">
            <p className="font-semibold text-ink">{title}</p>
            <p className="text-sm text-ink-2 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: FAQ (native `<details>`, tanpa JS)**
`components/marketing/faq.tsx`:
```tsx
const FAQS = [
  ["Apakah ada masa coba gratis?", "Ya. Paket trial gratis aktif 2 hari — cukup daftar tanpa kartu kredit, isi data, dan lihat hasilnya secara langsung."],
  ["Berapa lama undangan saya aktif?", "Tergantung paket: paket berbayar aktif 6 bulan hingga 1 tahun sejak diaktifkan."],
  ["Apakah bisa ganti tema setelah dibuat?", "Bisa. Kamu dapat mengganti tema dan menyunting data kapan saja dari dashboard."],
  ["Bagaimana tamu membuka undangan?", "Cukup bagikan satu tautan. Tamu membukanya di browser tanpa perlu memasang aplikasi apa pun."],
  ["Apakah data undangan saya aman?", "Undangan hanya dapat diakses lewat tautan unik dan tidak diindeks mesin pencari."],
];

export function Faq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Pertanyaan Umum</h2>
      <div className="mt-8 space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="bg-card border border-line rounded p-4 group">
            <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
              {q}<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-ink-2 mt-3">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit** `feat: add hero, features, faq sections`

---

## Task 4: Showcase tema + Pricing (dari DB)

**Files:** `components/marketing/theme-showcase.tsx`, `components/marketing/pricing.tsx`.

- [ ] **Step 1: Theme showcase (server)**
`components/marketing/theme-showcase.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function ThemeShowcase() {
  const supabase = await createClient();
  const { data: themes } = await supabase
    .from("themes")
    .select("id, name, slug, thumbnail_url, badge, component_key, has_photo")
    .eq("is_active", true)
    .order("popularity", { ascending: false });
  return (
    <section id="tema" className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Pilihan Tema</h2>
      <p className="text-ink-2 text-center mt-2">Setiap tema mobile-first dan siap pakai.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
        {(themes ?? []).map((t) => (
          <Link key={t.id} href={`/tema/${t.component_key}`} target="_blank"
            className="bg-card border border-line rounded overflow-hidden shadow group">
            <div className="relative aspect-[3/4] bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail */}
              {t.thumbnail_url && <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
              {t.badge && <span className="absolute top-2 left-2 text-xs font-bold bg-brand text-white rounded-full px-2 py-0.5">{t.badge === "new" ? "New" : "Popular"}</span>}
            </div>
            <div className="p-3"><p className="font-semibold text-ink text-sm">{t.name}</p><p className="text-xs text-ink-3">Lihat pratinjau →</p></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Pricing (server)**
`components/marketing/pricing.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function rupiah(n: number) {
  return n === 0 ? "Gratis" : `Rp${n.toLocaleString("id-ID")}`;
}

export async function Pricing() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("id, name, price, original_price, duration_days, features")
    .eq("is_active", true)
    .order("price");
  return (
    <section id="harga" className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Harga yang Sederhana</h2>
      <p className="text-ink-2 text-center mt-2">Mulai gratis, upgrade kapan saja.</p>
      <div className="grid gap-5 md:grid-cols-3 mt-10">
        {(packages ?? []).map((p, i) => {
          const featured = i === (packages?.length ?? 0) - 1;
          const features = Array.isArray(p.features) ? (p.features as string[]) : [];
          return (
            <div key={p.id} className={`rounded-lg p-6 border ${featured ? "border-brand bg-brand-soft" : "border-line bg-card"}`}>
              <p className="font-display text-xl text-ink">{p.name}</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl text-ink">{rupiah(p.price)}</span>
                {p.original_price && p.price > 0 && <span className="text-sm text-ink-3 line-through">{rupiah(p.original_price)}</span>}
              </div>
              <p className="text-xs text-ink-3 mt-1">Aktif {p.duration_days} hari</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-2">
                {features.map((f) => (<li key={f} className="flex gap-2"><span className="text-pos">✓</span>{f}</li>))}
              </ul>
              <Link href="/register" className={`block text-center rounded-sm px-4 py-2.5 mt-6 font-semibold ${featured ? "bg-brand text-white" : "border border-line-strong text-ink-2"}`}>
                {p.price === 0 ? "Coba Gratis" : "Pilih Paket"}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit** `feat: add theme showcase and pricing sections`

---

## Task 5: Rakit beranda + SEO

**Files:** replace `app/page.tsx`; create `app/opengraph-image.tsx`.

- [ ] **Step 1: app/page.tsx**
```tsx
import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { ThemeShowcase } from "@/components/marketing/theme-showcase";
import { Pricing } from "@/components/marketing/pricing";
import { Features } from "@/components/marketing/features";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Hari-H — Undangan Pernikahan Digital Elegan & Praktis",
  description: "Buat undangan pernikahan digital yang elegan dalam hitungan menit. Pilih tema, isi data, bagikan satu tautan ke semua tamu. Gratis dicoba.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Hari-H — Undangan Pernikahan Digital",
    description: "Undangan pernikahan digital elegan, praktis, mudah dibagikan.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ThemeShowcase />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: OG beranda**
`app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Hari-H — Undangan Pernikahan Digital";

export default function Og() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fbf8f1", color: "#1b3a2f" }}>
        <div style={{ display: "flex", fontSize: 80, fontWeight: 700 }}>Hari-H</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 12, color: "#46544c" }}>Undangan Pernikahan Digital</div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 3: Verify** (dev server) — `/` menampilkan hero, section #tema (kartu tema), #harga (3 paket), #faq. `/` HTTP 200. `npm run build` + `npm run lint`. Commit `feat: assemble landing page with SEO metadata`.

---

## Task 6: E2E + verifikasi

**Files:** `tests/e2e/landing.spec.ts`.

- [ ] **Step 1: Test**
```ts
import { test, expect } from "@playwright/test";

test("beranda menampilkan hero + section utama", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Rayakan hari bahagia/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pilihan Tema" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Harga yang Sederhana" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pertanyaan Umum" })).toBeVisible();
});

test("CTA Daftar mengarah ke /register", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Daftar" }).first().click();
  await expect(page).toHaveURL(/\/register/);
});
```

- [ ] **Step 2: Run** `npm run test:e2e` → semua pass (2 baru + 8 lama = 10).
- [ ] **Step 3: Full check:** `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`.
- [ ] **Step 4: Commit** `test: add e2e for landing page`.

---

## Self-Review (penulis plan)

**Spec coverage (landing di `walimatul-home-analysis.md` + roadmap Fase 5):**
- Header + nav → Task 2 ✓
- Hero + CTA + trust badge → Task 3 ✓
- Showcase tema (dari DB) → Task 4 ✓
- Pricing 3 paket (dari DB) → Task 1 (seed) + Task 4 ✓
- Fitur umum → Task 3 ✓
- FAQ → Task 3 ✓
- Footer → Task 2 ✓
- SEO indexable + OG → Task 5 ✓

**Placeholder scan:** Tidak ada TODO menggantung. Checkout pembayaran sengaja → `/register` (Fase 4 dilewati, eksplisit). Filter Dengan-Foto/Non-Foto di showcase disederhanakan jadi grid+badge (filter bisa ditambah nanti).

**Type consistency:** Section server (`ThemeShowcase`, `Pricing`) memakai `createClient()` async + kolom yang ada (`themes`/`packages`). `packages.features` jsonb → `string[]` (guard `Array.isArray`). Anchor id (`#tema`,`#harga`,`#faq`) cocok antara header/footer/section.

**Catatan:** Landing memakai token Rukos (paper/brand/ink) — konsisten dgn dashboard, identitas beda dari walimatul. Tombol paket belum checkout (Fase 4).
