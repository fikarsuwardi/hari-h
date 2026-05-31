import { createClient } from "@/lib/supabase/server";
import { AdminPackagesClient } from "@/components/admin/package-form";

export default async function AdminPackagesPage() {
  const supabase = await createClient();
  const { data: packages } = await supabase.from("packages").select("*").order("price");
  return <AdminPackagesClient packages={packages ?? []} />;
}
