import { createClient } from "@/lib/supabase/server";
import { ThemeGallery } from "@/components/dashboard/theme-gallery";

export default async function CreatePage() {
  const supabase = await createClient();
  const { data: themes } = await supabase
    .from("themes")
    .select("id, name, slug, thumbnail_url, badge, popularity, component_key, has_photo, categories(name)")
    .eq("is_active", true)
    .order("name");
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">Pilih Tema</h1>
      <p className="text-ink-3 mb-6">Pilih tema undangan, lalu isi datanya.</p>
      <ThemeGallery themes={themes ?? []} />
    </div>
  );
}
