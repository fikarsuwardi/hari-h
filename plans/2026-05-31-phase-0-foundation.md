# Fase 0 — Fondasi: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun kerangka aplikasi Hari-H: project Next.js + Supabase, design system Rukos, skema database + RLS, autentikasi (register/login/reset), dan shell dashboard yang terproteksi.

**Architecture:** Next.js 15 App Router (RSC + Server Actions). Supabase untuk Postgres, Auth, Storage. Sesi auth dijaga via `@supabase/ssr` + middleware. Validasi input pakai Zod. Otorisasi data lewat Row Level Security. Design system Rukos diimplementasi sebagai CSS variables + Tailwind theme.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, `@supabase/supabase-js`, `@supabase/ssr`, Zod, Vitest (unit), Playwright (e2e), next/font (Fraunces + Plus Jakarta Sans).

**Referensi spec:** `../spec/01-tech-stack.md`, `../spec/03-data-model.md`, `../spec/07-design-system.md`, `../spec/06-roadmap.md` (Fase 0).

---

## File Structure (dibuat di fase ini)

```
app/
  layout.tsx                 # root layout: fonts, globals
  globals.css                # CSS vars Rukos + tailwind directives
  page.tsx                   # placeholder landing (diisi Fase 5)
  (auth)/
    login/page.tsx
    register/page.tsx
    lost-password/page.tsx
    actions.ts               # server actions: signIn, signUp, signOut, resetPassword
  dashboard/
    layout.tsx               # shell terproteksi (sidebar + header)
    page.tsx                 # dashboard kosong (redirect ke /dashboard/invitation nanti)
lib/
  supabase/
    client.ts                # browser client
    server.ts                # server client (cookies)
    middleware.ts            # helper refresh session
  validation/
    auth.ts                  # Zod schema: register, login, reset
  utils/
    slug.ts                  # generator slug
components/
  ui/                        # button, input, dst (restyle ke token Rukos)
  dashboard/
    sidebar.tsx
    header.tsx
middleware.ts                # root middleware (session refresh + guard)
supabase/
  migrations/
    0001_init.sql            # tabel + enum + RLS
tailwind.config.ts
tests/
  unit/
    auth-validation.test.ts
    slug.test.ts
  e2e/
    auth.spec.ts
```

---

## Task 1: Scaffold project Next.js

**Files:**
- Create: seluruh struktur dasar via `create-next-app`

- [ ] **Step 1: Jalankan create-next-app**

Dijalankan di dalam folder project (`hari-h/`). Karena folder sudah berisi `spec/`, `plans/`, `example/`, scaffold ke temp lalu pindahkan, atau gunakan flag direktori saat ini.

Run:
```bash
cd "/Users/fikarsuwardi/Documents/Cipta Asa Digital/hari-h"
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-npm
```
Expected: prompt "directory not empty" → pilih lanjutkan (file `spec/`,`plans/`,`example/` tidak ditimpa). Selesai dengan "Success! Created".

- [ ] **Step 2: Verifikasi dev server jalan**

Run:
```bash
npm run dev
```
Expected: server di `http://localhost:3000`, halaman default Next.js tampil. Hentikan (Ctrl-C) setelah verifikasi.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

## Task 2: Install dependencies tambahan

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime + dev deps**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```
Expected: terinstal tanpa error.

- [ ] **Step 2: Tambah script test di package.json**

Modify `package.json` bagian `"scripts"`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase, zod, vitest, playwright deps"
```

---

## Task 3: Konfigurasi Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Buat vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 2: Buat tests/setup.ts**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Verifikasi vitest jalan (belum ada test)**

Run: `npm run test`
Expected: "No test files found" (exit 0/1) — yang penting vitest ter-resolve tanpa error config.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "chore: configure vitest"
```

---

## Task 4: Design system Rukos (tokens + fonts)

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

Sumber token: `../spec/07-design-system.md`.

- [ ] **Step 1: Tulis tailwind.config.ts dengan token Rukos**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#fbf8f1", 2: "#f4eee1" },
        card: "#ffffff",
        line: { DEFAULT: "#ece4d4", strong: "#ddd2bc" },
        ink: { DEFAULT: "#1b3a2f", 2: "#46544c", 3: "#7d8a82" },
        brand: { DEFAULT: "#1b4332", soft: "#e7efe9" },
        clay: { DEFAULT: "#c2410c", press: "#9a3208", soft: "#fbeadf" },
        pos: { DEFAULT: "#2d6a4f", soft: "#e3f0e8" },
        neg: { DEFAULT: "#b3261e", soft: "#fbe6e3" },
        warn: { DEFAULT: "#b0790f", soft: "#f8eed6" },
        deposit: { DEFAULT: "#3f5e6c", soft: "#e6eef1" },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "10px", DEFAULT: "16px", lg: "22px" },
      boxShadow: {
        DEFAULT:
          "0 1px 2px rgba(27,58,47,.04), 0 8px 24px -12px rgba(27,58,47,.18)",
        lg: "0 12px 40px -12px rgba(27,58,47,.28)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Tulis app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --paper: #fbf8f1;
  --ink: #1b3a2f;
  --brand: #1b4332;
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-jakarta), system-ui, sans-serif;
}
```

- [ ] **Step 3: Tulis app/layout.tsx (load fonts)**

```tsx
import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Hari-H — Undangan Pernikahan Digital",
  description: "Buat undangan pernikahan digital yang elegan dan praktis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verifikasi build CSS**

Ganti `app/page.tsx` jadi placeholder sederhana:
```tsx
export default function Home() {
  return (
    <main className="p-10">
      <h1 className="font-display text-4xl text-brand">Hari-H</h1>
      <p className="text-ink-2 mt-2">Fondasi siap.</p>
    </main>
  );
}
```
Run: `npm run dev` → buka `http://localhost:3000`.
Expected: judul serif hijau di atas background cream. Hentikan server.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: add Rukos design system (tokens + fonts)"
```

---

## Task 5: Slug util (TDD)

**Files:**
- Create: `lib/utils/slug.ts`
- Test: `tests/unit/slug.test.ts`

- [ ] **Step 1: Tulis failing test**

```ts
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Putri dan Putra")).toBe("putri-dan-putra");
  });
  it("strips non-alphanumeric except dash", () => {
    expect(slugify("Andi & Sari!")).toBe("andi-sari");
  });
  it("collapses multiple dashes and trims", () => {
    expect(slugify("  a   b  ")).toBe("a-b");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm run test -- slug`
Expected: FAIL — "Cannot find module '@/lib/utils/slug'".

- [ ] **Step 3: Implementasi minimal**

`lib/utils/slug.ts`:
```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `npm run test -- slug`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/utils/slug.ts tests/unit/slug.test.ts
git commit -m "feat: add slugify util with tests"
```

---

## Task 6: Zod schema validasi auth (TDD)

**Files:**
- Create: `lib/validation/auth.ts`
- Test: `tests/unit/auth-validation.test.ts`

- [ ] **Step 1: Tulis failing test**

```ts
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const r = registerSchema.safeParse({
      fullName: "Andi",
      email: "andi@mail.com",
      phone: "08123456789",
      password: "secret12",
    });
    expect(r.success).toBe(true);
  });
  it("rejects short password", () => {
    const r = registerSchema.safeParse({
      fullName: "Andi",
      email: "andi@mail.com",
      phone: "08123456789",
      password: "123",
    });
    expect(r.success).toBe(false);
  });
  it("rejects invalid email", () => {
    const r = loginSchema.safeParse({ email: "bukan-email", password: "secret12" });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm run test -- auth-validation`
Expected: FAIL — module tidak ditemukan.

- [ ] **Step 3: Implementasi schema**

`lib/validation/auth.ts`:
```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(1, "Nama lengkap harus diisi"),
  phone: z.string().min(8, "No WhatsApp harus diisi"),
});

export const resetSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `npm run test -- auth-validation`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/validation/auth.ts tests/unit/auth-validation.test.ts
git commit -m "feat: add auth validation schemas with tests"
```

---

## Task 7: Supabase project + env + clients

**Files:**
- Create: `.env.local` (tidak di-commit), `.env.example`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`

- [ ] **Step 1: Buat Supabase project**

Manual di `https://supabase.com/dashboard`: buat project `hari-h`. Catat `Project URL` dan `anon public key` (Settings → API).

- [ ] **Step 2: Buat .env.example dan .env.local**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
`.env.local` (isi nilai asli dari Step 1; sudah di-gitignore via `.env*.local`).

- [ ] **Step 3: Browser client**

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Server client**

`lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // dipanggil dari Server Component — diabaikan, middleware yg refresh
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Middleware helper**

`lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard: halaman dashboard butuh login
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}
```

- [ ] **Step 6: Commit**

```bash
git add .env.example lib/supabase/
git commit -m "feat: add supabase clients and session middleware helper"
```

---

## Task 8: Root middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Buat middleware.ts**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Verifikasi guard**

Run: `npm run dev` → buka `http://localhost:3000/dashboard`.
Expected: redirect ke `/login?redirect=/dashboard` (halaman login belum ada → 404 di Task ini, dibuat di Task 10. Cukup pastikan terjadi redirect, bukan render dashboard).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add root middleware with dashboard auth guard"
```

---

## Task 9: Database schema + RLS

**Files:**
- Create: `supabase/migrations/0001_init.sql`

Skema diturunkan dari `../spec/03-data-model.md`. Fase 0 membuat **seluruh** tabel inti agar fase berikut tinggal pakai.

- [ ] **Step 1: Tulis migrasi**

`supabase/migrations/0001_init.sql`:
```sql
-- ENUMS
create type account_status as enum ('trial', 'active', 'expired');
create type user_role as enum ('user', 'admin', 'reseller');
create type theme_access as enum ('non_photo', 'photo');
create type theme_badge as enum ('new', 'popular');
create type invitation_status as enum ('draft', 'active', 'expired', 'inactive');
create type attendance as enum ('hadir', 'tidak', 'ragu');
create type txn_status as enum ('pending', 'paid', 'failed', 'expired');
create type reseller_status as enum ('pending', 'active');

-- PACKAGES
create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int not null,
  original_price int,
  theme_access theme_access not null,
  duration_days int not null,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- PROFILES (1-1 auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  plan_id uuid references packages(id),
  account_status account_status default 'trial',
  plan_expires_at timestamptz,
  role user_role default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CATEGORIES
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  taxonomy text
);

-- THEMES
create table themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category_id uuid references categories(id),
  has_photo boolean default false,
  thumbnail_url text,
  badge theme_badge,
  popularity int default 0,
  component_key text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- INVITATIONS
create table invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  theme_id uuid references themes(id),
  title text not null,
  slug text unique not null,
  status invitation_status default 'draft',
  expires_at timestamptz,
  published_at timestamptz,
  rsvp_protected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INVITATION DATA (1-1)
create table invitation_data (
  invitation_id uuid primary key references invitations(id) on delete cascade,
  couple jsonb default '{}'::jsonb,
  events jsonb default '[]'::jsonb,
  quotes jsonb,
  love_story jsonb,
  gallery jsonb default '[]'::jsonb,
  prewed_video_url text,
  music_url text,
  livestream jsonb,
  gift jsonb,
  settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- GUESTS
create table guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  name text not null,
  token text,
  "group" text,
  created_at timestamptz default now()
);

-- RSVPS
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  guest_name text not null,
  attendance attendance not null,
  headcount int default 1,
  message text,
  is_spam boolean default false,
  created_at timestamptz default now()
);

-- TRANSACTIONS
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  package_id uuid references packages(id),
  invitation_id uuid references invitations(id) on delete set null,
  amount int not null,
  gateway text,
  gateway_ref text,
  status txn_status default 'pending',
  paid_at timestamptz,
  reseller_id uuid,
  created_at timestamptz default now()
);

-- RESELLERS
create table resellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  code text unique not null,
  commission_rate numeric default 0,
  status reseller_status default 'pending',
  created_at timestamptz default now()
);
alter table transactions
  add constraint transactions_reseller_fk
  foreign key (reseller_id) references resellers(id) on delete set null;

-- AUTO-CREATE PROFILE ON SIGNUP
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, account_status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'trial'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table invitations enable row level security;
alter table invitation_data enable row level security;
alter table guests enable row level security;
alter table rsvps enable row level security;
alter table transactions enable row level security;
alter table resellers enable row level security;
alter table themes enable row level security;
alter table categories enable row level security;
alter table packages enable row level security;

-- profiles: user akses miliknya
create policy "profiles_self_select" on profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

-- invitations & invitation_data & guests: hanya pemilik
create policy "inv_owner_all" on invitations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "invdata_owner_all" on invitation_data for all
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()))
  with check (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));
create policy "guests_owner_all" on guests for all
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()))
  with check (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- rsvps: insert publik (tamu), select hanya pemilik undangan
create policy "rsvp_public_insert" on rsvps for insert with check (true);
create policy "rsvp_owner_select" on rsvps for select
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- transactions: user lihat miliknya
create policy "txn_owner_select" on transactions for select using (auth.uid() = user_id);

-- themes/categories/packages: baca publik (anon boleh lihat katalog)
create policy "themes_public_read" on themes for select using (true);
create policy "categories_public_read" on categories for select using (true);
create policy "packages_public_read" on packages for select using (true);
```

- [ ] **Step 2: Terapkan migrasi**

Via Supabase Dashboard → SQL Editor → tempel isi `0001_init.sql` → Run.
Expected: "Success. No rows returned". Verifikasi tabel muncul di Table Editor.

- [ ] **Step 3: Seed data minimal (kategori + 1 paket trial)**

SQL Editor:
```sql
insert into categories (name, slug, taxonomy) values ('Pernikahan', 'pernikahan', 'wds-pernikahan');
insert into packages (name, price, original_price, theme_access, duration_days, features)
values ('Free Trial', 0, 19000, 'non_photo', 2, '["Akses tema non-foto terbatas","Aktif 2 hari"]'::jsonb);
```
Expected: 2 insert sukses.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: add initial database schema and RLS policies"
```

---

## Task 10: Halaman & server actions Auth

**Files:**
- Create: `app/(auth)/actions.ts`
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/lost-password/page.tsx`

- [ ] **Step 1: Server actions**

`app/(auth)/actions.ts`:
```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, resetSchema } from "@/lib/validation/auth";

export async function signIn(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email atau kata sandi salah." };

  const redirectTo = (formData.get("redirect") as string) || "/dashboard";
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUp(_prev: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { email, password, fullName, phone } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });
  if (error) return { error: error.message };
  return { success: "Cek email untuk verifikasi, lalu masuk." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(_prev: unknown, formData: FormData) {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error) return { error: error.message };
  return { success: "Link reset terkirim ke email Anda." };
}
```

- [ ] **Step 2: Halaman login**

`app/(auth)/login/page.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-sm bg-card border border-line rounded shadow p-8 space-y-4"
      >
        <h1 className="font-display text-2xl text-ink">Masuk ke akun Anda</h1>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        <input
          name="email"
          type="email"
          placeholder="Alamat Email"
          className="w-full border border-line rounded-sm px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Kata Sandi"
          className="w-full border border-line rounded-sm px-3 py-2"
        />
        <button
          disabled={pending}
          className="w-full bg-brand text-white rounded-sm py-2.5 font-semibold disabled:opacity-60"
        >
          {pending ? "Memproses..." : "Masuk"}
        </button>
        <div className="flex justify-between text-sm text-ink-3">
          <Link href="/lost-password">Lupa kata sandi?</Link>
          <Link href="/register">Daftar</Link>
        </div>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Halaman register**

`app/(auth)/register/page.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "../actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-sm bg-card border border-line rounded shadow p-8 space-y-4"
      >
        <h1 className="font-display text-2xl text-ink">Daftar</h1>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        {state?.success && <p className="text-pos text-sm">{state.success}</p>}
        <input name="fullName" placeholder="Nama Lengkap" className="w-full border border-line rounded-sm px-3 py-2" />
        <input name="email" type="email" placeholder="Alamat Email" className="w-full border border-line rounded-sm px-3 py-2" />
        <input name="phone" placeholder="No WhatsApp" className="w-full border border-line rounded-sm px-3 py-2" />
        <input name="password" type="password" placeholder="Kata Sandi (min 8)" className="w-full border border-line rounded-sm px-3 py-2" />
        <button disabled={pending} className="w-full bg-brand text-white rounded-sm py-2.5 font-semibold disabled:opacity-60">
          {pending ? "Memproses..." : "Daftar"}
        </button>
        <p className="text-sm text-ink-3">
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Halaman lost-password**

`app/(auth)/lost-password/page.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "../actions";

export default function LostPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm bg-card border border-line rounded shadow p-8 space-y-4">
        <h1 className="font-display text-2xl text-ink">Reset Kata Sandi</h1>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        {state?.success && <p className="text-pos text-sm">{state.success}</p>}
        <input name="email" type="email" placeholder="Alamat Email" className="w-full border border-line rounded-sm px-3 py-2" />
        <button disabled={pending} className="w-full bg-brand text-white rounded-sm py-2.5 font-semibold disabled:opacity-60">
          {pending ? "Memproses..." : "Kirim Link Reset"}
        </button>
        <p className="text-sm text-ink-3"><Link href="/login">Kembali ke Masuk</Link></p>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Verifikasi register → login manual**

Run: `npm run dev`. Buka `/register`, daftar akun uji. Cek di Supabase → Authentication → Users muncul, dan tabel `profiles` punya baris baru (trigger jalan). Lalu `/login` dengan kredensial tsb.
Expected: setelah login, redirect ke `/dashboard` (Task 11 membuat isinya; jika belum, redirect terjadi lalu render shell).

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)"
git commit -m "feat: add auth pages and server actions (login, register, reset)"
```

---

## Task 11: Shell dashboard terproteksi

**Files:**
- Create: `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
- Create: `components/dashboard/sidebar.tsx`, `components/dashboard/header.tsx`

- [ ] **Step 1: Sidebar**

`components/dashboard/sidebar.tsx`:
```tsx
import Link from "next/link";

const items = [
  { label: "Undangan", href: "/dashboard/invitation" },
  { label: "Tema Undangan", href: "/dashboard/invitation/create" },
  { label: "Beli Paket", href: "/dashboard/upgrade" },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-card p-4">
      <div className="font-display text-xl text-brand mb-6">Hari-H</div>
      <nav className="space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block rounded-sm px-3 py-2 text-ink-2 hover:bg-paper-2"
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Header**

`components/dashboard/header.tsx`:
```tsx
import { signOut } from "@/app/(auth)/actions";

export function Header({ email }: { email: string }) {
  return (
    <header className="h-14 border-b border-line bg-card flex items-center justify-between px-6">
      <span className="text-sm text-ink-3">{email}</span>
      <form action={signOut}>
        <button className="text-sm text-ink-2 hover:text-neg">Keluar</button>
      </form>
    </header>
  );
}
```

- [ ] **Step 3: Layout dashboard (ambil user)**

`app/dashboard/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header email={user.email ?? ""} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Halaman dashboard**

`app/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>
      <p className="text-ink-2 mt-2">
        Selamat datang. Mulai dengan memilih tema undangan.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Verifikasi end-to-end manual**

Run: `npm run dev`. Login → lihat shell dashboard (sidebar + header + email + tombol Keluar). Klik Keluar → kembali ke `/login`. Akses `/dashboard` tanpa login → redirect `/login`.
Expected: semua perilaku sesuai.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard components/dashboard
git commit -m "feat: add protected dashboard shell"
```

---

## Task 12: E2E test auth (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Test: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Konfigurasi Playwright**

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Tulis test guard (tidak butuh kredensial nyata)**

`tests/e2e/auth.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("dashboard tanpa login redirect ke login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /Masuk/i })).toBeVisible();
});

test("halaman register tampil", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Daftar" })).toBeVisible();
});
```

- [ ] **Step 3: Install browser + jalankan**

Run:
```bash
npx playwright install chromium
npm run test:e2e
```
Expected: 2 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/auth.spec.ts
git commit -m "test: add e2e auth guard tests"
```

---

## Task 13: Push & verifikasi CI lokal

- [ ] **Step 1: Jalankan semua test + build**

Run:
```bash
npm run test && npm run build
```
Expected: unit test PASS, `next build` sukses tanpa error tipe.

- [ ] **Step 2: Push ke GitHub**

```bash
git push origin main
```
Expected: push sukses ke `https://github.com/fikarsuwardi/hari-h`.

---

## Self-Review (penulis plan)

**Spec coverage (Fase 0 di `06-roadmap.md`):**
- Setup Next.js + Supabase + Tailwind → Task 1, 2, 4, 7 ✓
- Skema DB + RLS dasar → Task 9 ✓
- Auth (register/login/reset, status trial) → Task 6, 10 + trigger trial di Task 9 ✓
- Layout dashboard (sidebar, header) → Task 11 ✓
- "Selesai bila user bisa daftar, login, lihat dashboard kosong" → Task 10/11 + e2e Task 12 ✓
- Design system Rukos → Task 4 (token), referensi `07-design-system.md` ✓

**Catatan keterbatasan (bukan placeholder):**
- Theme switcher (light/dark) ditunda — produk asli punya, tapi tidak wajib untuk fondasi.
- Storage bucket dikonfigurasi saat dibutuhkan (Fase 2/3, upload foto), bukan Fase 0.
- Verifikasi email pakai default Supabase; kustom Resend ditunda ke Fase 5.

**Placeholder scan:** tidak ada TODO/TBD; semua step berisi kode/perintah nyata.

**Type consistency:** `createClient()` konsisten (browser vs server di file berbeda, nama sama by design). Schema Zod (`loginSchema`, `registerSchema`, `resetSchema`) dipakai konsisten di `actions.ts`. Nama kolom SQL cocok dgn metadata signup (`full_name`, `phone`).

---

## Known Issues / Deferred (dari final code review)

Sudah diperbaiki di Fase 0:
- ✅ Open-redirect di `signIn` — `redirect` param kini divalidasi (harus diawali `/`, bukan `//`).
- ✅ `lint` script — `next lint` dihapus di Next 16 → diganti `eslint .` + ignore `example/`, output test.
- ✅ Next 16 — `middleware.ts` → `proxy.ts`.

Di-defer ke fase yang mengaktifkan fiturnya (bukan blocker Fase 0):
- **`resellers` RLS tanpa policy** (Fase 5): RLS aktif tapi belum ada policy → fail-closed (deny-all), bukan kebocoran. Saat fitur reseller dibangun, tambah: `create policy "resellers_self_select" on resellers for select using (auth.uid() = user_id);`
- **`rsvps` insert `with check (true)`** (Fase 3): aman secara default tapi abusable (anon bisa insert ke invitation mana pun). Saat guest flow dibangun, ketatkan jadi `with check (exists (select 1 from invitations i where i.id = invitation_id and i.status = 'active'))` + rate limit/captcha di app layer.
- **`signUp` membocorkan `error.message`** (account enumeration) — pertimbangkan pesan generik konsisten dgn `signIn`.
- **Email confirmation Supabase** ON by default → signUp via API butuh konfirmasi email (kena rate limit free-tier saat tes). Untuk dev matikan "Confirm email" di Auth settings; produksi pakai SMTP/Resend (Fase 5).
- **jsdom 27 ESM bug** → test unit pakai `// @vitest-environment node`. Saat ada test komponen React (Fase 2), ganti `jsdom` → `happy-dom`.
```
