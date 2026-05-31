# Fase 5d — Program Reseller: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. Steps pakai checkbox `- [ ]`.

**Goal:** User bisa mendaftar jadi reseller (status `pending`), admin menyetujui (`active`) sehingga reseller mendapat **kode referral** + tautan ajakan. Atribusi komisi dilewati (butuh transaksi/Fase 4) — dicatat.

**Architecture:** Tabel `resellers` (sudah ada) + RLS (self select/insert, admin all). Pendaftaran via Server Action (generate kode unik). Approval via panel admin. UI dashboard reseller menampilkan status/kode/link. Pakai design Rukos.

**Tech Stack:** Next.js 16 (RSC + Server Actions), Supabase (RLS), Zod, Playwright.

**Prasyarat:** Fase 0–5c. Tabel `resellers` (user_id, code unik, commission_rate, status enum pending/active) — RLS enabled tapi BELUM ada policy (fail-closed, dari review Fase 0). `profiles.role` enum punya `reseller`. Panel admin + `is_admin()` ada. Trigger `guard_profile_protected_cols` (0007) hanya izinkan admin/service ubah `role` → approval reseller (yang set role) berjalan dari action admin (is_admin() true).

---

## Keputusan & batasan
- **Komisi/atribusi DILEWATI** (perlu transaksi Fase 4). Reseller dapat kode + link; tracking menyusul. Link = `/{origin}/register?ref=CODE` (param `ref` belum diproses — dicatat).
- Pendaftaran: user login → apply → `resellers` row `status=pending`. Satu user maksimal satu pendaftaran (unik per user_id).
- Approval admin → `status=active` + set `profiles.role='reseller'`. Reject → hapus row (atau biarkan pending). Pakai hapus untuk sederhana.
- `commission_rate` default 0 (admin bisa set nanti; UI set opsional — sertakan input sederhana di admin).

---

## File Structure
```
supabase/migrations/0009_reseller.sql       # RLS resellers (self + admin) + unique user_id
lib/validation/reseller.ts                    # zod apply schema
lib/reseller/actions.ts                       # applyReseller, approveReseller, rejectReseller
app/dashboard/reseller/page.tsx               # apply / status+code+link
components/dashboard/reseller-apply.tsx        # client form/status
app/admin/resellers/page.tsx                  # admin list + approve/reject
components/admin/reseller-row.tsx              # client baris reseller
components/dashboard/sidebar.tsx (modify)      # link "Reseller"
app/admin/layout.tsx (modify)                  # nav "Reseller"
tests/e2e/reseller.spec.ts
```

---

## Task 1: RLS resellers + unik per user

**Files:** `supabase/migrations/0009_reseller.sql`. Apply via psql (DSN dari controller).

- [ ] **Step 1: Migrasi (idempoten)**
```sql
-- Satu pendaftaran per user
create unique index if not exists resellers_user_id_unique on resellers (user_id);

-- RLS: user lihat & daftar miliknya; admin kelola semua
drop policy if exists "resellers_self_select" on resellers;
create policy "resellers_self_select" on resellers for select using (auth.uid() = user_id);

drop policy if exists "resellers_self_insert" on resellers;
create policy "resellers_self_insert" on resellers for insert
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "resellers_admin_all" on resellers;
create policy "resellers_admin_all" on resellers for all
  using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Apply & verify** — `psql ... -f supabase/migrations/0009_reseller.sql`. Verify policy ada: `select policyname from pg_policies where tablename='resellers';` → 3 policy. Paste output.
- [ ] **Step 3: Commit** `feat: add reseller RLS policies`

---

## Task 2: Validasi + Server Actions

**Files:** `lib/validation/reseller.ts`, `lib/reseller/actions.ts`.

- [ ] **Step 1: Validasi** `lib/validation/reseller.ts`
```ts
import { z } from "zod";
export const applyResellerSchema = z.object({
  // Tidak ada field user wajib selain persetujuan; sediakan placeholder bila perlu.
  agree: z.literal("on", { message: "Anda harus menyetujui ketentuan." }),
});
```

- [ ] **Step 2: Server actions** `lib/reseller/actions.ts`
```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `REF${s}`;
}

export async function applyReseller(_prev: unknown, formData: FormData) {
  if (formData.get("agree") !== "on") return { error: "Anda harus menyetujui ketentuan." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi habis." };

  const { data: existing } = await supabase.from("resellers").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) return { error: "Anda sudah mendaftar." };

  // generate kode unik (retry sekali bila bentrok)
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = genCode();
    const { error } = await supabase.from("resellers").insert({ user_id: user.id, code, status: "pending" });
    if (!error) { revalidatePath("/dashboard/reseller"); return { success: "Pendaftaran terkirim, menunggu persetujuan admin." }; }
    if (error.code !== "23505") return { error: "Gagal mendaftar." };
  }
  return { error: "Gagal membuat kode, coba lagi." };
}

async function adminGuard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, ok: p?.role === "admin" };
}

export async function approveReseller(resellerId: string, commissionRate: number) {
  const { supabase, ok } = await adminGuard();
  if (!ok) return { error: "Akses ditolak." };
  const { data: r } = await supabase.from("resellers").select("user_id").eq("id", resellerId).maybeSingle();
  if (!r) return { error: "Tidak ditemukan." };
  const { error: e1 } = await supabase.from("resellers").update({ status: "active", commission_rate: commissionRate }).eq("id", resellerId);
  if (e1) return { error: "Gagal menyetujui." };
  await supabase.from("profiles").update({ role: "reseller" }).eq("id", r.user_id);
  revalidatePath("/admin/resellers");
  return { success: "Reseller disetujui." };
}

export async function rejectReseller(resellerId: string) {
  const { supabase, ok } = await adminGuard();
  if (!ok) return { error: "Akses ditolak." };
  const { error } = await supabase.from("resellers").delete().eq("id", resellerId);
  if (error) return { error: "Gagal." };
  revalidatePath("/admin/resellers");
  return { success: "Pendaftaran ditolak." };
}
```
> Catatan: `Math.random()` boleh di server action (runtime biasa). Approval set `profiles.role='reseller'` — diizinkan trigger 0007 karena pemanggil admin (`is_admin()` true).

- [ ] **Step 3: Build + commit** `feat: add reseller server actions`

---

## Task 3: Halaman reseller (dashboard)

**Files:** `app/dashboard/reseller/page.tsx`, `components/dashboard/reseller-apply.tsx`, `components/dashboard/sidebar.tsx` (modify).

- [ ] **Step 1: Page (server)** `app/dashboard/reseller/page.tsx`
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResellerApply } from "@/components/dashboard/reseller-apply";

export default async function ResellerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: reseller } = await supabase
    .from("resellers").select("code, status, commission_rate").eq("user_id", user.id).maybeSingle();
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-ink mb-1">Program Reseller</h1>
      <p className="text-ink-3 mb-6">Ajak pasangan lain & dapatkan komisi (segera hadir).</p>
      <ResellerApply reseller={reseller ?? null} />
    </div>
  );
}
```

- [ ] **Step 2: Client** `components/dashboard/reseller-apply.tsx`
```tsx
"use client";
import { useActionState, useState } from "react";
import { applyReseller } from "@/lib/reseller/actions";

type Reseller = { code: string; status: string; commission_rate: number } | null;

export function ResellerApply({ reseller }: { reseller: Reseller }) {
  const [state, action, pending] = useActionState(applyReseller, null);
  const [copied, setCopied] = useState(false);

  if (reseller) {
    const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${reseller.code}` : "";
    return (
      <div className="bg-card border border-line rounded p-6 space-y-3">
        <p className="text-sm">Status: <span className={`rounded-full px-2 py-0.5 text-xs ${reseller.status === "active" ? "bg-pos-soft text-pos" : "bg-warn-soft text-warn"}`}>{reseller.status === "active" ? "Aktif" : "Menunggu persetujuan"}</span></p>
        {reseller.status === "active" && (
          <>
            <div>
              <p className="text-sm text-ink-2">Kode referral</p>
              <p className="font-display text-2xl text-brand">{reseller.code}</p>
            </div>
            <div>
              <p className="text-sm text-ink-2 mb-1">Tautan ajakan</p>
              <div className="flex gap-2">
                <input readOnly value={link} className="flex-1 border border-line rounded-sm px-3 py-2 text-sm" />
                <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="bg-brand text-white rounded-sm px-4 text-sm">{copied ? "Disalin!" : "Salin"}</button>
              </div>
            </div>
            <p className="text-xs text-ink-3">Komisi: {reseller.commission_rate}% (pelacakan otomatis segera hadir).</p>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="bg-card border border-line rounded p-6 space-y-4">
      {state?.error && <p className="text-neg text-sm">{state.error}</p>}
      {state?.success && <p className="text-pos text-sm">{state.success}</p>}
      <p className="text-sm text-ink-2">Daftar sebagai reseller untuk mendapat kode referral. Admin akan meninjau pendaftaran Anda.</p>
      <label className="flex items-start gap-2 text-sm text-ink-2">
        <input type="checkbox" name="agree" className="mt-1" /> Saya menyetujui ketentuan program reseller.
      </label>
      <button disabled={pending} className="bg-brand text-white rounded-sm px-6 py-2.5 disabled:opacity-60">{pending ? "Mengirim..." : "Daftar Reseller"}</button>
    </form>
  );
}
```

- [ ] **Step 3: Link sidebar** — `components/dashboard/sidebar.tsx`: tambah item `{ label: "Reseller", href: "/dashboard/reseller" }` di daftar nav.
- [ ] **Step 4: Verify** build+lint. Commit `feat: add reseller registration page`.

---

## Task 4: Admin reseller

**Files:** `app/admin/resellers/page.tsx`, `components/admin/reseller-row.tsx`, `app/admin/layout.tsx` (modify nav).

- [ ] **Step 1: Page (server)** `app/admin/resellers/page.tsx`
```tsx
import { createClient } from "@/lib/supabase/server";
import { ResellerRow } from "@/components/admin/reseller-row";

export default async function AdminResellersPage() {
  const supabase = await createClient();
  const { data: resellers } = await supabase
    .from("resellers")
    .select("id, code, status, commission_rate, created_at, profiles(full_name, phone)")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Reseller</h1>
      <div className="space-y-2">
        {(resellers ?? []).map((r) => (<ResellerRow key={r.id} reseller={r} />))}
        {!resellers?.length && <p className="text-ink-3">Belum ada pendaftaran reseller.</p>}
      </div>
    </div>
  );
}
```
> Implementer: `profiles` relasi bisa array/objek (tangani seperti pola admin sebelumnya).

- [ ] **Step 2: Row (client)** `components/admin/reseller-row.tsx` — tampilkan nama/kode/status; jika `pending`: input komisi (%) + tombol "Setujui" (`approveReseller(id, rate)`) & "Tolak" (`rejectReseller(id)`); jika `active`: tampil komisi. Pakai `useTransition` + `router.refresh()`. Token deposit.
- [ ] **Step 3: Nav admin** — `app/admin/layout.tsx`: tambah item `{ label: "Reseller", href: "/admin/resellers" }`.
- [ ] **Step 4: Verify** build+lint. Commit `feat: add admin reseller management`.

---

## Task 5: E2E + verifikasi live

**Files:** `tests/e2e/reseller.spec.ts`.

- [ ] **Step 1: Test (guard)**
```ts
import { test, expect } from "@playwright/test";
test("halaman reseller butuh login", async ({ page }) => {
  await page.goto("/dashboard/reseller");
  await expect(page).toHaveURL(/\/login/);
});
test("admin resellers butuh login", async ({ page }) => {
  await page.goto("/admin/resellers");
  await expect(page).toHaveURL(/\/login/);
});
```
- [ ] **Step 2: Run** `npm run test:e2e` → semua pass (2 baru + 14 lama = 16).
- [ ] **Step 3: Verifikasi controller (live):** register user uji → `/dashboard/reseller` → centang setuju → Daftar → status "Menunggu". Login admin → `/admin/resellers` → Setujui (komisi mis. 10) → user jadi role reseller, status active, kode muncul di `/dashboard/reseller` + link. Bersihkan user uji + row reseller via psql. Paste bukti.
- [ ] **Step 4: Full check:** lint, test, build, test:e2e hijau.
- [ ] **Step 5: Commit** `test: add e2e for reseller flow`

---

## Self-Review (penulis plan)

**Spec coverage:** Roadmap Fase 5 "program reseller" → pendaftaran + approval admin + kode referral + link ✓. Komisi/atribusi = defer eksplisit (butuh Fase 4 transaksi).

**Placeholder scan:** Tidak ada TODO menggantung selain defer (atribusi `?ref=` belum diproses, komisi). Kode action & komponen lengkap.

**Type consistency:** `applyReseller`/`approveReseller`/`rejectReseller` dipakai konsisten. RLS: self insert hanya `status='pending'` + `auth.uid()=user_id`; admin via `is_admin()`. Approval set `profiles.role='reseller'` (diizinkan trigger 0007 karena admin). `resellers.code` unik (Fase 0) + retry 23505. Unik `user_id` (index baru) cegah daftar ganda.

**Keamanan:** Insert reseller dibatasi RLS (`auth.uid()=user_id`, status pending) — user tak bisa langsung bikin dirinya active. Approval (set active + role) hanya admin. Trigger 0007 tetap mencegah self-escalation role oleh non-admin.

## Known Issues / Deferred (dari final review Fase 5d)

Sudah diperbaiki:
- ✅ I1: `approveReseller` kini cek error update `profiles` (hindari zombie state status-active-tapi-role-belum).
- ✅ I2: `commission_rate` di-clamp 0..100 di action + constraint DB (`0010`).

Di-defer:
- Atribusi `?ref=CODE` & pelacakan komisi (butuh transaksi Fase 4).
- E2E happy-path apply/approve (diverifikasi live; belum jadi test commit).
- `reseller-apply` link pakai `window.location.origin` (kosong saat SSR awal; copy tetap jalan) — bisa diperbaiki via header origin.
