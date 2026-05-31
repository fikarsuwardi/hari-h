# Fase 2 — Buat & Edit Undangan: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** User bisa membuat undangan sendiri: pilih tema dari galeri → buat draft (judul + slug) → isi data lewat editor (mempelai+foto, acara, quote, amplop, galeri, musik) → preview → publish (status `active` + masa aktif) → kelola di daftar → bagikan link.

**Architecture:** Dashboard pages (RSC) + Server Actions untuk mutasi, otorisasi via RLS (owner-only). Galeri tema membaca `themes` (public read) dengan filter/sort client-side. Editor = client component yang mengelola state lalu memanggil Server Action `updateInvitation(id, data)` dengan objek terserialisasi; data divalidasi `invitationDataSchema` lalu di-upsert ke `invitation_data`. Upload foto langsung dari browser ke Supabase Storage (bucket publik), URL disimpan di data. Preview owner merender draft via `ThemeRenderer` memakai client ber-sesi (RLS owner). Publish set `status='active'` + `expires_at` sesuai paket + `revalidateTag('invitation:<slug>')`.

**Tech Stack:** Next.js 16 (RSC + Server Actions), Supabase (Postgres RLS + Storage), Zod v4, Vitest, Playwright.

**Prasyarat (Fase 0/1):** auth + dashboard shell; `invitations`/`invitation_data`/`themes` + RLS owner-only; `invitationDataSchema`, `InvitationView`, `ThemeRenderer`, registry, tema `minimalis-01`; `slugify`. Demo invitation `andi-dan-sari` ada.

---

## Keputusan & batasan
- **Section editor inti:** mempelai (groom/bride: name, fullName, parents, instagram, photo), acara (repeatable), quote, amplop digital (repeatable), galeri (multi-upload), musik (URL). **Di-defer (data didukung, UI nanti):** love story, livestream, prewed video, settings warna.
- **Upload** ke Supabase Storage bucket `invitations` (public read), path `{userId}/{invitationId}/...`. Maks 5MB/gambar (validasi client).
- **Slug:** unik global (DB constraint) + blocklist kata tercadang (login/register/dashboard/auth/account/api/tema/_next/admin/reseller). Hanya boleh `[a-z0-9-]`.
- **Masa aktif saat publish:** ambil `duration_days` dari paket user (`profiles.plan_id`); jika tak ada paket, default trial 2 hari. `expires_at = now() + duration_days`.
- **Revalidasi:** setiap save data & perubahan status memanggil `revalidateTag('invitation:<slug>')` (menutup known-issue cache Fase 1).
- **Preview** owner: route terproteksi merender draft (status apa pun) — TIDAK lewat RPC publik.

---

## File Structure (dibuat/diubah)

```
supabase/migrations/0003_storage.sql       # bucket + storage policies
lib/invitation/reserved-slugs.ts           # blocklist + validateSlug
lib/validation/invitation.ts               # createInvitationSchema
lib/invitation/owner.ts                     # getOwnedInvitation (authed)
lib/invitation/actions.ts                   # server actions: create/update/activate/deactivate/delete
app/dashboard/invitation/page.tsx           # daftar undangan
app/dashboard/invitation/create/page.tsx    # galeri tema (server fetch)
app/dashboard/invitation/[id]/edit/page.tsx # wrapper server -> editor
app/dashboard/invitation/[id]/preview/page.tsx # preview owner (draft)
app/tema/[slug]/page.tsx                    # preview tema (sample data) utk tombol "Lihat"
components/dashboard/theme-gallery.tsx      # client: filter/search/sort + modal "Gunakan"
components/dashboard/invitation-list.tsx    # client: aksi (bagikan/publish/nonaktif/hapus)
components/dashboard/invitation-editor.tsx  # client: form section + simpan
components/dashboard/image-upload.tsx       # client: upload ke Storage
lib/invitation/sample.ts                    # SAMPLE_VIEW utk preview tema
tests/unit/reserved-slugs.test.ts
tests/e2e/dashboard-invitation.spec.ts
```

---

## Task 1: Storage bucket + policies

**Files:** `supabase/migrations/0003_storage.sql`. Apply via psql (DSN dari controller; jangan commit DSN).

- [ ] **Step 1: Migrasi**
```sql
-- Bucket publik untuk aset undangan
insert into storage.buckets (id, name, public)
values ('invitations', 'invitations', true)
on conflict (id) do nothing;

-- Baca publik
create policy "invitations_public_read" on storage.objects
  for select using (bucket_id = 'invitations');

-- Authenticated boleh tulis di folder miliknya: {uid}/...
create policy "invitations_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invitations' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "invitations_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'invitations' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "invitations_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invitations' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: Apply & verify**
Run: `PGCONNECT_TIMEOUT=10 psql "<dsn>" -v ON_ERROR_STOP=1 -f supabase/migrations/0003_storage.sql`
Verify: `psql "<dsn>" -tAc "select id, public from storage.buckets where id='invitations';"` → `invitations|t`. Jika policy sudah ada saat re-run, error duplicate boleh diabaikan (atau bungkus dengan drop policy if exists dulu).

- [ ] **Step 3: Commit** `feat: add invitations storage bucket and policies`

---

## Task 2: Reserved slug util (TDD)

**Files:** `lib/invitation/reserved-slugs.ts`, test `tests/unit/reserved-slugs.test.ts`.

- [ ] **Step 1: Failing test**
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isReservedSlug, validateSlug } from "@/lib/invitation/reserved-slugs";

describe("reserved slugs", () => {
  it("flags reserved words", () => {
    expect(isReservedSlug("login")).toBe(true);
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("andi-dan-sari")).toBe(false);
  });
  it("validateSlug returns error for invalid/reserved", () => {
    expect(validateSlug("andi-sari")).toBeNull();
    expect(validateSlug("Andi Sari")).toMatch(/huruf kecil/i);
    expect(validateSlug("ab")).toMatch(/minimal/i);
    expect(validateSlug("api")).toMatch(/tidak tersedia/i);
  });
});
```

- [ ] **Step 2: Run, fail** — `npm run test -- reserved-slugs`

- [ ] **Step 3: Implement**
```ts
export const RESERVED_SLUGS = new Set([
  "login", "register", "lost-password", "auth", "account", "dashboard",
  "api", "tema", "admin", "reseller", "_next", "favicon.ico", "robots.txt",
  "sitemap.xml", "upgrade", "undangan-video", "article", "blog",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** @returns pesan error (string) bila tidak valid, atau null bila valid */
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return "Link minimal 3 karakter.";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Link hanya boleh huruf kecil, angka, dan tanda hubung.";
  if (isReservedSlug(slug)) return "Link tidak tersedia, silakan pilih yang lain.";
  return null;
}
```

- [ ] **Step 4: Run, pass** — `npm run test -- reserved-slugs` (2 tests)
- [ ] **Step 5: Commit** `feat: add reserved slug validation`

---

## Task 3: Validasi + Server Actions undangan

**Files:** `lib/validation/invitation.ts`, `lib/invitation/owner.ts`, `lib/invitation/actions.ts`.

- [ ] **Step 1: createInvitationSchema**
`lib/validation/invitation.ts`:
```ts
import { z } from "zod";

export const createInvitationSchema = z.object({
  title: z.string().min(1, "Judul undangan harus diisi"),
  slug: z.string().min(3, "Link minimal 3 karakter"),
  themeId: z.string().uuid("Tema tidak valid"),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
```

- [ ] **Step 2: owner fetch helper**
`lib/invitation/owner.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { invitationDataSchema } from "./schema";
import type { InvitationView } from "./types";

export type OwnedInvitation = {
  id: string;
  title: string;
  slug: string;
  status: string;
  themeKey: string;
  view: InvitationView;
};

export async function getOwnedInvitation(id: string): Promise<OwnedInvitation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, title, slug, status, themes(component_key), invitation_data(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const themeKey = (data.themes as { component_key: string } | null)?.component_key ?? "";
  const raw = (data.invitation_data as Record<string, unknown> | null) ?? {};
  const parsed = invitationDataSchema.safeParse({
    couple: raw.couple ?? { groom: { name: "" }, bride: { name: "" } },
    events: raw.events ?? [],
    quotes: raw.quotes ?? null,
    loveStory: raw.love_story ?? null,
    gallery: raw.gallery ?? [],
    prewedVideoUrl: raw.prewed_video_url ?? null,
    musicUrl: raw.music_url ?? null,
    livestream: raw.livestream ?? null,
    gift: raw.gift ?? null,
    settings: raw.settings ?? {},
  });
  const view: InvitationView = {
    title: data.title,
    slug: data.slug,
    themeKey,
    data: parsed.success
      ? parsed.data
      : { couple: { groom: { name: "" }, bride: { name: "" } }, events: [], gallery: [] },
  };
  return { id: data.id, title: data.title, slug: data.slug, status: data.status, themeKey, view };
}
```

- [ ] **Step 3: Server actions**
`lib/invitation/actions.ts`:
```ts
"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createInvitationSchema } from "@/lib/validation/invitation";
import { invitationDataSchema } from "./schema";
import { validateSlug } from "./reserved-slugs";
import type { InvitationData } from "./types";

async function uid() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function createInvitation(_prev: unknown, formData: FormData) {
  const parsed = createInvitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const slugErr = validateSlug(parsed.data.slug);
  if (slugErr) return { error: slugErr };

  const { supabase, user } = await uid();
  if (!user) return { error: "Sesi habis, silakan masuk lagi." };

  const { data: existing } = await supabase.from("invitations").select("id").eq("slug", parsed.data.slug).maybeSingle();
  if (existing) return { error: "Link sudah dipakai, pilih yang lain." };

  const { data: inv, error } = await supabase
    .from("invitations")
    .insert({ user_id: user.id, theme_id: parsed.data.themeId, title: parsed.data.title, slug: parsed.data.slug, status: "draft" })
    .select("id")
    .single();
  if (error || !inv) return { error: "Gagal membuat undangan." };

  await supabase.from("invitation_data").insert({ invitation_id: inv.id });
  redirect(`/dashboard/invitation/${inv.id}/edit`);
}

function toDbColumns(d: InvitationData) {
  return {
    couple: d.couple,
    events: d.events,
    quotes: d.quotes ?? null,
    love_story: d.loveStory ?? null,
    gallery: d.gallery,
    prewed_video_url: d.prewedVideoUrl ?? null,
    music_url: d.musicUrl ?? null,
    livestream: d.livestream ?? null,
    gift: d.gift ?? null,
    settings: d.settings ?? {},
  };
}

export async function updateInvitation(id: string, title: string, data: InvitationData) {
  const parsed = invitationDataSchema.safeParse(data);
  if (!parsed.success) return { error: "Data tidak valid." };
  const { supabase, user } = await uid();
  if (!user) return { error: "Sesi habis." };

  const { data: inv } = await supabase.from("invitations").select("id, slug, user_id").eq("id", id).maybeSingle();
  if (!inv || inv.user_id !== user.id) return { error: "Tidak diizinkan." };

  await supabase.from("invitations").update({ title }).eq("id", id);
  const { error } = await supabase.from("invitation_data").update(toDbColumns(parsed.data)).eq("invitation_id", id);
  if (error) return { error: "Gagal menyimpan." };
  revalidateTag(`invitation:${inv.slug}`);
  return { success: "Tersimpan." };
}

async function setStatus(id: string, status: "active" | "inactive") {
  const { supabase, user } = await uid();
  if (!user) return { error: "Sesi habis." };
  const { data: inv } = await supabase.from("invitations").select("id, slug, user_id").eq("id", id).maybeSingle();
  if (!inv || inv.user_id !== user.id) return { error: "Tidak diizinkan." };

  let expiresAt: string | null = null;
  if (status === "active") {
    const { data: profile } = await supabase.from("profiles").select("packages(duration_days)").eq("id", user.id).maybeSingle();
    const days = (profile?.packages as { duration_days: number } | null)?.duration_days ?? 2;
    expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  }
  await supabase
    .from("invitations")
    .update({ status, ...(status === "active" ? { expires_at: expiresAt, published_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  revalidateTag(`invitation:${inv.slug}`);
  return { success: status === "active" ? "Undangan aktif." : "Undangan dinonaktifkan." };
}

export async function activateInvitation(id: string) { return setStatus(id, "active"); }
export async function deactivateInvitation(id: string) { return setStatus(id, "inactive"); }

export async function deleteInvitation(id: string) {
  const { supabase, user } = await uid();
  if (!user) return { error: "Sesi habis." };
  const { data: inv } = await supabase.from("invitations").select("slug, user_id").eq("id", id).maybeSingle();
  if (!inv || inv.user_id !== user.id) return { error: "Tidak diizinkan." };
  await supabase.from("invitations").delete().eq("id", id);
  revalidateTag(`invitation:${inv.slug}`);
  return { success: "Undangan dihapus." };
}
```
> Catatan: `new Date()`/`Date.now()` dipakai di server action (runtime biasa, bukan workflow) — aman.

- [ ] **Step 4: Build** `npm run build` (actions belum dipakai UI — pastikan kompil). Commit `feat: add invitation server actions and owner fetch`.

---

## Task 4: Galeri tema + preview tema + modal "Gunakan"

**Files:** `lib/invitation/sample.ts`, `app/tema/[slug]/page.tsx`, `app/dashboard/invitation/create/page.tsx`, `components/dashboard/theme-gallery.tsx`.

- [ ] **Step 1: Sample view (untuk preview tema)**
`lib/invitation/sample.ts`:
```ts
import type { InvitationView } from "./types";

export function sampleView(themeKey: string): InvitationView {
  return {
    title: "Contoh Undangan",
    slug: "contoh",
    themeKey,
    data: {
      couple: {
        groom: { name: "Rama", fullName: "Rama Aditya", parents: "Bpk. A & Ibu B" },
        bride: { name: "Sinta", fullName: "Sinta Maharani", parents: "Bpk. C & Ibu D" },
      },
      events: [
        { name: "Akad Nikah", date: "2026-12-12", startTime: "09:00", venue: "Masjid Raya" },
        { name: "Resepsi", date: "2026-12-12", startTime: "11:00", venue: "Balai Kota" },
      ],
      quotes: { text: "Cinta yang tumbuh dalam ikhtiar dan doa.", source: "—" },
      gallery: [],
      gift: [{ type: "bank", bank: "BCA", number: "1234567890", holder: "Rama Aditya" }],
    },
  };
}
```

- [ ] **Step 2: Preview tema**
`app/tema/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { isKnownTheme } from "@/lib/invitation/registry";
import { ThemeRenderer } from "@/components/invitation/theme-renderer";
import { sampleView } from "@/lib/invitation/sample";

export default async function ThemePreview({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  if (!isKnownTheme(slug)) notFound();
  return <ThemeRenderer view={sampleView(slug)} guestName={to ?? "Tamu Undangan"} />;
}
```
> Catatan: `themes.component_key` = `slug` untuk tema kita (minimalis-01). Tombol "Lihat" mengarah ke `/tema/<component_key>`.

- [ ] **Step 3: Halaman galeri (server fetch tema)**
`app/dashboard/invitation/create/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { ThemeGallery } from "@/components/dashboard/theme-gallery";

export default async function CreatePage() {
  const supabase = await createClient();
  const { data: themes } = await supabase
    .from("themes")
    .select("id, name, slug, thumbnail_url, badge, popularity, component_key, has_photo, categories(name)")
    .eq("is_active", true)
    .order("name");
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">Pilih Tema</h1>
      <p className="text-ink-3 mb-6">Pilih tema undangan, lalu isi datanya.</p>
      <ThemeGallery themes={themes ?? []} />
    </div>
  );
}
```

- [ ] **Step 4: Galeri client (filter/sort + modal)**
`components/dashboard/theme-gallery.tsx`:
```tsx
"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createInvitation } from "@/lib/invitation/actions";
import { slugify } from "@/lib/utils/slug";

type Theme = {
  id: string; name: string; slug: string; thumbnail_url: string | null;
  badge: string | null; popularity: number; component_key: string; has_photo: boolean;
};

export function ThemeGallery({ themes }: { themes: Theme[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "new" | "popular">("name");
  const [picked, setPicked] = useState<Theme | null>(null);

  const list = useMemo(() => {
    let r = themes.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "popular") r = [...r].sort((a, b) => b.popularity - a.popularity);
    return r;
  }, [themes, q, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tema..."
          className="border border-line rounded-sm px-3 py-2 flex-1 min-w-[200px]" />
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-line rounded-sm px-3 py-2">
          <option value="name">Abjad (A-Z)</option>
          <option value="popular">Populer</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((t) => (
          <div key={t.id} className="bg-card border border-line rounded overflow-hidden shadow">
            <div className="relative aspect-[3/4] bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail URL */}
              {t.thumbnail_url && <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover" />}
              {t.badge && <span className="absolute top-2 left-2 text-xs font-bold bg-brand text-white rounded-full px-2 py-0.5">{t.badge === "new" ? "New" : "Popular"}</span>}
            </div>
            <div className="p-3">
              <p className="font-semibold text-ink truncate">{t.name}</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/tema/${t.component_key}`} target="_blank" className="flex-1 text-center text-sm border border-line-strong rounded-sm py-1.5 text-ink-2">Lihat</Link>
                <button onClick={() => setPicked(t)} className="flex-1 text-sm bg-brand text-white rounded-sm py-1.5">Gunakan</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {picked && <CreateModal theme={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

function CreateModal({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const [state, action, pending] = useActionState(createInvitation, null);
  const [title, setTitle] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form action={action} onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-lg p-6 w-full max-w-md space-y-4">
        <h2 className="font-display text-xl text-ink">Buat Undangan — {theme.name}</h2>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        <input type="hidden" name="themeId" value={theme.id} />
        <div>
          <label className="text-sm text-ink-2">Judul Undangan</label>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Rama & Sinta" className="w-full border border-line rounded-sm px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm text-ink-2">Link Undangan</label>
          <div className="flex items-center mt-1">
            <span className="text-ink-3 text-sm">/</span>
            <input name="slug" defaultValue={slugify(title)} key={slugify(title)}
              placeholder="rama-dan-sinta" className="flex-1 border border-line rounded-sm px-3 py-2 ml-1" />
          </div>
          <p className="text-xs text-ink-3 mt-1">Huruf kecil, tanpa spasi. Contoh: rama-dan-sinta</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-ink-2">Batal</button>
          <button disabled={pending} className="px-4 py-2 bg-brand text-white rounded-sm disabled:opacity-60">
            {pending ? "Membuat..." : "Buat"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Verify** `npm run build` + `npm run lint`. Commit `feat: add theme gallery, theme preview, create modal`.

---

## Task 5: Daftar undangan + aksi

**Files:** `app/dashboard/invitation/page.tsx`, `components/dashboard/invitation-list.tsx`.

- [ ] **Step 1: Halaman daftar**
`app/dashboard/invitation/page.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InvitationList } from "@/components/dashboard/invitation-list";

export default async function InvitationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("id, title, slug, status, expires_at")
    .order("created_at", { ascending: false });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Undangan Saya</h1>
        <Link href="/dashboard/invitation/create" className="bg-brand text-white rounded-sm px-4 py-2">+ Buat Undangan</Link>
      </div>
      <InvitationList items={data ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: List client + aksi**
`components/dashboard/invitation-list.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { activateInvitation, deactivateInvitation, deleteInvitation } from "@/lib/invitation/actions";

type Item = { id: string; title: string; slug: string; status: string; expires_at: string | null };
const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draf", cls: "bg-paper-2 text-ink-3" },
  active: { label: "Aktif", cls: "bg-pos-soft text-pos" },
  inactive: { label: "Nonaktif", cls: "bg-warn-soft text-warn" },
  expired: { label: "Kadaluwarsa", cls: "bg-neg-soft text-neg" },
};

export function InvitationList({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  if (!items.length) return <p className="text-ink-3">Belum ada undangan. Klik “Buat Undangan”.</p>;

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? r.success ?? "");
      location.reload();
    });
  }
  async function share(slug: string) {
    await navigator.clipboard.writeText(`${location.origin}/${slug}`);
    setMsg("Link disalin!");
  }

  return (
    <div className="space-y-3">
      {msg && <p className="text-sm text-pos">{msg}</p>}
      {items.map((it) => {
        const s = STATUS[it.status] ?? STATUS.draft;
        return (
          <div key={it.id} className="bg-card border border-line rounded p-4 flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="font-semibold text-ink">{it.title}</p>
              <p className="text-sm text-ink-3">/{it.slug} · <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href={`/dashboard/invitation/${it.id}/edit`} className="border border-line-strong rounded-sm px-3 py-1.5">Edit</Link>
              <Link href={`/dashboard/invitation/${it.id}/preview`} className="border border-line-strong rounded-sm px-3 py-1.5">Preview</Link>
              <button disabled={pending} onClick={() => share(it.slug)} className="border border-line-strong rounded-sm px-3 py-1.5">Bagikan</button>
              {it.status === "active"
                ? <button disabled={pending} onClick={() => run(() => deactivateInvitation(it.id))} className="border border-warn rounded-sm px-3 py-1.5 text-warn">Nonaktifkan</button>
                : <button disabled={pending} onClick={() => run(() => activateInvitation(it.id))} className="bg-brand text-white rounded-sm px-3 py-1.5">Aktifkan</button>}
              <button disabled={pending} onClick={() => { if (confirm("Hapus undangan ini?")) run(() => deleteInvitation(it.id)); }} className="border border-neg rounded-sm px-3 py-1.5 text-neg">Hapus</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Update sidebar link** — pastikan `components/dashboard/sidebar.tsx` punya item ke `/dashboard/invitation` (sudah ada dari Fase 0) dan `/dashboard/invitation/create`.
- [ ] **Step 4: Verify** build+lint. Commit `feat: add invitation list with actions`.

---

## Task 6: Editor undangan + upload foto

**Files:** `components/dashboard/image-upload.tsx`, `components/dashboard/invitation-editor.tsx`, `app/dashboard/invitation/[id]/edit/page.tsx`.

- [ ] **Step 1: Image upload (client → Storage)**
`components/dashboard/image-upload.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  userId, invitationId, value, onChange, label,
}: {
  userId: string; invitationId: string; value?: string | null;
  onChange: (url: string) => void; label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Maksimal 5MB."); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${invitationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("invitations").upload(path, file, { upsert: true });
    if (error) { setErr("Gagal upload."); setBusy(false); return; }
    const { data } = supabase.storage.from("invitations").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }
  return (
    <div>
      <label className="text-sm text-ink-2">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- preview of uploaded image
          <img src={value} alt="" className="w-16 h-16 object-cover rounded" />
        )}
        <input type="file" accept="image/*" onChange={handle} disabled={busy} className="text-sm" />
      </div>
      {busy && <p className="text-xs text-ink-3">Mengupload...</p>}
      {err && <p className="text-xs text-neg">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Editor wrapper (server)**
`app/dashboard/invitation/[id]/edit/page.tsx`:
```tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInvitation } from "@/lib/invitation/owner";
import { InvitationEditor } from "@/components/dashboard/invitation-editor";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const inv = await getOwnedInvitation(id);
  if (!inv) notFound();
  return <InvitationEditor userId={user.id} id={inv.id} initialTitle={inv.title} initialData={inv.view.data} slug={inv.slug} />;
}
```

- [ ] **Step 3: Editor client**
`components/dashboard/invitation-editor.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { updateInvitation } from "@/lib/invitation/actions";
import { ImageUpload } from "./image-upload";
import type { InvitationData, EventItem, GiftAccount, Person } from "@/lib/invitation/types";

export function InvitationEditor({
  userId, id, initialTitle, initialData, slug,
}: {
  userId: string; id: string; initialTitle: string; initialData: InvitationData; slug: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [data, setData] = useState<InvitationData>(initialData);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function setPerson(which: "groom" | "bride", patch: Partial<Person>) {
    setData((d) => ({ ...d, couple: { ...d.couple, [which]: { ...d.couple[which], ...patch } } }));
  }
  function setEvent(i: number, patch: Partial<EventItem>) {
    setData((d) => ({ ...d, events: d.events.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  }
  function addEvent() {
    setData((d) => ({ ...d, events: [...d.events, { name: "", date: "" }] }));
  }
  function removeEvent(i: number) {
    setData((d) => ({ ...d, events: d.events.filter((_, idx) => idx !== i) }));
  }
  function setGift(i: number, patch: Partial<GiftAccount>) {
    setData((d) => ({ ...d, gift: (d.gift ?? []).map((g, idx) => (idx === i ? { ...g, ...patch } : g)) }));
  }
  function addGift() {
    setData((d) => ({ ...d, gift: [...(d.gift ?? []), { type: "bank", number: "", holder: "" }] }));
  }
  function removeGift(i: number) {
    setData((d) => ({ ...d, gift: (d.gift ?? []).filter((_, idx) => idx !== i) }));
  }

  function save() {
    start(async () => {
      const r = await updateInvitation(id, title, data);
      setMsg(r.error ?? r.success ?? "");
    });
  }

  const input = "w-full border border-line rounded-sm px-3 py-2 mt-1";
  const sec = "bg-card border border-line rounded p-5";
  const h = "font-display text-lg text-ink mb-3";

  return (
    <div className="max-w-2xl space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Edit Undangan</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/invitation/${id}/preview`} className="border border-line-strong rounded-sm px-3 py-1.5 text-sm">Preview</Link>
          <Link href="/dashboard/invitation" className="text-sm text-ink-2 px-3 py-1.5">Kembali</Link>
        </div>
      </div>

      <div className={sec}>
        <h2 className={h}>Judul</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
      </div>

      <div className={sec}>
        <h2 className={h}>Mempelai</h2>
        {(["groom", "bride"] as const).map((w) => (
          <div key={w} className="mb-4">
            <p className="text-sm font-semibold text-ink-2 mb-1">{w === "groom" ? "Mempelai Pria" : "Mempelai Wanita"}</p>
            <input placeholder="Nama panggilan" value={data.couple[w].name} onChange={(e) => setPerson(w, { name: e.target.value })} className={input} />
            <input placeholder="Nama lengkap" value={data.couple[w].fullName ?? ""} onChange={(e) => setPerson(w, { fullName: e.target.value })} className={input} />
            <input placeholder="Nama orang tua" value={data.couple[w].parents ?? ""} onChange={(e) => setPerson(w, { parents: e.target.value })} className={input} />
            <input placeholder="Instagram (tanpa @)" value={data.couple[w].instagram ?? ""} onChange={(e) => setPerson(w, { instagram: e.target.value })} className={input} />
            <div className="mt-2">
              <ImageUpload userId={userId} invitationId={id} value={data.couple[w].photoUrl} label="Foto" onChange={(url) => setPerson(w, { photoUrl: url })} />
            </div>
          </div>
        ))}
      </div>

      <div className={sec}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-ink">Acara</h2>
          <button onClick={addEvent} className="text-sm text-brand">+ Tambah</button>
        </div>
        {data.events.map((e, i) => (
          <div key={i} className="border border-line rounded-sm p-3 mb-3">
            <input placeholder="Nama acara (mis. Akad)" value={e.name} onChange={(ev) => setEvent(i, { name: ev.target.value })} className={input} />
            <input type="date" value={e.date} onChange={(ev) => setEvent(i, { date: ev.target.value })} className={input} />
            <div className="flex gap-2">
              <input type="time" value={e.startTime ?? ""} onChange={(ev) => setEvent(i, { startTime: ev.target.value })} className={input} />
              <input type="time" value={e.endTime ?? ""} onChange={(ev) => setEvent(i, { endTime: ev.target.value })} className={input} />
            </div>
            <input placeholder="Tempat" value={e.venue ?? ""} onChange={(ev) => setEvent(i, { venue: ev.target.value })} className={input} />
            <input placeholder="Alamat" value={e.address ?? ""} onChange={(ev) => setEvent(i, { address: ev.target.value })} className={input} />
            <input placeholder="Link Google Maps" value={e.mapsUrl ?? ""} onChange={(ev) => setEvent(i, { mapsUrl: ev.target.value })} className={input} />
            <button onClick={() => removeEvent(i)} className="text-sm text-neg mt-2">Hapus acara</button>
          </div>
        ))}
      </div>

      <div className={sec}>
        <h2 className={h}>Quote / Ayat</h2>
        <textarea placeholder="Teks quote" value={data.quotes?.text ?? ""} onChange={(e) => setData((d) => ({ ...d, quotes: { text: e.target.value, source: d.quotes?.source } }))} className={input} rows={3} />
        <input placeholder="Sumber (mis. QS. Ar-Rum: 21)" value={data.quotes?.source ?? ""} onChange={(e) => setData((d) => ({ ...d, quotes: { text: d.quotes?.text ?? "", source: e.target.value } }))} className={input} />
      </div>

      <div className={sec}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-ink">Amplop Digital</h2>
          <button onClick={addGift} className="text-sm text-brand">+ Tambah</button>
        </div>
        {(data.gift ?? []).map((g, i) => (
          <div key={i} className="border border-line rounded-sm p-3 mb-3">
            <select value={g.type} onChange={(e) => setGift(i, { type: e.target.value as "bank" | "ewallet" })} className={input}>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
            </select>
            <input placeholder="Nama bank/e-wallet" value={g.bank ?? ""} onChange={(e) => setGift(i, { bank: e.target.value })} className={input} />
            <input placeholder="Nomor rekening/akun" value={g.number} onChange={(e) => setGift(i, { number: e.target.value })} className={input} />
            <input placeholder="Atas nama" value={g.holder} onChange={(e) => setGift(i, { holder: e.target.value })} className={input} />
            <button onClick={() => removeGift(i)} className="text-sm text-neg mt-2">Hapus</button>
          </div>
        ))}
      </div>

      <div className={sec}>
        <h2 className={h}>Musik Latar</h2>
        <input placeholder="URL file audio (mp3)" value={data.musicUrl ?? ""} onChange={(e) => setData((d) => ({ ...d, musicUrl: e.target.value }))} className={input} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-line p-3 flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-pos">{msg}</span>}
        <button onClick={save} disabled={pending} className="bg-brand text-white rounded-sm px-6 py-2 disabled:opacity-60">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
```
> Galeri foto (multi-upload) di-defer agar editor tetap fokus; tambahkan section galeri memakai `ImageUpload` berulang + array `data.gallery` saat dibutuhkan.

- [ ] **Step 4: Verify** build+lint. Commit `feat: add invitation editor with photo upload`.

---

## Task 7: Preview owner (draft)

**Files:** `app/dashboard/invitation/[id]/preview/page.tsx`.

- [ ] **Step 1: Page**
```tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInvitation } from "@/lib/invitation/owner";
import { ThemeRenderer } from "@/components/invitation/theme-renderer";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const inv = await getOwnedInvitation(id);
  if (!inv) notFound();
  return (
    <div>
      <div className="bg-warn-soft text-warn text-sm text-center py-2">Mode Preview — hanya Anda yang melihat ini.</div>
      <ThemeRenderer view={inv.view} guestName="Tamu Undangan" />
    </div>
  );
}
```
- [ ] **Step 2: Verify** build+lint. Commit `feat: add owner draft preview`.

---

## Task 8: E2E + verifikasi penuh

**Files:** `tests/e2e/dashboard-invitation.spec.ts`.

E2E memakai akun uji yang dibuat lewat UI register (auth simpel tanpa OTP). Test alur: register → buka /dashboard/invitation/create → galeri tampil. (Pembuatan undangan penuh + edit diuji manual oleh controller via verifikasi langsung; e2e fokus smoke alur utama agar tidak rapuh.)

- [ ] **Step 1: Test**
```ts
import { test, expect } from "@playwright/test";

test("galeri tema butuh login (redirect)", async ({ page }) => {
  await page.goto("/dashboard/invitation/create");
  await expect(page).toHaveURL(/\/login/);
});

test("preview tema publik render", async ({ page }) => {
  await page.goto("/tema/minimalis-01");
  await expect(page.getByText("The Wedding Of", { exact: false })).toBeVisible();
});
```

- [ ] **Step 2: Run** `npm run test:e2e` → semua pass (2 baru + 5 lama = 7).
- [ ] **Step 3: Verifikasi controller (manual, live):** register user uji → buat undangan dari galeri → edit data (isi mempelai+acara, simpan) → preview → aktifkan → buka `/<slug>` publik tampil → nonaktifkan → `/<slug>` jadi 404 → hapus → bersihkan user uji. Paste bukti di laporan.
- [ ] **Step 4: Full check:** `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` semua hijau.
- [ ] **Step 5: Commit** `test: add e2e for dashboard invitation flow`.

---

## Self-Review (penulis plan)

**Spec coverage (Fase 2 di `06-roadmap.md` + `04-features.md` §3):**
- Galeri tema (filter/search/sort, Lihat/Gunakan) → Task 4 ✓
- Buat undangan (modal judul+slug → draft → editor) → Task 3, 4 ✓
- Editor per-section + preview → Task 6, 7 ✓
- Daftar undangan + aksi (edit, bagikan, aktif/nonaktif) → Task 5 ✓
- Publish set status+expires_at + revalidateTag (menutup known-issue cache Fase 1) → Task 3 ✓
- Upload foto (Storage) → Task 1, 6 ✓
- Slug unik + blocklist tercadang → Task 2, 3 ✓

**Placeholder scan:** Tidak ada TODO menggantung. Yang ditandai "defer" (galeri multi-upload, love story/livestream/prewed UI) adalah keputusan scope eksplisit, data tetap didukung schema.

**Type consistency:** `InvitationData`/`Person`/`EventItem`/`GiftAccount` dipakai konsisten di editor, owner.ts, actions.ts. `updateInvitation(id, title, data)` dipanggil dgn signature sama di editor. `toDbColumns` memetakan camelCase→snake_case sesuai kolom `invitation_data` (love_story, prewed_video_url, music_url). `getOwnedInvitation` memetakan balik snake→camel. Server actions mengembalikan `{ error? , success? }` konsisten dengan pemakaian di client (`useActionState`/`useTransition`).

**Catatan keamanan:** Semua action cek `user` + kepemilikan (`inv.user_id === user.id`) selain mengandalkan RLS (defense in depth). Upload Storage dibatasi folder `{uid}/...` via policy. `redirect()` di create action dipanggil di top-level action (aman).
