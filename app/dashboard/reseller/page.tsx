import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResellerApply } from "@/components/dashboard/reseller-apply";

export default async function ResellerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: reseller } = await supabase
    .from("resellers").select("code, status, commission_rate").eq("user_id", user.id).maybeSingle();
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-ink mb-1">Program Reseller</h1>
      <p className="text-ink-3 mb-6">Ajak pasangan lain & dapatkan komisi (segera hadir).</p>
      <ResellerApply reseller={reseller ?? null} />
    </div>
  );
}
