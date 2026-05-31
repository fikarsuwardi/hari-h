import { createClient } from "@/lib/supabase/server";
import { THEME_KEYS } from "@/lib/invitation/registry";
import { AdminThemesClient } from "@/components/admin/admin-themes-client";

export default async function AdminThemesPage() {
  const supabase = await createClient();
  const { data: themes } = await supabase.from("themes").select("*").order("name");
  return <AdminThemesClient themes={themes ?? []} themeKeys={THEME_KEYS} />;
}
