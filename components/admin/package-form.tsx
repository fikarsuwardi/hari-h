"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePackage, deletePackage } from "@/lib/admin/actions";

type Package = {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  theme_access: "non_photo" | "photo";
  duration_days: number;
  features: string[];
  is_active: boolean;
};

const input = "w-full border border-line rounded-sm px-3 py-2 mt-1";

export function PackageForm({ pkg, onDone }: { pkg?: Package; onDone: () => void }) {
  const [state, action, pending] = useActionState(savePackage, null);
  const [featuresValue] = useState(pkg?.features?.join("\n") ?? "");
  if (state?.success) onDone();
  return (
    <form action={action} className="bg-card border border-line rounded p-5 space-y-3 max-w-lg">
      {pkg?.id && <input type="hidden" name="id" value={pkg.id} />}
      {state?.error && <p className="text-neg text-sm">{state.error}</p>}
      <input name="name" defaultValue={pkg?.name} placeholder="Nama paket" className={input} />
      <input name="price" type="number" defaultValue={pkg?.price ?? 0} placeholder="Harga (IDR)" className={input} />
      <input name="originalPrice" type="number" defaultValue={pkg?.original_price ?? ""} placeholder="Harga asli (opsional)" className={input} />
      <label className="block text-sm text-ink-2">Akses tema
        <select name="themeAccess" defaultValue={pkg?.theme_access ?? "non_photo"} className={input}>
          <option value="non_photo">Tanpa foto</option>
          <option value="photo">Dengan foto</option>
        </select>
      </label>
      <input name="durationDays" type="number" defaultValue={pkg?.duration_days ?? 30} placeholder="Durasi (hari)" className={input} />
      <label className="block text-sm text-ink-2">Fitur (1 per baris)
        <textarea name="features" defaultValue={featuresValue} rows={4} placeholder="Fitur 1&#10;Fitur 2" className={input} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={pkg?.is_active ?? true} /> Aktif
      </label>
      <button disabled={pending} className="bg-deposit text-white rounded-sm px-5 py-2 disabled:opacity-60">
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

export function AdminPackagesClient({ packages }: { packages: Package[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Package | null | "new">(null);
  const [isPending, startTransition] = useTransition();

  function handleDone() {
    setEditing(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus paket "${name}"?`)) return;
    const res = await deletePackage(id);
    if (res.error) { alert(res.error); return; }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Paket</h1>
        <button
          onClick={() => setEditing("new")}
          className="bg-deposit text-white rounded-sm px-4 py-2 text-sm"
        >
          + Tambah
        </button>
      </div>

      {editing === "new" && (
        <div className="mb-6">
          <PackageForm onDone={handleDone} />
        </div>
      )}

      {editing && editing !== "new" && (
        <div className="mb-6">
          <PackageForm pkg={editing} onDone={handleDone} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-line rounded">
          <thead className="bg-paper-2 text-ink-2">
            <tr>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Harga</th>
              <th className="text-left px-3 py-2">Akses tema</th>
              <th className="text-left px-3 py-2">Durasi</th>
              <th className="text-left px-3 py-2">Aktif</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-3 py-2 text-ink">{p.name}</td>
                <td className="px-3 py-2 text-ink-2">{p.price.toLocaleString("id-ID")}</td>
                <td className="px-3 py-2 text-ink-2">{p.theme_access === "photo" ? "Dengan foto" : "Tanpa foto"}</td>
                <td className="px-3 py-2 text-ink-2">{p.duration_days}h</td>
                <td className="px-3 py-2">{p.is_active ? <span className="text-pos">Ya</span> : <span className="text-neg">Tidak</span>}</td>
                <td className="px-3 py-2 flex gap-2 justify-end">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-deposit hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={isPending}
                    className="text-neg hover:underline text-xs disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-3">Belum ada paket.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
