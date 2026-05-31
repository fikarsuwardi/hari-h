import { notFound } from "next/navigation";
import { getPublicInvitation } from "@/lib/invitation/get-public";
import { ThemeRenderer } from "@/components/invitation/theme-renderer";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  const view = await getPublicInvitation(slug);
  if (!view) notFound();
  return <ThemeRenderer view={view} guestName={to} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getPublicInvitation(slug);
  if (!view) return { title: "Undangan" };
  const { groom, bride } = view.data.couple;
  return {
    title: `${groom.name} & ${bride.name} — Undangan Pernikahan`,
    description: `Undangan pernikahan ${groom.name} & ${bride.name}.`,
    robots: { index: false, follow: false },
  };
}
