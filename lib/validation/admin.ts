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
