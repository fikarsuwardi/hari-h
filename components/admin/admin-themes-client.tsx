"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTheme } from "@/lib/admin/actions";
import { ThemeForm } from "./theme-form";

type Theme = {
  id: string;
  name: string;
  slug: string;
  component_key: string;
  has_photo: boolean;
  thumbnail_url: string | null;
  badge: string | null;
  popularity: number;
  is_active: boolean;
};

export function AdminThemesClient({ themes, themeKeys }: { themes: Theme[]; themeKeys: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Theme | null | "new">(null);
  const [isPending, startTransition] = useTransition();

  function handleDone() {
    setEditing(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus tema "${name}"?`)) return;
    const res = await deleteTheme(id);
    if (res.error) { alert(res.error); return; }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Tema</h1>
        <button
          onClick={() => setEditing("new")}
          className="bg-deposit text-white rounded-sm px-4 py-2 text-sm"
        >
          + Tema Baru
        </button>
      </div>

      {editing === "new" && (
        <div className="mb-6">
          <ThemeForm themeKeys={themeKeys} onDone={handleDone} />
        </div>
      )}

      {editing && editing !== "new" && (
        <div className="mb-6">
          <ThemeForm theme={editing} themeKeys={themeKeys} onDone={handleDone} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-line rounded">
          <thead className="bg-paper-2 text-ink-2">
            <tr>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Slug</th>
              <th className="text-left px-3 py-2">Component key</th>
              <th className="text-left px-3 py-2">Badge</th>
              <th className="text-left px-3 py-2">Aktif</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {themes.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-3 py-2 text-ink">{t.name}</td>
                <td className="px-3 py-2 text-ink-2 font-mono text-xs">{t.slug}</td>
                <td className="px-3 py-2 text-ink-2 font-mono text-xs">{t.component_key}</td>
                <td className="px-3 py-2 text-ink-3">{t.badge ?? "—"}</td>
                <td className="px-3 py-2">{t.is_active ? <span className="text-pos">Ya</span> : <span className="text-neg">Tidak</span>}</td>
                <td className="px-3 py-2 flex gap-2 justify-end">
                  <button
                    onClick={() => setEditing(t)}
                    className="text-deposit hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    disabled={isPending}
                    className="text-neg hover:underline text-xs disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {themes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-3">Belum ada tema.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
