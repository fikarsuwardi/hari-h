import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInvitation } from "@/lib/invitation/owner";
import { InvitationEditor } from "@/components/dashboard/invitation-editor";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const inv = await getOwnedInvitation(id);
  if (!inv) notFound();
  return <InvitationEditor userId={user.id} id={inv.id} initialTitle={inv.title} initialData={inv.view.data} slug={inv.slug} />;
}
