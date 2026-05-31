# Fase 5b — Panel Admin: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) atau superpowers:executing-plans. Steps pakai checkbox `- [ ]`.

**Goal:** Panel admin terproteksi (`/admin`) untuk mengelola **tema** (metadata + thumbnail + aktif), **paket** (harga/durasi/fitur), dan **user** (lihat + ubah role/status). Transaksi dilewati (Fase 4).

**Architecture:** Akses digerbang `profiles.role = 'admin'` (server check + RLS). Admin menulis ke `themes`/`packages`/`profiles` lewat **RLS policy khusus admin** (pakai client sesi user, bukan service-role — tanpa secret tambahan). Thumbnail tema diupload ke bucket Storage `themes` (public read, admin write). UI pakai aksen **deposit** (biru-abu) per konvensi Rukos untuk admin.

**Tech Stack:** Next.js 16 (RSC + Server Actions), Supabase (RLS + Storage), Zod, Playwright.

**Prasyarat:** Fase 0–3, 5a. `profiles.role` enum (user/admin/reseller). `themes`/`packages` public-read (belum ada policy write). Registry tema di `lib/invitation/registry.ts` (`THEMES` keys).

---

## Keputusan & batasan
- **Otorisasi:** server `requireAdmin()` di `/admin/layout` + **RLS admin** (defense-in-depth). RLS admin: `exists(select 1 from profiles where id=auth.uid() and role='admin')`.
- **Tema (admin):** mengelola BARIS DB `themes` (metadata) yang menunjuk ke `component_key` kode yang sudah terdaftar di registry. Admin TIDAK menulis kode tema (itu kerja dev / Fase 5c). `component_key` = dropdown dari daftar key registry yang diekspos.
- **Tanpa service-role key** (hindari secret baru). Semua via client sesi + RLS admin.
- **Transaksi & email**: dilewati (Fase 4 / nanti).
- Promote 1 user ke admin via psql saat verifikasi (tidak di-commit).

---

## File Structure
```
supabase/migrations/0006_admin.sql        # RLS admin (themes/packages/profiles) + bucket themes + policies
lib/admin.ts                               # requireAdmin(), isAdmin()
lib/invitation/registry.ts (modify)        # export THEME_KEYS: string[]
lib/validation/admin.ts                    # zod: themeSchema, packageSchema
lib/admin/actions.ts                       # server actions: theme/package/user CRUD
app/admin/layout.tsx                       # gate + admin shell (sidebar deposit)
app/admin/page.tsx                         # ringkasan/redirect ke /admin/themes
app/admin/themes/page.tsx                  # list + form (create/edit inline)
app/admin/packages/page.tsx                # list + form
app/admin/users/page.tsx                   # list + ubah role/status
components/admin/theme-form.tsx            # client form tema (+ thumbnail upload)
components/admin/package-form.tsx          # client form paket
components/admin/admin-thumb-upload.tsx    # client upload ke bucket themes
components/admin/user-row.tsx              # client baris user (role/status)
tests/e2e/admin.spec.ts
```

---

## Task 1: RLS admin + bucket themes

**Files:** `supabase/migrations/0006_admin.sql`. Apply via psql (DSN dari controller; jangan commit).

- [ ] **Step 1: Migrasi (idempoten)**
```sql
-- Helper: apakah user saat ini admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- RLS admin: tulis themes/packages, kelola profiles
drop policy if exists "themes_admin_write" on themes;
create policy "themes_admin_write" on themes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "packages_admin_write" on packages;
create policy "packages_admin_write" on packages for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: admin boleh lihat semua + update (role/status). (User biasa tetap hanya dirinya.)
drop policy if exists "profiles_admin_select" on profiles;
create policy "profiles_admin_select" on profiles for select using (public.is_admin());
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles for update using (public.is_admin());

-- Bucket thumbnail tema (public read, admin write)
insert into storage.buckets (id, name, public) values ('themes', 'themes', true) on conflict (id) do nothing;
drop policy if exists "themes_bucket_read" on storage.objects;
create policy "themes_bucket_read" on storage.objects for select using (bucket_id = 'themes');
drop policy if exists "themes_bucket_admin_write" on storage.objects;
create policy "themes_bucket_admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'themes' and public.is_admin());
drop policy if exists "themes_bucket_admin_update" on storage.objects;
create policy "themes_bucket_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'themes' and public.is_admin());
```

- [ ] **Step 2: Apply + promote admin uji**
Run: `PGCONNECT_TIMEOUT=10 psql "<dsn>" -v ON_ERROR_STOP=1 -f supabase/migrations/0006_admin.sql`
Promote user demo jadi admin untuk verifikasi (TIDAK di-commit): `psql "<dsn>" -tAc "update profiles set role='admin' where id=(select id from auth.users where email='demo@harih.local');"` (jika user demo tak ada, buat satu via SQL seperti Fase 2, lalu promote). Verify: `select role from profiles where role='admin';` → ada `admin`. Paste output.

- [ ] **Step 3: Commit** `feat: add admin RLS policies and themes bucket`

---

## Task 2: Admin gate + shell

**Files:** `lib/admin.ts`, `lib/invitation/registry.ts` (modify), `app/admin/layout.tsx`, `app/admin/page.tsx`.

- [ ] **Step 1: Helper admin** `lib/admin.ts`
```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}
```

- [ ] **Step 2: Export THEME_KEYS** — di `lib/invitation/registry.ts` tambah:
```ts
export const THEME_KEYS = Object.keys(THEMES);
```

- [ ] **Step 3: Admin layout (gate + shell)** `app/admin/layout.tsx`
```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const items = [
    { label: "Tema", href: "/admin/themes" },
    { label: "Paket", href: "/admin/packages" },
    { label: "User", href: "/admin/users" },
  ];
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-line bg-deposit-soft p-4">
        <div className="font-display text-lg text-deposit mb-6">Admin · Hari-H</div>
        <nav className="space-y-1">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="block rounded-sm px-3 py-2 text-ink-2 hover:bg-card">{it.label}</Link>
          ))}
          <Link href="/dashboard" className="block rounded-sm px-3 py-2 text-ink-3 hover:bg-card mt-4 text-sm">← Dashboard</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Admin index** `app/admin/page.tsx`
```tsx
import { redirect } from "next/navigation";
export default function AdminIndex() { redirect("/admin/themes"); }
```

- [ ] **Step 5: Verify** build+lint. Commit `feat: add admin gate and shell`.

---

## Task 3: Admin Tema (CRUD)

**Files:** `lib/validation/admin.ts`, `lib/admin/actions.ts`, `components/admin/admin-thumb-upload.tsx`, `components/admin/theme-form.tsx`, `app/admin/themes/page.tsx`.

- [ ] **Step 1: Validasi** `lib/validation/admin.ts`
```ts
import { z } from "zod";

export const themeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nama tema harus diisi"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug huruf kecil/angka/strip"),
  componentKey: z.string().min(1, "Component key harus dipilih"),
  categoryId: z.string().uuid().optional().nullable(),
  hasPhoto: z.coerce.boolean().default(false),
  thumbnailUrl: z.string().optional().nullable(),
  badge: z.enum(["new", "popular"]).optional().nullable(),
  popularity: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const packageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  price: z.coerce.number().int().min(0),
  originalPrice: z.coerce.number().int().min(0).optional().nullable(),
  themeAccess: z.enum(["non_photo", "photo"]),
  durationDays: z.coerce.number().int().min(1),
  features: z.string().optional().default(""), // baris dipisah newline
  isActive: z.coerce.boolean().default(true),
});
```

- [ ] **Step 2: Server actions** `lib/admin/actions.ts`
```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminGuard } from "@/lib/admin";
import { themeSchema, packageSchema } from "@/lib/validation/admin";

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, ok: p?.role === "admin" };
}

export async function saveTheme(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = themeSchema.safeParse({ ...raw, hasPhoto: raw.hasPhoto === "on", isActive: raw.isActive === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, ok } = await adminClient();
  if (!ok) return { error: "Akses ditolak." };
  const d = parsed.data;
  const row = {
    name: d.name, slug: d.slug, component_key: d.componentKey,
    category_id: d.categoryId || null, has_photo: d.hasPhoto,
    thumbnail_url: d.thumbnailUrl || null, badge: d.badge || null,
    popularity: d.popularity, is_active: d.isActive,
  };
  const res = d.id
    ? await supabase.from("themes").update(row).eq("id", d.id).select("id")
    : await supabase.from("themes").insert(row).select("id");
  if (res.error) return { error: res.error.code === "23505" ? "Slug tema sudah dipakai." : "Gagal menyimpan tema." };
  revalidatePath("/admin/themes");
  revalidatePath("/dashboard/invitation/create");
  return { success: "Tema disimpan." };
}

export async function deleteTheme(id: string) {
  const { supabase, ok } = await adminClient();
  if (!ok) return { error: "Akses ditolak." };
  const { error } = await supabase.from("themes").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus (mungkin dipakai undangan)." };
  revalidatePath("/admin/themes");
  return { success: "Tema dihapus." };
}

export async function savePackage(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = packageSchema.safeParse({ ...raw, isActive: raw.isActive === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { supabase, ok } = await adminClient();
  if (!ok) return { error: "Akses ditolak." };
  const d = parsed.data;
  const features = d.features.split("\n").map((s) => s.trim()).filter(Boolean);
  const row = {
    name: d.name, price: d.price, original_price: d.originalPrice || null,
    theme_access: d.themeAccess, duration_days: d.durationDays, features, is_active: d.isActive,
  };
  const res = d.id
    ? await supabase.from("packages").update(row).eq("id", d.id).select("id")
    : await supabase.from("packages").insert(row).select("id");
  if (res.error) return { error: "Gagal menyimpan paket." };
  revalidatePath("/admin/packages");
  return { success: "Paket disimpan." };
}

export async function deletePackage(id: string) {
  const { supabase, ok } = await adminClient();
  if (!ok) return { error: "Akses ditolak." };
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus paket." };
  revalidatePath("/admin/packages");
  return { success: "Paket dihapus." };
}

export async function setUserRole(userId: string, role: "user" | "admin" | "reseller") {
  const { supabase, ok } = await adminClient();
  if (!ok) return { error: "Akses ditolak." };
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("id");
  if (error) return { error: "Gagal." };
  if (!data?.length) return { error: "Tidak ditemukan." };
  revalidatePath("/admin/users");
  return { success: "Role diperbarui." };
}
```
> CATATAN: `isAdminGuard` import di atas TIDAK dipakai (hapus baris importnya — `adminClient()` sudah meng-handle). Jangan biarkan import tak terpakai (lint error). Implementer: hapus import yang tak dipakai.

- [ ] **Step 3: Thumbnail upload (client)** `components/admin/admin-thumb-upload.tsx`
```tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminThumbUpload({ value, onChange }: { value?: string | null; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Maks 5MB."); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const path = `thumb-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("themes").upload(path, file, { upsert: true });
    if (error) { setErr("Gagal upload."); setBusy(false); return; }
    onChange(supabase.storage.from("themes").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail preview
          <img src={value} alt="" className="w-16 h-20 object-cover rounded" />
        )}
        <input type="file" accept="image/*" onChange={handle} disabled={busy} className="text-sm" />
      </div>
      {busy && <p className="text-xs text-ink-3">Mengupload...</p>}
      {err && <p className="text-xs text-neg">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Theme form (client)** `components/admin/theme-form.tsx`
```tsx
"use client";
import { useActionState, useState } from "react";
import { saveTheme } from "@/lib/admin/actions";
import { AdminThumbUpload } from "./admin-thumb-upload";

type Theme = { id?: string; name: string; slug: string; component_key: string; has_photo: boolean; thumbnail_url: string | null; badge: string | null; popularity: number; is_active: boolean };

export function ThemeForm({ theme, themeKeys, onDone }: { theme?: Theme; themeKeys: string[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveTheme, null);
  const [thumb, setThumb] = useState(theme?.thumbnail_url ?? "");
  const input = "w-full border border-line rounded-sm px-3 py-2 mt-1";
  if (state?.success) onDone();
  return (
    <form action={action} className="bg-card border border-line rounded p-5 space-y-3 max-w-lg">
      {theme?.id && <input type="hidden" name="id" value={theme.id} />}
      {state?.error && <p className="text-neg text-sm">{state.error}</p>}
      <input name="name" defaultValue={theme?.name} placeholder="Nama tema" className={input} />
      <input name="slug" defaultValue={theme?.slug} placeholder="slug-tema" className={input} />
      <label className="block text-sm text-ink-2">Component key
        <select name="componentKey" defaultValue={theme?.component_key} className={input}>
          {themeKeys.map((k) => (<option key={k} value={k}>{k}</option>))}
        </select>
      </label>
      <input type="hidden" name="thumbnailUrl" value={thumb} />
      <AdminThumbUpload value={thumb} onChange={setThumb} />
      <select name="badge" defaultValue={theme?.badge ?? ""} className={input}>
        <option value="">Tanpa badge</option><option value="new">New</option><option value="popular">Popular</option>
      </select>
      <input name="popularity" type="number" defaultValue={theme?.popularity ?? 0} placeholder="Popularity" className={input} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hasPhoto" defaultChecked={theme?.has_photo} /> Tema dengan foto</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={theme?.is_active ?? true} /> Aktif</label>
      <button disabled={pending} className="bg-deposit text-white rounded-sm px-5 py-2 disabled:opacity-60">{pending ? "Menyimpan..." : "Simpan"}</button>
    </form>
  );
}
```

- [ ] **Step 5: Halaman tema** `app/admin/themes/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { THEME_KEYS } from "@/lib/invitation/registry";
import { AdminThemesClient } from "@/components/admin/theme-form";

export default async function AdminThemesPage() {
  const supabase = await createClient();
  const { data: themes } = await supabase.from("themes").select("*").order("name");
  return <AdminThemesClient themes={themes ?? []} themeKeys={THEME_KEYS} />;
}
```
> CATATAN IMPLEMENTER: bungkus list + form dalam satu client component `AdminThemesClient` (ekspor dari `theme-form.tsx` atau file terpisah `components/admin/admin-themes-client.tsx`): tampilkan tabel tema (nama, slug, key, aktif, badge) dengan tombol "Edit" (buka `ThemeForm` terisi) & "Hapus" (`deleteTheme` + konfirmasi + `router.refresh()`), dan tombol "+ Tema Baru" (buka `ThemeForm` kosong). Setelah simpan/hapus panggil `router.refresh()`. Pisahkan ke file sendiri bila lebih rapi; pastikan import konsisten dengan `page.tsx`.

- [ ] **Step 6: Verify** build+lint. Commit `feat: add admin theme management`.

---

## Task 4: Admin Paket (CRUD)

**Files:** `components/admin/package-form.tsx`, `app/admin/packages/page.tsx`.

- [ ] **Step 1: Package form + list client** — pola sama Task 3 (pakai `savePackage`/`deletePackage`). `components/admin/package-form.tsx` ekspor `PackageForm` (field: name, price, originalPrice, themeAccess select non_photo/photo, durationDays, features textarea (1 fitur per baris), isActive checkbox) + `AdminPackagesClient` (tabel paket + edit/hapus + tambah). Tombol pakai `bg-deposit`.
- [ ] **Step 2: Halaman** `app/admin/packages/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { AdminPackagesClient } from "@/components/admin/package-form";

export default async function AdminPackagesPage() {
  const supabase = await createClient();
  const { data: packages } = await supabase.from("packages").select("*").order("price");
  return <AdminPackagesClient packages={packages ?? []} />;
}
```
> Implementer: `features` di DB = string[]; saat edit, gabung jadi textarea (`features.join("\n")`); action sudah memecah per baris.
- [ ] **Step 3: Verify** build+lint. Commit `feat: add admin package management`.

---

## Task 5: Admin User

**Files:** `components/admin/user-row.tsx`, `app/admin/users/page.tsx`.

- [ ] **Step 1: Halaman** `app/admin/users/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, account_status, created_at")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">User</h1>
      <div className="space-y-2">
        {(users ?? []).map((u) => (<UserRow key={u.id} user={u} />))}
      </div>
    </div>
  );
}
```
- [ ] **Step 2: User row (client)** `components/admin/user-row.tsx` — tampilkan nama/phone/status + `<select>` role (user/admin/reseller) memanggil `setUserRole(u.id, role)` via `useTransition` + `router.refresh()`. Pakai token Rukos.
- [ ] **Step 3: Verify** build+lint. Commit `feat: add admin user management`.

---

## Task 6: Link admin + E2E + verifikasi

**Files:** `components/dashboard/sidebar.tsx` (modify), `tests/e2e/admin.spec.ts`.

- [ ] **Step 1: Link admin di dashboard** — di `app/dashboard/layout.tsx` (server) ambil role user; jika `admin`, render link "Admin" → `/admin` di sidebar/header. (Sidebar saat ini statis; teruskan prop `isAdmin` atau render link kondisional di layout.)
- [ ] **Step 2: E2E** `tests/e2e/admin.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("admin tanpa login redirect ke login", async ({ page }) => {
  await page.goto("/admin/themes");
  await expect(page).toHaveURL(/\/login/);
});
```
> (Uji akses penuh admin butuh sesi admin; controller verifikasi live dgn user yang dipromote.)
- [ ] **Step 3: Verifikasi controller (live):** login sebagai user admin (yang dipromote Task 1), buka `/admin/themes` → bisa edit metadata tema (mis. ubah popularity/badge minimalis-01) → cek di galeri `/dashboard/invitation/create` berubah. Buka `/admin/packages` → edit 1 paket. `/admin/users` → lihat daftar + ubah role user uji lalu kembalikan. Login sebagai user non-admin → `/admin` redirect ke `/dashboard`. Paste bukti. Bersihkan perubahan uji.
- [ ] **Step 4: Full check:** lint, test, build, test:e2e semua hijau.
- [ ] **Step 5: Commit** `test: add e2e for admin access guard`.

---

## Self-Review (penulis plan)

**Spec coverage (Fase 5 admin di `04-features.md` §7):**
- CRUD tema (metadata + thumbnail + aktif) → Task 3 ✓
- CRUD paket → Task 4 ✓
- Kelola user (status/role) → Task 5 ✓
- Konten landing & FAQ: landing dari DB (tema/paket) sudah ter-update via admin; FAQ statis (di luar scope admin sekarang) — dicatat.
- Transaksi → dilewati (Fase 4), dicatat.

**Placeholder scan:** Task 3 Step 5 & Task 4/5 menyebut "pola sama" TAPI memberi spesifikasi field + nama ekspor + perilaku konkret (bukan "lihat Task N"). Implementer wajib menulis kode form/list lengkap mengikuti pola Task 3 yang kodenya penuh. Tidak ada TODO menggantung selain defer eksplisit (transaksi/email/FAQ-admin).

**Type consistency:** Server actions `saveTheme`/`deleteTheme`/`savePackage`/`deletePackage`/`setUserRole` dipakai konsisten di form/list. `themeSchema`/`packageSchema` map camelCase→snake_case di action. `requireAdmin()` (layout) vs `adminClient()` (actions) dua jalur cek admin (layout untuk gate halaman, action untuk gate mutasi + RLS sebagai backstop). `THEME_KEYS` diekspor dari registry & dipakai di form.

**Keamanan:** Gate ganda (server `requireAdmin` + RLS `is_admin()`). RLS admin pakai `security definer` `is_admin()` (search_path pinned). Bucket `themes` write admin-only. Tanpa service-role secret.
