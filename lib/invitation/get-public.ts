import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invitationDataSchema } from "./schema";
import type { InvitationView } from "./types";

async function fetchRaw(slug: string): Promise<InvitationView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_invitation", { p_slug: slug });
  if (error || !data) return null;
  const row = data as { title: string; slug: string; themeKey: string; data: unknown };
  const parsed = invitationDataSchema.safeParse(row.data);
  if (!parsed.success) return null;
  return { title: row.title, slug: row.slug, themeKey: row.themeKey, data: parsed.data };
}

export async function getPublicInvitation(slug: string): Promise<InvitationView | null> {
  const cached = unstable_cache(() => fetchRaw(slug), ["invitation", slug], {
    tags: [`invitation:${slug}`],
    revalidate: 300,
  });
  return cached();
}
