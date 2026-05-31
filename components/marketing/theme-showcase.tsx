import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function ThemeShowcase() {
  const supabase = await createClient();
  const { data: themes } = await supabase
    .from("themes")
    .select("id, name, slug, thumbnail_url, badge, component_key, has_photo")
    .eq("is_active", true)
    .order("popularity", { ascending: false });
  if (!themes?.length) return null;
  return (
    <section id="tema" className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Pilihan Tema</h2>
      <p className="text-ink-2 text-center mt-2">Setiap tema mobile-first dan siap pakai.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
        {themes.map((t) => (
          <Link key={t.id} href={`/tema/${t.component_key}`} target="_blank"
            className="bg-card border border-line rounded overflow-hidden shadow group">
            <div className="relative aspect-[3/4] bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail */}
              {t.thumbnail_url ? <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                : <div className="w-full h-full flex items-center justify-center text-ink-3 text-sm font-display">{t.name}</div>}
              {t.badge && <span className="absolute top-2 left-2 text-xs font-bold bg-brand text-white rounded-full px-2 py-0.5">{t.badge === "new" ? "New" : "Popular"}</span>}
            </div>
            <div className="p-3"><p className="font-semibold text-ink text-sm">{t.name}</p><p className="text-xs text-ink-3">Lihat pratinjau →</p></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
