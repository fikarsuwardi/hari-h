import { notFound } from "next/navigation";
import { isKnownTheme } from "@/lib/invitation/registry";
import { ThemeRenderer } from "@/components/invitation/theme-renderer";
import { sampleView } from "@/lib/invitation/sample";

export default async function ThemePreview({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  if (!isKnownTheme(slug)) notFound();
  return <ThemeRenderer view={sampleView(slug)} guestName={to ?? "Tamu Undangan"} />;
}
