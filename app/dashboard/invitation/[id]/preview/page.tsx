import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedInvitation } from "@/lib/invitation/owner";
import { ThemeRenderer } from "@/components/invitation/theme-renderer";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const inv = await getOwnedInvitation(id);
  if (!inv) notFound();
  return (
    <div>
      <div className="bg-warn-soft text-warn text-sm text-center py-2">Mode Preview — hanya Anda yang melihat ini.</div>
      <ThemeRenderer view={inv.view} guestName="Tamu Undangan" />
    </div>
  );
}
