import { createClient } from "@/lib/supabase/server";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, account_status, created_at")
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">User</h1>
      <div className="space-y-2">
        {(users ?? []).map((u) => (<UserRow key={u.id} user={u} />))}
      </div>
    </div>
  );
}
