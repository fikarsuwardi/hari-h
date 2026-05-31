"use client";
import { useActionState, useState } from "react";
import { saveTheme } from "@/lib/admin/actions";
import { AdminThumbUpload } from "./admin-thumb-upload";

type Theme = { id?: string; name: string; slug: string; component_key: string; has_photo: boolean; thumbnail_url: string | null; badge: string | null; popularity: number; is_active: boolean };

export function ThemeForm({ theme, themeKeys, onDone }: { theme?: Theme; themeKeys: string[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveTheme, null);
  const [thumb, setThumb] = useState(theme?.thumbnail_url ?? "");
  const input = "w-full border border-line rounded-sm px-3 py-2 mt-1";
  if (state?.success) onDone();
  return (
    <form action={action} className="bg-card border border-line rounded p-5 space-y-3 max-w-lg">
      {theme?.id && <input type="hidden" name="id" value={theme.id} />}
      {state?.error && <p className="text-neg text-sm">{state.error}</p>}
      <input name="name" defaultValue={theme?.name} placeholder="Nama tema" className={input} />
      <input name="slug" defaultValue={theme?.slug} placeholder="slug-tema" className={input} />
      <label className="block text-sm text-ink-2">Component key
        <select name="componentKey" defaultValue={theme?.component_key} className={input}>
          {themeKeys.map((k) => (<option key={k} value={k}>{k}</option>))}
        </select>
      </label>
      <input type="hidden" name="thumbnailUrl" value={thumb} />
      <AdminThumbUpload value={thumb} onChange={setThumb} />
      <select name="badge" defaultValue={theme?.badge ?? ""} className={input}>
        <option value="">Tanpa badge</option><option value="new">New</option><option value="popular">Popular</option>
      </select>
      <input name="popularity" type="number" defaultValue={theme?.popularity ?? 0} placeholder="Popularity" className={input} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hasPhoto" defaultChecked={theme?.has_photo} /> Tema dengan foto</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={theme?.is_active ?? true} /> Aktif</label>
      <button disabled={pending} className="bg-deposit text-white rounded-sm px-5 py-2 disabled:opacity-60">{pending ? "Menyimpan..." : "Simpan"}</button>
    </form>
  );
}
