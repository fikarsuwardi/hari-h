import type { ComponentType } from "react";
import type { InvitationView } from "./types";

export type ThemeComponent = ComponentType<{ view: InvitationView; guestName?: string }>;

// Map component_key -> dynamic import default export.
export const THEMES: Record<string, () => Promise<{ default: ThemeComponent }>> = {
  "minimalis-01": () => import("@/themes/minimalis-01"),
};

export const THEME_KEYS = Object.keys(THEMES);

export function isKnownTheme(key: string): boolean {
  return key in THEMES;
}
