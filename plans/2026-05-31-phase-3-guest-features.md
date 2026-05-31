# Fase 3 — Fitur Tamu: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Tamu yang membuka undangan bisa mengirim **RSVP + ucapan & doa**, yang langsung muncul di "buku tamu" undangan dan di dashboard pemilik (lihat/moderasi spam/hapus/export). Plus **galeri foto multi-upload** di editor.

**Architecture:** Submit & baca RSVP publik lewat **RPC `security definer`** (`submit_rsvp`, `get_public_rsvps`) yang hanya melayani undangan `active` — sehingga policy anon-insert langsung ke tabel `rsvps` DIBUANG (menutup temuan review Fase 0 #4). Buku tamu di tema = client component yang memuat & mengirim via Server Actions. Dashboard RSVP membaca `rsvps` via RLS owner-select, dengan Server Actions moderasi (spam/hapus). Export CSV dibuat client-side.

**Tech Stack:** Next.js 16, Supabase (Postgres RPC + RLS), Zod v4, Vitest, Playwright.

**Prasyarat (Fase 0–2):** tabel `rsvps` (invitation_id, guest_name, attendance enum hadir/tidak/ragu, headcount, message, is_spam) + RLS (`rsvp_owner_select`, `rsvp_public_insert`); RPC `get_public_invitation`; tema `minimalis-01` + `ThemeRenderer`; editor + `ImageUpload`; demo `andi-dan-sari`.

---

## Keputusan & batasan
- Submit RSVP HANYA via RPC `submit_rsvp` (validasi server, hanya undangan active). **Drop** policy `rsvp_public_insert` (anon tak bisa insert langsung ke tabel).
- Buku tamu publik (ucapan wall) via RPC `get_public_rsvps` (tanpa kolom sensitif, exclude `is_spam`, limit 200, urut terbaru).
- **Di-defer (data didukung, UI nanti):** love story, livestream, prewed video. **Realtime** dashboard di-defer (pakai refresh manual / `router.refresh`); cukup fetch saat load.
- RSVP section ada di tema; memuat datanya sendiri (client) memakai `view.slug` — signature `ThemeRenderer({view, guestName})` TIDAK berubah.

---

## File Structure
```
supabase/migrations/0004_rsvp.sql            # RPC submit/get + drop anon insert policy
lib/validation/rsvp.ts                        # zod submit schema
lib/invitation/rsvp.ts                        # server actions: submitRsvp, getPublicRsvps, toggleRsvpSpam, deleteRsvp
components/invitation/ui/rsvp-section.tsx      # client: form + buku tamu (dipakai tema)
themes/minimalis-01/sections.tsx (modify)     # tambah export RsvpWall wrapper? -> pakai komponen client langsung di index
themes/minimalis-01/index.tsx (modify)        # sisipkan <RsvpSection slug=.. />
components/dashboard/invitation-editor.tsx (modify)  # section Galeri multi-upload
components/dashboard/rsvp-manager.tsx          # client: list + spam/hapus + export CSV
app/dashboard/invitation/[id]/rsvp/page.tsx    # halaman kelola RSVP
tests/unit/rsvp-validation.test.ts
tests/e2e/rsvp.spec.ts
```

---

## Task 1: RSVP RPCs + tutup anon insert

**Files:** `supabase/migrations/0004_rsvp.sql`. Apply via psql (DSN dari controller; jangan commit).

- [ ] **Step 1: Migrasi**
```sql
-- Submit RSVP hanya untuk undangan aktif (security definer).
create or replace function public.submit_rsvp(
  p_slug text, p_name text, p_attendance text, p_headcount int, p_message text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    return json_build_object('ok', false, 'error', 'Nama harus diisi');
  end if;
  if p_attendance not in ('hadir', 'tidak', 'ragu') then
    return json_build_object('ok', false, 'error', 'Kehadiran tidak valid');
  end if;

  select i.id into v_id from invitations i
  where i.slug = p_slug and i.status = 'active'
    and (i.expires_at is null or i.expires_at > now())
  limit 1;

  if v_id is null then
    return json_build_object('ok', false, 'error', 'Undangan tidak aktif');
  end if;

  insert into rsvps (invitation_id, guest_name, attendance, headcount, message)
  values (v_id, left(trim(p_name), 120), p_attendance, greatest(1, coalesce(p_headcount, 1)), left(coalesce(p_message, ''), 1000));

  return json_build_object('ok', true);
end;
$$;

-- Buku tamu publik (tanpa kolom sensitif, exclude spam).
create or replace function public.get_public_rsvps(p_slug text)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'guestName', r.guest_name,
    'attendance', r.attendance,
    'message', r.message,
    'createdAt', r.created_at
  ) order by r.created_at desc), '[]'::json)
  from rsvps r
  join invitations i on i.id = r.invitation_id
  where i.slug = p_slug and i.status = 'active' and r.is_spam = false
  limit 200;
$$;

grant execute on function public.submit_rsvp(text, text, text, int, text) to anon, authenticated;
grant execute on function public.get_public_rsvps(text) to anon, authenticated;

-- Tutup jalur insert langsung anon (submit kini via RPC security definer).
drop policy if exists "rsvp_public_insert" on rsvps;
```

- [ ] **Step 2: Apply & verify**
Run: `PGCONNECT_TIMEOUT=10 psql "<dsn>" -v ON_ERROR_STOP=1 -f supabase/migrations/0004_rsvp.sql`
Verify:
- `psql "<dsn>" -tAc "select public.submit_rsvp('andi-dan-sari','Uji Tamu','hadir',2,'Selamat ya!');"` → `{"ok":true}`.
- `psql "<dsn>" -tAc "select public.get_public_rsvps('andi-dan-sari');"` → array berisi entri "Uji Tamu".
- Bersihkan entri uji: `psql "<dsn>" -tAc "delete from rsvps r using invitations i where r.invitation_id=i.id and i.slug='andi-dan-sari' and r.guest_name='Uji Tamu';"`
Paste output.

- [ ] **Step 3: Commit** `feat: add rsvp submit/read RPCs and drop anon insert policy`

---

## Task 2: Validasi + Server Actions RSVP

**Files:** `lib/validation/rsvp.ts`, `lib/invitation/rsvp.ts`. TDD untuk validasi.

- [ ] **Step 1: Failing test** `tests/unit/rsvp-validation.test.ts`
```ts
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { rsvpSchema } from "@/lib/validation/rsvp";

describe("rsvpSchema", () => {
  it("accepts valid", () => {
    expect(rsvpSchema.safeParse({ name: "Budi", attendance: "hadir", headcount: 2, message: "Selamat" }).success).toBe(true);
  });
  it("rejects empty name", () => {
    expect(rsvpSchema.safeParse({ name: "", attendance: "hadir", headcount: 1 }).success).toBe(false);
  });
  it("rejects bad attendance", () => {
    expect(rsvpSchema.safeParse({ name: "Budi", attendance: "mungkin", headcount: 1 }).success).toBe(false);
  });
});
```
- [ ] **Step 2: Run, fail** — `npm run test -- rsvp-validation`
- [ ] **Step 3: Schema** `lib/validation/rsvp.ts`
```ts
import { z } from "zod";

export const rsvpSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(120),
  attendance: z.enum(["hadir", "tidak", "ragu"]),
  headcount: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().max(1000).optional().default(""),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;
```
- [ ] **Step 4: Run, pass** (3 tests)
- [ ] **Step 5: Server actions** `lib/invitation/rsvp.ts`
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { rsvpSchema } from "@/lib/validation/rsvp";

export type PublicRsvp = { guestName: string; attendance: string; message: string | null; createdAt: string };

export async function getPublicRsvps(slug: string): Promise<PublicRsvp[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_rsvps", { p_slug: slug });
  if (error || !data) return [];
  return data as PublicRsvp[];
}

export async function submitRsvp(slug: string, formData: FormData) {
  const parsed = rsvpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_rsvp", {
    p_slug: slug,
    p_name: parsed.data.name,
    p_attendance: parsed.data.attendance,
    p_headcount: parsed.data.headcount,
    p_message: parsed.data.message,
  });
  if (error) return { error: "Gagal mengirim. Coba lagi." };
  const res = data as { ok: boolean; error?: string };
  if (!res.ok) return { error: res.error ?? "Gagal mengirim." };
  return { success: "Terima kasih! Ucapan Anda terkirim." };
}

async function ownerGuard(rsvpId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  // RLS rsvp_owner_select hanya izinkan baca milik sendiri; update/delete butuh policy owner.
  return { supabase, user, ok: true as const };
}

export async function toggleRsvpSpam(rsvpId: string, isSpam: boolean) {
  const { supabase, ok } = await ownerGuard(rsvpId);
  if (!ok) return { error: "Sesi habis." };
  const { error } = await supabase.from("rsvps").update({ is_spam: isSpam }).eq("id", rsvpId);
  if (error) return { error: "Gagal memperbarui." };
  return { success: "Diperbarui." };
}

export async function deleteRsvp(rsvpId: string) {
  const { supabase, ok } = await ownerGuard(rsvpId);
  if (!ok) return { error: "Sesi habis." };
  const { error } = await supabase.from("rsvps").delete().eq("id", rsvpId);
  if (error) return { error: "Gagal menghapus." };
  return { success: "Dihapus." };
}
```
> CATATAN: `rsvps` saat ini hanya punya RLS `rsvp_owner_select` (SELECT). Untuk `update`/`delete` oleh pemilik, Task 1 migrasi HARUS menambah policy:
> ```sql
> create policy "rsvp_owner_update" on rsvps for update
>   using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));
> create policy "rsvp_owner_delete" on rsvps for delete
>   using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));
> ```
> Tambahkan kedua policy ini ke `0004_rsvp.sql` (idempoten: `drop policy if exists` dulu).

- [ ] **Step 6: Build + commit** `feat: add rsvp server actions and validation`

---

## Task 3: Buku tamu di tema (form + wall)

**Files:** `components/invitation/ui/rsvp-section.tsx`; modify `themes/minimalis-01/index.tsx`.

- [ ] **Step 1: RSVP section (client)**
`components/invitation/ui/rsvp-section.tsx`:
```tsx
"use client";
import { useEffect, useState, useTransition } from "react";
import { getPublicRsvps, submitRsvp, type PublicRsvp } from "@/lib/invitation/rsvp";

export function RsvpSection({ slug, guestName }: { slug: string; guestName?: string }) {
  const [list, setList] = useState<PublicRsvp[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => { getPublicRsvps(slug).then(setList); }, [slug]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    e.currentTarget.reset();
    start(async () => {
      const r = await submitRsvp(slug, form);
      if (r.error) { setErr(r.error); setMsg(""); }
      else { setMsg(r.success ?? ""); setErr(""); setList(await getPublicRsvps(slug)); }
    });
  }

  const label = { hadir: "Hadir", tidak: "Tidak hadir", ragu: "Masih ragu" } as const;
  return (
    <section style={{ padding: "56px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#7c8b78" }}>RSVP &amp; Ucapan</p>
      <div style={{ width: 48, height: 1, background: "#cdbfa8", margin: "20px auto" }} />
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 360, margin: "0 auto", textAlign: "left" }}>
        <input name="name" defaultValue={guestName ?? ""} placeholder="Nama Anda" required
          style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }} />
        <select name="attendance" defaultValue="hadir" style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }}>
          <option value="hadir">Hadir</option>
          <option value="tidak">Tidak hadir</option>
          <option value="ragu">Masih ragu</option>
        </select>
        <input name="headcount" type="number" min={1} max={20} defaultValue={1} placeholder="Jumlah tamu"
          style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }} />
        <textarea name="message" placeholder="Ucapan & doa" rows={3}
          style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }} />
        <button disabled={pending} style={{ padding: "10px", background: "#7c8b78", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          {pending ? "Mengirim..." : "Kirim"}
        </button>
        {msg && <p style={{ color: "#2d6a4f", fontSize: 14 }}>{msg}</p>}
        {err && <p style={{ color: "#b3261e", fontSize: 14 }}>{err}</p>}
      </form>

      <div style={{ marginTop: 32, display: "grid", gap: 12, maxWidth: 360, margin: "32px auto 0", textAlign: "left" }}>
        {list.map((r, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #ece2cf", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ fontSize: 14 }}>{r.guestName}</strong>
              <span style={{ fontSize: 12, color: "#7c8b78" }}>{label[r.attendance as keyof typeof label] ?? r.attendance}</span>
            </div>
            {r.message && <p style={{ fontSize: 14, color: "#46544c", marginTop: 4 }}>{r.message}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Sisipkan ke tema** — `themes/minimalis-01/index.tsx`: import `RsvpSection` dan render sebelum `Closing`:
```tsx
import { RsvpSection } from "@/components/invitation/ui/rsvp-section";
// ... di dalam <main>, setelah <GiftSection> sebelum <Closing>:
<RsvpSection slug={view.slug} guestName={guestName} />
```

- [ ] **Step 3: Verify** build+lint. Commit `feat: add RSVP guestbook section to theme`.

---

## Task 4: Galeri multi-upload di editor

**Files:** modify `components/dashboard/invitation-editor.tsx`.

- [ ] **Step 1: Tambah section Galeri** (setelah section Musik, sebelum sticky bar). State `data.gallery` (string[]).
```tsx
// helper di komponen:
function addGalleryUrl(url: string) {
  setData((d) => ({ ...d, gallery: [...d.gallery, url] }));
}
function removeGalleryUrl(i: number) {
  setData((d) => ({ ...d, gallery: d.gallery.filter((_, idx) => idx !== i) }));
}
```
JSX section:
```tsx
<div className={sec}>
  <h2 className={h}>Galeri Foto</h2>
  <div className="grid grid-cols-3 gap-2 mb-3">
    {data.gallery.map((url, i) => (
      <div key={i} className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded gallery image */}
        <img src={url} alt="" className="w-full h-24 object-cover rounded" />
        <button onClick={() => removeGalleryUrl(i)} className="absolute top-1 right-1 bg-neg text-white rounded-full w-5 h-5 text-xs">×</button>
      </div>
    ))}
  </div>
  <ImageUpload userId={userId} invitationId={id} label="Tambah foto galeri" onChange={addGalleryUrl} />
</div>
```
> `ImageUpload` memanggil `onChange(url)` setelah upload; di sini `addGalleryUrl` menambah ke array (bukan mengganti). `value` dikosongkan agar bisa upload berulang.

- [ ] **Step 2: Verify** build+lint. Commit `feat: add gallery multi-upload to editor`.

---

## Task 5: Dashboard kelola RSVP + export CSV

**Files:** `app/dashboard/invitation/[id]/rsvp/page.tsx`, `components/dashboard/rsvp-manager.tsx`.

- [ ] **Step 1: Halaman (server)**
`app/dashboard/invitation/[id]/rsvp/page.tsx`:
```tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RsvpManager } from "@/components/dashboard/rsvp-manager";

export default async function RsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: inv } = await supabase.from("invitations").select("id, title, user_id").eq("id", id).maybeSingle();
  if (!inv || inv.user_id !== user.id) notFound();
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("id, guest_name, attendance, headcount, message, is_spam, created_at")
    .eq("invitation_id", id)
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">RSVP — {inv.title}</h1>
      <p className="text-ink-3 mb-6">Daftar kehadiran & ucapan tamu.</p>
      <RsvpManager items={rsvps ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Manager (client)**
`components/dashboard/rsvp-manager.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRsvpSpam, deleteRsvp } from "@/lib/invitation/rsvp";

type Item = { id: string; guest_name: string; attendance: string; headcount: number; message: string | null; is_spam: boolean; created_at: string };
const ATT: Record<string, string> = { hadir: "Hadir", tidak: "Tidak hadir", ragu: "Ragu" };

export function RsvpManager({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const total = items.length;
  const hadir = items.filter((i) => i.attendance === "hadir" && !i.is_spam).reduce((s, i) => s + (i.headcount || 1), 0);

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    start(async () => { const r = await fn(); setMsg(r.error ?? r.success ?? ""); router.refresh(); });
  }
  function exportCsv() {
    const rows = [["Nama", "Kehadiran", "Jumlah", "Ucapan", "Waktu"],
      ...items.map((i) => [i.guest_name, i.attendance, String(i.headcount), (i.message ?? "").replace(/\n/g, " "), i.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "rsvp.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (!total) return <p className="text-ink-3">Belum ada RSVP.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <p className="text-sm text-ink-2">Total entri: <strong>{total}</strong> · Total hadir: <strong>{hadir}</strong> orang</p>
        <button onClick={exportCsv} className="text-sm border border-line-strong rounded-sm px-3 py-1.5">Export CSV</button>
      </div>
      {msg && <p className="text-sm text-pos">{msg}</p>}
      {items.map((it) => (
        <div key={it.id} className={`bg-card border rounded p-4 ${it.is_spam ? "border-neg/40 opacity-60" : "border-line"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{it.guest_name} <span className="text-xs text-ink-3">· {ATT[it.attendance] ?? it.attendance} · {it.headcount} org</span></p>
              {it.message && <p className="text-sm text-ink-2 mt-1">{it.message}</p>}
            </div>
            <div className="flex gap-2 text-sm shrink-0">
              <button disabled={pending} onClick={() => run(() => toggleRsvpSpam(it.id, !it.is_spam))} className="border border-line-strong rounded-sm px-3 py-1.5">
                {it.is_spam ? "Bukan spam" : "Tandai spam"}
              </button>
              <button disabled={pending} onClick={() => { if (confirm("Hapus RSVP ini?")) run(() => deleteRsvp(it.id)); }} className="border border-neg rounded-sm px-3 py-1.5 text-neg">Hapus</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Link dari daftar undangan** — `components/dashboard/invitation-list.tsx`: tambah link "RSVP" → `/dashboard/invitation/${it.id}/rsvp` (di samping Edit/Preview).
- [ ] **Step 4: Verify** build+lint. Commit `feat: add dashboard RSVP management with CSV export`.

---

## Task 6: E2E + verifikasi live

**Files:** `tests/e2e/rsvp.spec.ts`.

- [ ] **Step 1: Smoke test** (pakai demo `andi-dan-sari` yang active)
```ts
import { test, expect } from "@playwright/test";

test("tamu kirim RSVP di undangan demo lalu muncul di buku tamu", async ({ page }) => {
  const nama = `Tamu ${Date.now()}`;
  await page.goto("/andi-dan-sari");
  await page.getByPlaceholder("Nama Anda").fill(nama);
  await page.getByPlaceholder("Ucapan & doa").fill("Selamat menempuh hidup baru!");
  await page.getByRole("button", { name: "Kirim" }).click();
  await expect(page.getByText("Ucapan Anda terkirim", { exact: false })).toBeVisible();
  await expect(page.getByText(nama, { exact: false })).toBeVisible();
});
```
- [ ] **Step 2: Run** `npm run test:e2e` → semua pass (1 baru + 7 lama = 8). Setelah lulus, bersihkan entri uji via psql: `delete from rsvps r using invitations i where r.invitation_id=i.id and i.slug='andi-dan-sari' and r.guest_name like 'Tamu %';`
- [ ] **Step 3: Verifikasi controller (live):** buka `/andi-dan-sari`, kirim 1 RSVP → muncul di buku tamu. Login pemilik demo? (demo dimiliki user `demo@harih.local` — tanpa password login mudah; cukup verifikasi tabel: `select guest_name, attendance from rsvps r join invitations i on i.id=r.invitation_id where i.slug='andi-dan-sari';`). Konfirmasi spam toggle & delete via UI bila login tersedia, else via SQL. Bersihkan entri uji. Paste bukti.
- [ ] **Step 4: Full check:** `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` semua hijau.
- [ ] **Step 5: Commit** `test: add e2e for guest RSVP flow`.

---

## Self-Review (penulis plan)

**Spec coverage (Fase 3 di `06-roadmap.md`):**
- RSVP + ucapan & doa (tamu submit) → Task 1, 2, 3 ✓
- Muncul di undangan (buku tamu) → Task 3 ✓
- Dashboard kelola RSVP (lihat, moderasi spam, hapus, export) → Task 5 ✓
- Galeri multi-upload → Task 4 ✓
- "Selesai bila tamu buka link → RSVP → muncul" → Task 6 (e2e + live) ✓
- Countdown/maps/musik/amplop = sudah Fase 1/2.

**Placeholder scan:** Tidak ada TODO menggantung. Realtime & love story/livestream/prewed = keputusan defer eksplisit.

**Type consistency:** `PublicRsvp { guestName, attendance, message, createdAt }` dari RPC (camelCase di json_build_object) konsisten dgn pemakaian di `RsvpSection`/lib. Server actions `submitRsvp(slug, FormData)`, `getPublicRsvps(slug)`, `toggleRsvpSpam(id, bool)`, `deleteRsvp(id)` dipakai konsisten. RPC params (`p_slug,p_name,p_attendance,p_headcount,p_message`) cocok dengan pemanggilan `.rpc(...)`. Enum attendance hadir/tidak/ragu konsisten DB↔Zod↔UI.

**Keamanan:** submit via security-definer RPC (hanya undangan active), policy anon-insert dibuang (menutup review Fase 0 #4). Owner update/delete RSVP via RLS policy baru + cek sesi di action. RPC publik tidak mengembalikan kolom sensitif & exclude spam.

## Known Issues / Deferred (dari final code review Fase 3)

Sudah diperbaiki:
- ✅ Moderasi (spam/hapus) pakai `.select("id")` + cek baris → tidak lagi "false success" saat RLS memblokir baris milik orang lain.
- ✅ Export CSV: sanitasi formula injection (sel diawali `= + - @` diberi prefix `'`).
- ✅ RPC `submit_rsvp` cap headcount `least(20, ...)` (defense-in-depth, samai Zod) + verifikasi 999→20.
- ✅ Label dashboard: "Total entri (termasuk spam)".
- ✅ Key buku tamu pakai `createdAt` (bukan index).

Di-defer:
- **Rate-limit / anti-spam submit anonim** (I-3): belum ada throttle/captcha. Diterima untuk launch (target obscure & berumur pendek). TODO tercatat di `0004_rsvp.sql`. Saat hardening: rate-limit per IP/undangan atau RSVP publik default `pending` (perlu approval owner sebelum tampil).
- **Realtime dashboard**: pakai refresh manual; subscribe Supabase Realtime menyusul.
- **Love story / livestream / prewed video**: data didukung schema, UI menyusul.
