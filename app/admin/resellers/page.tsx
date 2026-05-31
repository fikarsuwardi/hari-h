import { createClient } from "@/lib/supabase/server";
import { ResellerRow } from "@/components/admin/reseller-row";

export default async function AdminResellersPage() {
  const supabase = await createClient();
  const { data: resellers } = await supabase
    .from("resellers")
    .select("id, code, status, commission_rate, created_at, profiles(full_name, phone)")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Reseller</h1>
      <div className="space-y-2">
        {(resellers ?? []).map((r) => (<ResellerRow key={r.id} reseller={r} />))}
        {!resellers?.length && <p className="text-ink-3">Belum ada pendaftaran reseller.</p>}
      </div>
    </div>
  );
}
