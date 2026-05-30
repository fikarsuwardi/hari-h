# 07 — Design System ("Rukos")

Sumber: `../style-guide.html`. Wajib diikuti agar Hari-H **tidak mirip** walimatul.id (yang pakai sage `#546455` + Inter). Estetika Rukos: kertas/cream + hijau tua + serif Fraunces.

> Catatan: style guide aslinya dibuat untuk app "Rukos" (manajemen kost). Yang dipakai adalah **bahasa visualnya** (token, tipografi, komponen), bukan domain kontennya.

## Design Tokens

### Surfaces & Lines
| Token | Hex | Pakai |
|---|---|---|
| `--paper` | `#fbf8f1` | Background utama (cream) |
| `--paper-2` | `#f4eee1` | Surface halus (chip aktif, btn-quiet) |
| `--card` | `#ffffff` | Kartu konten |
| `--line` | `#ece4d4` | Garis halus |
| `--line-strong` | `#ddd2bc` | Garis tegas / border ghost button |

### Ink (Teks)
| Token | Hex | Pakai |
|---|---|---|
| `--ink` | `#1b3a2f` | Teks utama (almost-black green) |
| `--ink-2` | `#46544c` | Teks sekunder |
| `--ink-3` | `#7d8a82` | Muted (caption, helper) |

### Brand & Accent
| Token | Hex | Pakai |
|---|---|---|
| `--brand` | `#1b4332` | Primary button, brand mark |
| `--brand-soft` | `#e7efe9` | Background lembut / badge brand |
| `--clay` | `#c2410c` | Aksen oranye (CTA sekunder, jarang) |
| `--clay-press` | `#9a3208` | Clay pressed |
| `--clay-soft` | `#fbeadf` | Background lembut clay |

### Semantic
| Token | Hex | Pakai |
|---|---|---|
| `--pos` / `--pos-soft` | `#2d6a4f` / `#e3f0e8` | Sukses, lunas, positif |
| `--neg` / `--neg-soft` | `#b3261e` / `#fbe6e3` | Error, terlambat |
| `--warn` / `--warn-soft` | `#b0790f` / `#f8eed6` | Perhatian, jatuh tempo |
| `--deposit` / `--deposit-soft` | `#3f5e6c` / `#e6eef1` | Biru-abu → **tema Admin Panel** |

> Konvensi tema: **owner/user app** pakai brand hijau; **admin panel** pakai aksen deposit (biru-abu) untuk membedakan.

## Typography

Dua keluarga (Google Fonts):
- **Fraunces** (serif) — display, judul, angka penting.
- **Plus Jakarta Sans** — body & UI.

| Skala | Font | Spesifikasi |
|---|---|---|
| display-xl | Fraunces 600 | 2.6rem, tracking -0.02em, lh 1.1 |
| display-lg | Fraunces 600 | 1.8rem, tracking -0.01em |
| display-md | Fraunces 500 | 1.3rem |
| sans-lg | Jakarta 700 | 1.05rem |
| sans-md | Jakarta 500 | 0.95rem (body default) |
| sans-sm | Jakarta 500 | 0.82rem |
| sans-xs | Jakarta 500 | 0.72rem, uppercase, tracking 0.06em (label) |

## Shape & Elevation
- Radius: `--r-sm` 10px · `--r` 16px · `--r-lg` 22px · pill 999px.
- Shadow: `--shadow` `0 1px 2px rgba(27,58,47,.04), 0 8px 24px -12px rgba(27,58,47,.18)`
- Shadow-lg: `0 12px 40px -12px rgba(27,58,47,.28)`

## Komponen Dasar
- **Buttons:** primary (brand, h44, radius 12), clay, deposit (admin), quiet (paper-2, h40), ghost (border line-strong, h40).
- **Badges (pill):** paid/upcoming/unpaid/overdue/deposit/empty — pakai pasangan warna semantic + soft.
- **Cards:** bg card, border line, radius `--r`, shadow.

## Implementasi di Stack
- Definisikan token sebagai **CSS variables** di `:root` + map ke **Tailwind theme** (`tailwind.config` colors/fontFamily/borderRadius/boxShadow).
- Load Fraunces + Plus Jakarta Sans via `next/font/google`.
- shadcn/ui di-restyle mengikuti token ini (bukan default).
- **Penting:** design system ini untuk **landing + dashboard + admin** (UI produk). **Tema undangan** (yang dilihat tamu) punya estetika sendiri per-tema dan tidak terikat token ini.
