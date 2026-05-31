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

async function ownerGuard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  // RLS rsvp_owner_select hanya izinkan baca milik sendiri; update/delete butuh policy owner.
  return { supabase, user, ok: true as const };
}

export async function toggleRsvpSpam(rsvpId: string, isSpam: boolean) {
  const { supabase, ok } = await ownerGuard();
  if (!ok) return { error: "Sesi habis." };
  const { error } = await supabase.from("rsvps").update({ is_spam: isSpam }).eq("id", rsvpId);
  if (error) return { error: "Gagal memperbarui." };
  return { success: "Diperbarui." };
}

export async function deleteRsvp(rsvpId: string) {
  const { supabase, ok } = await ownerGuard();
  if (!ok) return { error: "Sesi habis." };
  const { error } = await supabase.from("rsvps").delete().eq("id", rsvpId);
  if (error) return { error: "Gagal menghapus." };
  return { success: "Dihapus." };
}
