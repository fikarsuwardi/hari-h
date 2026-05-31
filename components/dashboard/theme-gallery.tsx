"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createInvitation } from "@/lib/invitation/actions";
import { slugify } from "@/lib/utils/slug";

type Theme = {
  id: string; name: string; slug: string; thumbnail_url: string | null;
  badge: string | null; popularity: number; component_key: string; has_photo: boolean;
};

export function ThemeGallery({ themes }: { themes: Theme[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "new" | "popular">("name");
  const [picked, setPicked] = useState<Theme | null>(null);

  const list = useMemo(() => {
    let r = themes.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "popular") r = [...r].sort((a, b) => b.popularity - a.popularity);
    return r;
  }, [themes, q, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tema..."
          className="border border-line rounded-sm px-3 py-2 flex-1 min-w-[200px]" />
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-line rounded-sm px-3 py-2">
          <option value="name">Abjad (A-Z)</option>
          <option value="popular">Populer</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((t) => (
          <div key={t.id} className="bg-card border border-line rounded overflow-hidden shadow">
            <div className="relative aspect-[3/4] bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail URL */}
              {t.thumbnail_url && <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover" />}
              {t.badge && <span className="absolute top-2 left-2 text-xs font-bold bg-brand text-white rounded-full px-2 py-0.5">{t.badge === "new" ? "New" : "Popular"}</span>}
            </div>
            <div className="p-3">
              <p className="font-semibold text-ink truncate">{t.name}</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/tema/${t.component_key}`} target="_blank" className="flex-1 text-center text-sm border border-line-strong rounded-sm py-1.5 text-ink-2">Lihat</Link>
                <button onClick={() => setPicked(t)} className="flex-1 text-sm bg-brand text-white rounded-sm py-1.5">Gunakan</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {picked && <CreateModal theme={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

function CreateModal({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const [state, action, pending] = useActionState(createInvitation, null);
  const [title, setTitle] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <form action={action} onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-lg p-6 w-full max-w-md space-y-4">
        <h2 className="font-display text-xl text-ink">Buat Undangan — {theme.name}</h2>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        <input type="hidden" name="themeId" value={theme.id} />
        <div>
          <label className="text-sm text-ink-2">Judul Undangan</label>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Rama & Sinta" className="w-full border border-line rounded-sm px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm text-ink-2">Link Undangan</label>
          <div className="flex items-center mt-1">
            <span className="text-ink-3 text-sm">/</span>
            <input name="slug" defaultValue={slugify(title)} key={slugify(title)}
              placeholder="rama-dan-sinta" className="flex-1 border border-line rounded-sm px-3 py-2 ml-1" />
          </div>
          <p className="text-xs text-ink-3 mt-1">Huruf kecil, tanpa spasi. Contoh: rama-dan-sinta</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-ink-2">Batal</button>
          <button disabled={pending} className="px-4 py-2 bg-brand text-white rounded-sm disabled:opacity-60">
            {pending ? "Membuat..." : "Buat"}
          </button>
        </div>
      </form>
    </div>
  );
}
