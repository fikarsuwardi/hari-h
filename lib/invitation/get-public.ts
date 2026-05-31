import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { invitationDataSchema } from "./schema";
import type { InvitationView } from "./types";

// Anon client for public read-only RPC — no cookies needed.
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchRaw(slug: string): Promise<InvitationView | null> {
  const { data, error } = await supabaseAnon.rpc("get_public_invitation", { p_slug: slug });
  if (error || !data) return null;
  const row = data as { title: string; slug: string; themeKey: string; data: unknown };
  const parsed = invitationDataSchema.safeParse(row.data);
  if (!parsed.success) {
    console.error(`[get-public] invalid invitation data for slug "${slug}":`, parsed.error.issues);
    return null;
  }
  return { title: row.title, slug: row.slug, themeKey: row.themeKey, data: parsed.data };
}

export async function getPublicInvitation(slug: string): Promise<InvitationView | null> {
  const cached = unstable_cache(() => fetchRaw(slug), ["invitation", slug], {
    tags: [`invitation:${slug}`],
    revalidate: 300,
  });
  return cached();
}
