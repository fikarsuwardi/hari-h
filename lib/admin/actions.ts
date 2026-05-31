"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { themeSchema, packageSchema } from "@/lib/validation/admin";

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, userId: null };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, ok: p?.role === "admin", userId: user.id };
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
  const { supabase, ok, userId: selfId } = await adminClient();
  if (!ok) return { error: "Akses ditolak." };
  // Cegah admin menurunkan rolenya sendiri (anti-lockout operasional).
  if (userId === selfId && role !== "admin") return { error: "Tidak bisa menurunkan role akun sendiri." };
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("id");
  if (error) return { error: "Gagal." };
  if (!data?.length) return { error: "Tidak ditemukan." };
  revalidatePath("/admin/users");
  return { success: "Role diperbarui." };
}
