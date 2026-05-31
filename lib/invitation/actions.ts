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
  revalidateTag(`invitation:${inv.slug}`, "max");
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
    const packagesRaw = profile?.packages as { duration_days: number } | { duration_days: number }[] | null;
    const days = (Array.isArray(packagesRaw) ? packagesRaw[0] : packagesRaw)?.duration_days ?? 2;
    expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  }
  await supabase
    .from("invitations")
    .update({ status, ...(status === "active" ? { expires_at: expiresAt, published_at: new Date().toISOString() } : {}) })
    .eq("id", id);
  revalidateTag(`invitation:${inv.slug}`, "max");
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
  revalidateTag(`invitation:${inv.slug}`, "max");
  return { success: "Undangan dihapus." };
}
