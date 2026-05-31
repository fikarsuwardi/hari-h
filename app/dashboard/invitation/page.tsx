import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InvitationList } from "@/components/dashboard/invitation-list";

export default async function InvitationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("id, title, slug, status, expires_at")
    .order("created_at", { ascending: false });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Undangan Saya</h1>
        <Link href="/dashboard/invitation/create" className="bg-brand text-white rounded-sm px-4 py-2">+ Buat Undangan</Link>
      </div>
      <InvitationList items={data ?? []} />
    </div>
  );
}
