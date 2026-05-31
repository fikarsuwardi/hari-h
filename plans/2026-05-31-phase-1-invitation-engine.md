# Fase 1 — Mesin Undangan: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Satu undangan bisa dirender dari data dan dibagikan: halaman publik `/[slug]` (SSR) yang menampilkan tema dari data, plus OG image dinamis untuk preview share WhatsApp.

**Architecture:** Tema = komponen React yang membaca satu **kontrak data** (`InvitationData`). `ThemeRenderer` memilih tema via registry berdasarkan `component_key`. Halaman publik mengambil data lewat **Postgres RPC `get_public_invitation` (security definer)** yang hanya mengembalikan undangan berstatus `active` + kolom tampilan (data privat seperti daftar tamu tidak ikut). OG image via konvensi `opengraph-image.tsx` Next 16 (`next/og`).

**Tech Stack:** Next.js 16 (App Router, RSC), Supabase Postgres (RPC), `next/og` (ImageResponse), Zod (validasi bentuk data), Vitest, Playwright.

**Referensi:** `../spec/05-rendering-engine.md`, `../spec/03-data-model.md`, `../spec/07-design-system.md` (catatan: tema undangan punya estetika sendiri, tidak terikat token dashboard).

**Prasyarat (sudah ada dari Fase 0):** tabel `invitations`, `invitation_data`, `themes`, `categories`; `createClient()` server; design fonts (Fraunces/Jakarta) ter-load global.

---

## Catatan desain & keputusan
- **Tema Minimalis-01 didesain ulang dari nol** (estetika sendiri: ivory `#faf6ef`, teks `#2b2b2b`, aksen sage `#7c8b78`, serif Fraunces + sans Jakarta). TIDAK menyalin aset/markup walimatul (berlisensi).
- **Routing:** `app/[slug]` dinamis di root. Route literal (`/login`, `/register`, `/dashboard`, `/lost-password`, `/api/*`) menang atas `[slug]`, jadi tidak bentrok. Slug undangan WAJIB di-blocklist terhadap kata tercadang saat dibuat (Fase 2) — dicatat, bukan diimplementasi di sini.
- **RSVP belum** di Fase 1 (Fase 3). Tema disusun agar section RSVP mudah ditambah.
- **Caching:** Fase 1 render dinamis (SSR) + `unstable_cache` ber-tag `invitation:<slug>`. Revalidasi saat edit di-wire di Fase 2. ISR penuh menyusul.
- **Data privat:** RPC TIDAK mengembalikan kolom sensitif; tidak menambah anon SELECT policy ke `invitation_data` (sesuai temuan review Fase 0).

---

## File Structure (dibuat di fase ini)

```
lib/invitation/
  types.ts            # kontrak data InvitationData + InvitationView
  schema.ts           # Zod schema untuk memvalidasi InvitationData (defensif)
  registry.ts         # map component_key -> dynamic import tema
  get-public.ts       # fetch undangan publik via RPC (server, cached per-slug)
components/invitation/
  theme-renderer.tsx  # pilih & render tema sesuai themeKey
  ui/
    countdown.tsx     # 'use client' — hitung mundur
    music-toggle.tsx  # 'use client' — kontrol audio latar
    copy-button.tsx   # 'use client' — salin no. rekening
themes/minimalis-01/
  index.tsx           # komponen tema utama (RSC) — merangkai section
  meta.ts             # { key, name, hasPhoto }
  sections.tsx        # Cover, Quote, Couple, Events, Gallery, Gift, Closing (RSC)
  styles.module.css   # gaya tema (scoped)
app/[slug]/
  page.tsx            # halaman publik undangan
  opengraph-image.tsx # OG image dinamis
  not-found.tsx       # tampilan undangan tidak ditemukan/non-aktif
supabase/migrations/
  0002_public_invitation.sql  # RPC get_public_invitation + seed demo
tests/unit/
  invitation-schema.test.ts
tests/e2e/
  public-invitation.spec.ts
```

---

## Task 1: Kontrak data + Zod schema (TDD)

**Files:** create `lib/invitation/types.ts`, `lib/invitation/schema.ts`; test `tests/unit/invitation-schema.test.ts`.

- [ ] **Step 1: Tulis failing test**

`tests/unit/invitation-schema.test.ts`:
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { invitationDataSchema } from "@/lib/invitation/schema";

const valid = {
  couple: {
    groom: { name: "Putra" },
    bride: { name: "Putri" },
  },
  events: [
    { name: "Akad", date: "2026-09-01", startTime: "08:00", venue: "Masjid Agung" },
  ],
};

describe("invitationDataSchema", () => {
  it("accepts minimal valid data and applies defaults", () => {
    const r = invitationDataSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.gallery).toEqual([]);
      expect(r.data.events).toHaveLength(1);
    }
  });
  it("rejects when couple names missing", () => {
    const r = invitationDataSchema.safeParse({ events: [] });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `npm run test -- invitation-schema`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement types**

`lib/invitation/types.ts`:
```ts
export type Person = {
  name: string;
  fullName?: string;
  photoUrl?: string;
  parents?: string;
  instagram?: string;
};

export type EventItem = {
  name: string;
  date: string; // ISO yyyy-mm-dd
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  mapsUrl?: string;
};

export type StoryItem = { title: string; date?: string; text: string };
export type GiftAccount = {
  type: "bank" | "ewallet";
  bank?: string;
  number: string;
  holder: string;
};

export type InvitationData = {
  couple: { groom: Person; bride: Person };
  events: EventItem[];
  quotes?: { text: string; source?: string };
  loveStory?: StoryItem[];
  gallery: string[];
  prewedVideoUrl?: string;
  musicUrl?: string;
  livestream?: { platform: string; url: string };
  gift?: GiftAccount[];
  settings?: { primaryColor?: string };
};

export type InvitationView = {
  title: string;
  slug: string;
  themeKey: string;
  data: InvitationData;
};
```

- [ ] **Step 4: Implement schema**

`lib/invitation/schema.ts`:
```ts
import { z } from "zod";

const personSchema = z.object({
  name: z.string().min(1),
  fullName: z.string().optional(),
  photoUrl: z.string().optional(),
  parents: z.string().optional(),
  instagram: z.string().optional(),
});

const eventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  mapsUrl: z.string().optional(),
});

export const invitationDataSchema = z.object({
  couple: z.object({ groom: personSchema, bride: personSchema }),
  events: z.array(eventSchema).default([]),
  quotes: z.object({ text: z.string(), source: z.string().optional() }).optional(),
  loveStory: z
    .array(z.object({ title: z.string(), date: z.string().optional(), text: z.string() }))
    .optional(),
  gallery: z.array(z.string()).default([]),
  prewedVideoUrl: z.string().optional(),
  musicUrl: z.string().optional(),
  livestream: z.object({ platform: z.string(), url: z.string() }).optional(),
  gift: z
    .array(
      z.object({
        type: z.enum(["bank", "ewallet"]),
        bank: z.string().optional(),
        number: z.string(),
        holder: z.string(),
      }),
    )
    .optional(),
  settings: z.object({ primaryColor: z.string().optional() }).optional(),
});
```

- [ ] **Step 5: Run, expect pass**

Run: `npm run test -- invitation-schema`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/invitation/types.ts lib/invitation/schema.ts tests/unit/invitation-schema.test.ts
git commit -m "feat: add invitation data contract and zod schema"
```

---

## Task 2: RPC publik + seed demo undangan

**Files:** create `supabase/migrations/0002_public_invitation.sql`.

Apply via psql (controller menyediakan connection string saat eksekusi; JANGAN commit string itu).

- [ ] **Step 1: Tulis migrasi**

`supabase/migrations/0002_public_invitation.sql`:
```sql
-- RPC: kembalikan undangan publik (hanya status 'active') + data tampilan + theme key.
-- security definer agar bisa baca meski RLS invitation_data owner-only.
create or replace function public.get_public_invitation(p_slug text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'title', i.title,
    'slug', i.slug,
    'themeKey', t.component_key,
    'data', coalesce(d.couple, '{}'::jsonb) is not null and false or null
  )
  from invitations i
  join themes t on t.id = i.theme_id
  left join invitation_data d on d.invitation_id = i.id
  where i.slug = p_slug and i.status = 'active'
  limit 1;
$$;
```
> CATATAN IMPLEMENTER: bentuk `data` di atas harus berisi seluruh field tampilan. Ganti ekspresi `'data'` menjadi objek yang menyusun ulang `invitation_data` ke bentuk kamelCase kontrak `InvitationData`. Implementasi yang benar:
```sql
create or replace function public.get_public_invitation(p_slug text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'title', i.title,
    'slug', i.slug,
    'themeKey', t.component_key,
    'data', json_build_object(
      'couple', coalesce(d.couple, '{}'::jsonb),
      'events', coalesce(d.events, '[]'::jsonb),
      'quotes', d.quotes,
      'loveStory', d.love_story,
      'gallery', coalesce(d.gallery, '[]'::jsonb),
      'prewedVideoUrl', d.prewed_video_url,
      'musicUrl', d.music_url,
      'livestream', d.livestream,
      'gift', d.gift,
      'settings', coalesce(d.settings, '{}'::jsonb)
    )
  )
  from invitations i
  join themes t on t.id = i.theme_id
  left join invitation_data d on d.invitation_id = i.id
  where i.slug = p_slug and i.status = 'active'
  limit 1;
$$;

grant execute on function public.get_public_invitation(text) to anon, authenticated;
```
(Gunakan HANYA versi kedua. Hapus/abaikan versi pertama — itu hanya ilustrasi yang salah.)

- [ ] **Step 2: Seed tema minimalis-01 + undangan demo**

Tambahkan di file migrasi yang sama, setelah fungsi:
```sql
-- Tema minimalis-01 (component_key dipakai registry)
insert into themes (name, slug, category_id, has_photo, component_key, badge, popularity, is_active)
select 'Minimalis - 01', 'minimalis-01', c.id, true, 'minimalis-01', 'new', 10, true
from categories c where c.slug = 'pernikahan'
on conflict (slug) do nothing;

-- Undangan demo (butuh user pemilik; pakai user pertama jika ada, else lewati).
-- Implementer: jika belum ada user, buat satu lewat signUp test, atau sisipkan via SQL.
```
> CATATAN IMPLEMENTER untuk seed undangan demo: `invitations.user_id` NOT NULL ref `profiles`. Untuk membuat demo yang bisa diakses publik, buat satu user demo (via `supabase.auth.signUp` memakai anon client + env, ATAU `insert into auth.users` lewat SQL) lalu sisipkan invitation (`status='active'`, slug `andi-dan-sari`) + invitation_data berisi konten contoh (2 event: Akad & Resepsi 2026-09-01, couple Putra/Putri, gift 1 rekening, gallery []). Simpan langkah seed ini sebagai skrip SQL idempoten di akhir file migrasi memakai sub-select untuk `user_id` (mis. `(select id from profiles limit 1)`), dan JANGAN hardcode UUID. Jika tak ada profile, skrip seed harus no-op aman.

- [ ] **Step 3: Terapkan migrasi (psql)**

Run (controller memberi `<dsn>`): `PGCONNECT_TIMEOUT=10 psql "<dsn>" -v ON_ERROR_STOP=1 -f supabase/migrations/0002_public_invitation.sql`
Lalu pastikan ada user/profile demo dan undangan `andi-dan-sari` berstatus active.

- [ ] **Step 4: Verifikasi RPC**

Run: `PGCONNECT_TIMEOUT=10 psql "<dsn>" -tAc "select public.get_public_invitation('andi-dan-sari');"`
Expected: JSON berisi `title`, `themeKey`='minimalis-01', dan `data.couple.groom.name`. Tempel output di laporan.

- [ ] **Step 5: Commit** (tanpa dsn)

```bash
git add supabase/migrations/0002_public_invitation.sql
git commit -m "feat: add public invitation RPC and demo seed"
```

---

## Task 3: Registry + ThemeRenderer + fetch publik

**Files:** create `lib/invitation/registry.ts`, `lib/invitation/get-public.ts`, `components/invitation/theme-renderer.tsx`.

- [ ] **Step 1: Registry**

`lib/invitation/registry.ts`:
```ts
import type { ComponentType } from "react";
import type { InvitationView } from "./types";

export type ThemeComponent = ComponentType<{ view: InvitationView; guestName?: string }>;

// Map component_key -> dynamic import default export.
export const THEMES: Record<string, () => Promise<{ default: ThemeComponent }>> = {
  "minimalis-01": () => import("@/themes/minimalis-01"),
};

export function isKnownTheme(key: string): boolean {
  return key in THEMES;
}
```

- [ ] **Step 2: Fetch publik (cached per-slug)**

`lib/invitation/get-public.ts`:
```ts
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invitationDataSchema } from "./schema";
import type { InvitationView } from "./types";

async function fetchRaw(slug: string): Promise<InvitationView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_invitation", { p_slug: slug });
  if (error || !data) return null;
  const row = data as { title: string; slug: string; themeKey: string; data: unknown };
  const parsed = invitationDataSchema.safeParse(row.data);
  if (!parsed.success) return null;
  return { title: row.title, slug: row.slug, themeKey: row.themeKey, data: parsed.data };
}

export async function getPublicInvitation(slug: string): Promise<InvitationView | null> {
  const cached = unstable_cache(() => fetchRaw(slug), ["invitation", slug], {
    tags: [`invitation:${slug}`],
    revalidate: 300,
  });
  return cached();
}
```

- [ ] **Step 3: ThemeRenderer**

`components/invitation/theme-renderer.tsx`:
```tsx
import { THEMES, isKnownTheme } from "@/lib/invitation/registry";
import type { InvitationView } from "@/lib/invitation/types";

export async function ThemeRenderer({
  view,
  guestName,
}: {
  view: InvitationView;
  guestName?: string;
}) {
  if (!isKnownTheme(view.themeKey)) {
    return <div className="p-10 text-center">Tema tidak ditemukan.</div>;
  }
  const mod = await THEMES[view.themeKey]();
  const Theme = mod.default;
  return <Theme view={view} guestName={guestName} />;
}
```

- [ ] **Step 4: Verifikasi build** (tema belum ada → buat stub sementara agar import tidak gagal? TIDAK perlu: Task 4 membuat tema sebelum Task 5 memakai halaman. Jalankan build SETELAH Task 4.)

- [ ] **Step 5: Commit**

```bash
git add lib/invitation/registry.ts lib/invitation/get-public.ts components/invitation/theme-renderer.tsx
git commit -m "feat: add theme registry, cached public fetch, theme renderer"
```

---

## Task 4: Tema Minimalis-01 (desain orisinal)

**Files:** create `themes/minimalis-01/meta.ts`, `themes/minimalis-01/styles.module.css`, `themes/minimalis-01/sections.tsx`, `themes/minimalis-01/index.tsx`, dan client UI `components/invitation/ui/{countdown,music-toggle,copy-button}.tsx`.

Estetika: ivory `#faf6ef`, ink `#2b2b2b`, sage `#7c8b78`, heading Fraunces, body Jakarta, layout terpusat max-width ~480px (mobile-first, undangan dibuka di HP).

- [ ] **Step 1: Client UI — countdown**

`components/invitation/ui/countdown.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

export function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const items: [string, number][] = [["Hari", t.d], ["Jam", t.h], ["Menit", t.m], ["Detik", t.s]];
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {items.map(([label, v]) => (
        <div key={label} style={{ textAlign: "center", minWidth: 56 }}>
          <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 28 }}>{String(v).padStart(2, "0")}</div>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: .7 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Client UI — music toggle**

`components/invitation/ui/music-toggle.tsx`:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function MusicToggle({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = 0.6;
  }, []);
  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  }
  return (
    <>
      <audio ref={ref} src={src} loop />
      <button
        onClick={toggle}
        aria-label="Putar musik"
        style={{
          position: "fixed", right: 16, bottom: 16, width: 44, height: 44,
          borderRadius: 999, border: "none", background: "#7c8b78", color: "#fff",
          cursor: "pointer", zIndex: 50,
        }}
      >
        {playing ? "♪" : "▶"}
      </button>
    </>
  );
}
```

- [ ] **Step 3: Client UI — copy button**

`components/invitation/ui/copy-button.tsx`:
```tsx
"use client";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <button onClick={copy} style={{ border: "1px solid #7c8b78", background: "transparent", color: "#7c8b78", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>
      {done ? "Disalin!" : "Salin"}
    </button>
  );
}
```

- [ ] **Step 4: meta + styles**

`themes/minimalis-01/meta.ts`:
```ts
export const meta = { key: "minimalis-01", name: "Minimalis - 01", hasPhoto: true };
```
`themes/minimalis-01/styles.module.css`:
```css
.root { max-width: 480px; margin: 0 auto; background: #faf6ef; color: #2b2b2b; font-family: var(--font-jakarta), sans-serif; }
.section { padding: 56px 24px; text-align: center; }
.kicker { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #7c8b78; }
.display { font-family: var(--font-fraunces), serif; font-size: 40px; line-height: 1.1; margin: 8px 0; }
.h2 { font-family: var(--font-fraunces), serif; font-size: 26px; margin: 0 0 4px; }
.muted { color: #6b6b6b; }
.divider { width: 48px; height: 1px; background: #cdbfa8; margin: 20px auto; }
.card { background: #fff; border: 1px solid #ece2cf; border-radius: 16px; padding: 20px; }
.gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.gallery img { width: 100%; height: 140px; object-fit: cover; border-radius: 10px; }
.cover { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
```

- [ ] **Step 5: sections.tsx**

`themes/minimalis-01/sections.tsx`:
```tsx
import type { InvitationData } from "@/lib/invitation/types";
import { Countdown } from "@/components/invitation/ui/countdown";
import { CopyButton } from "@/components/invitation/ui/copy-button";
import s from "./styles.module.css";

export function Cover({ data, title, guestName }: { data: InvitationData; title: string; guestName?: string }) {
  const { groom, bride } = data.couple;
  return (
    <section className={`${s.section} ${s.cover}`}>
      <p className={s.kicker}>The Wedding Of</p>
      <h1 className={s.display}>{groom.name} &amp; {bride.name}</h1>
      {data.events[0]?.date && <p className={s.muted}>{formatDate(data.events[0].date)}</p>}
      <div className={s.divider} />
      {guestName && (
        <div>
          <p className={s.kicker}>Kepada Yth.</p>
          <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20 }}>{guestName}</p>
        </div>
      )}
    </section>
  );
}

export function QuoteSection({ data }: { data: InvitationData }) {
  if (!data.quotes) return null;
  return (
    <section className={s.section}>
      <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20, fontStyle: "italic" }}>&ldquo;{data.quotes.text}&rdquo;</p>
      {data.quotes.source && <p className={s.muted} style={{ marginTop: 8 }}>— {data.quotes.source}</p>}
    </section>
  );
}

export function CoupleSection({ data }: { data: InvitationData }) {
  const people = [data.couple.groom, data.couple.bride];
  return (
    <section className={s.section}>
      <p className={s.kicker}>Mempelai</p>
      <div className={s.divider} />
      <div style={{ display: "grid", gap: 24 }}>
        {people.map((p, i) => (
          <div key={i}>
            {p.photoUrl && <img src={p.photoUrl} alt={p.name} style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 999, margin: "0 auto 12px" }} />}
            <h2 className={s.h2}>{p.fullName ?? p.name}</h2>
            {p.parents && <p className={s.muted}>{p.parents}</p>}
            {p.instagram && <p className={s.muted}>@{p.instagram}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EventsSection({ data }: { data: InvitationData }) {
  if (!data.events.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Acara</p>
      <div className={s.divider} />
      <div style={{ display: "grid", gap: 16 }}>
        {data.events.map((e, i) => (
          <div key={i} className={s.card}>
            <h2 className={s.h2}>{e.name}</h2>
            <p className={s.muted}>{formatDate(e.date)}{e.startTime ? `, ${e.startTime}` : ""}{e.endTime ? `–${e.endTime}` : ""}</p>
            {e.venue && <p style={{ marginTop: 6 }}>{e.venue}</p>}
            {e.address && <p className={s.muted} style={{ fontSize: 14 }}>{e.address}</p>}
            {e.mapsUrl && <a href={e.mapsUrl} target="_blank" rel="noopener" style={{ color: "#7c8b78", display: "inline-block", marginTop: 8 }}>Lihat Peta →</a>}
          </div>
        ))}
      </div>
      {data.events[0]?.date && (
        <div style={{ marginTop: 24 }}>
          <Countdown iso={`${data.events[0].date}T${data.events[0].startTime ?? "08:00"}:00`} />
        </div>
      )}
    </section>
  );
}

export function GallerySection({ data }: { data: InvitationData }) {
  if (!data.gallery.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Galeri</p>
      <div className={s.divider} />
      <div className={s.gallery}>
        {data.gallery.map((url, i) => (<img key={i} src={url} alt={`Galeri ${i + 1}`} />))}
      </div>
    </section>
  );
}

export function GiftSection({ data }: { data: InvitationData }) {
  if (!data.gift?.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Amplop Digital</p>
      <div className={s.divider} />
      <div style={{ display: "grid", gap: 12 }}>
        {data.gift.map((g, i) => (
          <div key={i} className={s.card}>
            <p style={{ fontWeight: 600 }}>{g.bank ?? (g.type === "ewallet" ? "E-Wallet" : "Bank")}</p>
            <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20, letterSpacing: ".05em" }}>{g.number}</p>
            <p className={s.muted} style={{ fontSize: 14 }}>a.n. {g.holder}</p>
            <div style={{ marginTop: 8 }}><CopyButton value={g.number} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Closing({ data }: { data: InvitationData }) {
  const { groom, bride } = data.couple;
  return (
    <section className={s.section}>
      <p className={s.muted}>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.</p>
      <div className={s.divider} />
      <h2 className={s.h2}>{groom.name} &amp; {bride.name}</h2>
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
```

- [ ] **Step 6: index.tsx (rangkai)**

`themes/minimalis-01/index.tsx`:
```tsx
import type { InvitationView } from "@/lib/invitation/types";
import { MusicToggle } from "@/components/invitation/ui/music-toggle";
import { Cover, QuoteSection, CoupleSection, EventsSection, GallerySection, GiftSection, Closing } from "./sections";
import s from "./styles.module.css";

export default function MinimalisO1({ view, guestName }: { view: InvitationView; guestName?: string }) {
  const { data, title } = view;
  return (
    <main className={s.root}>
      <Cover data={data} title={title} guestName={guestName} />
      <QuoteSection data={data} />
      <CoupleSection data={data} />
      <EventsSection data={data} />
      <GallerySection data={data} />
      <GiftSection data={data} />
      <Closing data={data} />
      {data.musicUrl && <MusicToggle src={data.musicUrl} />}
    </main>
  );
}
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: sukses (route `/[slug]` belum dibuat — itu Task 5; build tema saja tidak error karena diimpor dinamis. Jika tree-shaking butuh halaman, lanjut Task 5 lalu build).

- [ ] **Step 8: Commit**

```bash
git add themes/minimalis-01 components/invitation/ui
git commit -m "feat: add original Minimalis-01 invitation theme"
```

---

## Task 5: Halaman publik `/[slug]`

**Files:** create `app/[slug]/page.tsx`, `app/[slug]/not-found.tsx`.

- [ ] **Step 1: not-found**

`app/[slug]/not-found.tsx`:
```tsx
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-3xl text-ink">Undangan tidak ditemukan</h1>
      <p className="text-ink-3 mt-2">Tautan tidak valid atau undangan belum aktif.</p>
    </main>
  );
}
```

- [ ] **Step 2: page**

`app/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { getPublicInvitation } from "@/lib/invitation/get-public";
import { ThemeRenderer } from "@/components/invitation/theme-renderer";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  const view = await getPublicInvitation(slug);
  if (!view) notFound();
  return <ThemeRenderer view={view} guestName={to} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getPublicInvitation(slug);
  if (!view) return { title: "Undangan" };
  const { groom, bride } = view.data.couple;
  return {
    title: `${groom.name} & ${bride.name} — Undangan Pernikahan`,
    description: `Undangan pernikahan ${groom.name} & ${bride.name}.`,
    robots: { index: false, follow: false },
  };
}
```

- [ ] **Step 3: Verifikasi render (butuh dev server + seed demo dari Task 2)**

Run: `npm run dev`, lalu `curl -s http://localhost:3000/andi-dan-sari | grep -o "The Wedding Of"` → ada. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tidak-ada` → 404. Hentikan server.

- [ ] **Step 4: Commit**

```bash
git add "app/[slug]"
git commit -m "feat: add public invitation page with ?to guest name"
```

---

## Task 6: OG image dinamis

**Files:** create `app/[slug]/opengraph-image.tsx`.

- [ ] **Step 1: opengraph-image**

`app/[slug]/opengraph-image.tsx`:
```tsx
import { ImageResponse } from "next/og";
import { getPublicInvitation } from "@/lib/invitation/get-public";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Undangan Pernikahan";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getPublicInvitation(slug);
  const groom = view?.data.couple.groom.name ?? "";
  const bride = view?.data.couple.bride.name ?? "";
  const date = view?.data.events[0]?.date
    ? new Date(view.data.events[0].date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#faf6ef", color: "#2b2b2b",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, color: "#7c8b78", textTransform: "uppercase" }}>The Wedding Of</div>
        <div style={{ fontSize: 92, marginTop: 12 }}>{groom} &amp; {bride}</div>
        {date && <div style={{ fontSize: 34, marginTop: 16, color: "#6b6b6b" }}>{date}</div>}
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Verifikasi**

Run: `npm run dev`, lalu `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/andi-dan-sari/opengraph-image` → `200 image/png`. Hentikan server.

- [ ] **Step 3: Commit**

```bash
git add "app/[slug]/opengraph-image.tsx"
git commit -m "feat: add dynamic OG image for invitation share preview"
```

---

## Task 7: E2E test halaman publik

**Files:** test `tests/e2e/public-invitation.spec.ts`.

- [ ] **Step 1: Test** (mengandalkan seed demo `andi-dan-sari`)

`tests/e2e/public-invitation.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("undangan demo render dengan section inti", async ({ page }) => {
  await page.goto("/andi-dan-sari");
  await expect(page.getByText("The Wedding Of")).toBeVisible();
  await expect(page.getByText("Acara")).toBeVisible();
});

test("nama tamu dari ?to tampil", async ({ page }) => {
  await page.goto("/andi-dan-sari?to=Budi");
  await expect(page.getByText("Budi")).toBeVisible();
});

test("slug tidak dikenal -> 404", async ({ page }) => {
  const res = await page.goto("/slug-tidak-ada-xyz");
  expect(res?.status()).toBe(404);
});
```

- [ ] **Step 2: Run**

Run: `npm run test:e2e`
Expected: 3 pass (+ 2 auth dari Fase 0 = 5 total). Pastikan seed demo ada.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/public-invitation.spec.ts
git commit -m "test: add e2e for public invitation rendering"
```

---

## Task 8: Verifikasi penuh + lint

- [ ] **Step 1:** `npm run lint` → bersih.
- [ ] **Step 2:** `npm run test` → semua unit (slug, auth, invitation-schema) pass.
- [ ] **Step 3:** `npm run build` → sukses.
- [ ] **Step 4:** `npm run test:e2e` → semua pass.

---

## Self-Review (penulis plan)

**Spec coverage (Fase 1 di `06-roadmap.md` + `05-rendering-engine.md`):**
- Kontrak data + ThemeRenderer + registry → Task 1, 3 ✓
- 1 tema lengkap (section inti) → Task 4 ✓
- Halaman publik `/[slug]` SSR + `?to=` → Task 5 ✓
- OG image dinamis → Task 6 ✓
- Baca via RPC security-definer (bukan anon SELECT ke invitation_data) → Task 2 ✓ (sesuai temuan review Fase 0)
- Caching per-slug (ISR-ready via unstable_cache tag) → Task 3 ✓; revalidasi saat edit = Fase 2 (dicatat)

**Placeholder scan:** Task 2 sengaja menampilkan versi SQL salah lalu versi benar — instruksi eksplisit "gunakan HANYA versi kedua". Tidak ada TODO menggantung selain yang ditandai sebagai pekerjaan fase lain (revalidasi edit = Fase 2, RSVP = Fase 3, blocklist slug = Fase 2).

**Type consistency:** `InvitationView { title, slug, themeKey, data }` konsisten di types.ts, registry.ts (ThemeComponent props `{ view, guestName }`), theme-renderer, page, dan tema. RPC JSON memakai kunci kamelCase yang cocok dgn `invitationDataSchema` (couple/events/gallery/musicUrl/...). `get_public_invitation(p_slug)` dipanggil dgn argumen `{ p_slug: slug }` di get-public.ts.

**Catatan keterbatasan (bukan placeholder):**
- Tema render section yang datanya ada; love story belum punya section khusus (data didukung schema, section bisa ditambah saat dibutuhkan).
- `<img>` dipakai langsung (bukan next/image) untuk kesederhanaan tema + URL eksternal Supabase Storage; optimisasi gambar bisa menyusul.
- RSVP & livestream & prewed video: data didukung, UI menyusul (Fase 3).

## Known Issues / Deferred (dari final code review Fase 1)

Sudah diperbaiki:
- ✅ RPC kini cek `expires_at` & `themes.is_active` (tidak menyajikan undangan kadaluwarsa/tema nonaktif).
- ✅ OG image `notFound()` untuk slug invalid (bukan gambar kosong).
- ✅ `schema`/`types` inner field `.nullish()` konsisten (Postgres null).
- ✅ Log error parse di server (mempermudah debug Fase 2).
- ✅ Hapus `meta.ts` yang tidak terpakai.

Di-defer:
- **Cache staleness ≤5 mnt** (`unstable_cache revalidate: 300`): saat owner non-aktifkan/hapus undangan, halaman publik bisa tetap tampil maksimal 5 menit. Fase 2 wajib panggil `revalidateTag('invitation:<slug>')` pada setiap mutasi status/data.
- **Timezone**: countdown & format tanggal mengasumsikan WIB (aman untuk Indonesia barat). Saat dukung multi-zona (WITA/WIT), simpan offset eksplisit per-event.
- **Expiry automation**: belum ada job yang flip `active`→`expired`. RPC kini sudah filter `expires_at`, tapi status DB belum diupdate otomatis (Fase 4, monetisasi/trial).
