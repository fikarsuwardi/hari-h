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
  const rate = Math.max(0, Math.min(100, isFinite(commissionRate) ? commissionRate : 0));
  const { data: r } = await supabase.from("resellers").select("user_id").eq("id", resellerId).maybeSingle();
  if (!r) return { error: "Tidak ditemukan." };
  const { error: e1 } = await supabase.from("resellers").update({ status: "active", commission_rate: rate }).eq("id", resellerId);
  if (e1) return { error: "Gagal menyetujui." };
  const { error: e2 } = await supabase.from("profiles").update({ role: "reseller" }).eq("id", r.user_id);
  if (e2) return { error: "Status reseller aktif, tapi gagal memperbarui role user. Coba lagi." };
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
