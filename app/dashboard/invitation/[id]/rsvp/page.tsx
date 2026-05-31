import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RsvpManager } from "@/components/dashboard/rsvp-manager";

export default async function RsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: inv } = await supabase.from("invitations").select("id, title, user_id").eq("id", id).maybeSingle();
  if (!inv || inv.user_id !== user.id) notFound();
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("id, guest_name, attendance, headcount, message, is_spam, created_at")
    .eq("invitation_id", id)
    .order("created_at", { ascending: false });
  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-1">RSVP — {inv.title}</h1>
      <p className="text-ink-3 mb-6">Daftar kehadiran &amp; ucapan tamu.</p>
      <RsvpManager items={rsvps ?? []} />
    </div>
  );
}
