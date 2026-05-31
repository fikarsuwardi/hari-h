import { THEMES, isKnownTheme } from "@/lib/invitation/registry";
import type { InvitationView } from "@/lib/invitation/types";

export async function ThemeRenderer({
  view,
  guestName,
}: {
  view: InvitationView;
  guestName?: string;
}) {
  if (!isKnownTheme(view.themeKey)) {
    return <div className="p-10 text-center">Tema tidak ditemukan.</div>;
  }
  const mod = await THEMES[view.themeKey]();
  const Theme = mod.default;
  return <Theme view={view} guestName={guestName} />;
}
