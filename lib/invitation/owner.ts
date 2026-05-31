import { createClient } from "@/lib/supabase/server";
import { invitationDataSchema } from "./schema";
import type { InvitationView } from "./types";

export type OwnedInvitation = {
  id: string;
  title: string;
  slug: string;
  status: string;
  themeKey: string;
  view: InvitationView;
};

export async function getOwnedInvitation(id: string): Promise<OwnedInvitation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, title, slug, status, themes(component_key), invitation_data(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  // themes may be returned as an array or a single object depending on schema inference
  const themesRaw = data.themes as
    | { component_key: string }
    | { component_key: string }[]
    | null;
  const themeKey =
    (Array.isArray(themesRaw) ? themesRaw[0] : themesRaw)?.component_key ?? "";

  const raw = (data.invitation_data as unknown as Record<string, unknown> | null) ?? {};
  const parsed = invitationDataSchema.safeParse({
    couple: raw.couple ?? { groom: { name: "" }, bride: { name: "" } },
    events: raw.events ?? [],
    quotes: raw.quotes ?? null,
    loveStory: raw.love_story ?? null,
    gallery: raw.gallery ?? [],
    prewedVideoUrl: raw.prewed_video_url ?? null,
    musicUrl: raw.music_url ?? null,
    livestream: raw.livestream ?? null,
    gift: raw.gift ?? null,
    settings: raw.settings ?? {},
  });
  const view: InvitationView = {
    title: data.title,
    slug: data.slug,
    themeKey,
    data: parsed.success
      ? parsed.data
      : { couple: { groom: { name: "" }, bride: { name: "" } }, events: [], gallery: [] },
  };
  return { id: data.id, title: data.title, slug: data.slug, status: data.status, themeKey, view };
}
