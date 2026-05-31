export const RESERVED_SLUGS = new Set([
  "login", "register", "lost-password", "auth", "account", "dashboard",
  "api", "tema", "admin", "reseller", "_next", "favicon.ico", "robots.txt",
  "sitemap.xml", "upgrade", "undangan-video", "article", "blog",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** @returns pesan error (string) bila tidak valid, atau null bila valid */
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return "Link minimal 3 karakter.";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Link hanya boleh huruf kecil, angka, dan tanda hubung.";
  if (isReservedSlug(slug)) return "Link tidak tersedia, silakan pilih yang lain.";
  return null;
}
