"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { activateInvitation, deactivateInvitation, deleteInvitation } from "@/lib/invitation/actions";

type Item = { id: string; title: string; slug: string; status: string; expires_at: string | null };
const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draf", cls: "bg-paper-2 text-ink-3" },
  active: { label: "Aktif", cls: "bg-pos-soft text-pos" },
  inactive: { label: "Nonaktif", cls: "bg-warn-soft text-warn" },
  expired: { label: "Kadaluwarsa", cls: "bg-neg-soft text-neg" },
};

export function InvitationList({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  if (!items.length) return <p className="text-ink-3">Belum ada undangan. Klik &quot;Buat Undangan&quot;.</p>;

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    start(async () => {
      const r = await fn();
      setMsg(r.error ?? r.success ?? "");
      location.reload();
    });
  }
  async function share(slug: string) {
    await navigator.clipboard.writeText(`${location.origin}/${slug}`);
    setMsg("Link disalin!");
  }

  return (
    <div className="space-y-3">
      {msg && <p className="text-sm text-pos">{msg}</p>}
      {items.map((it) => {
        const s = STATUS[it.status] ?? STATUS.draft;
        return (
          <div key={it.id} className="bg-card border border-line rounded p-4 flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="font-semibold text-ink">{it.title}</p>
              <p className="text-sm text-ink-3">/{it.slug} · <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href={`/dashboard/invitation/${it.id}/edit`} className="border border-line-strong rounded-sm px-3 py-1.5">Edit</Link>
              <Link href={`/dashboard/invitation/${it.id}/preview`} className="border border-line-strong rounded-sm px-3 py-1.5">Preview</Link>
              <button disabled={pending} onClick={() => share(it.slug)} className="border border-line-strong rounded-sm px-3 py-1.5">Bagikan</button>
              {it.status === "active"
                ? <button disabled={pending} onClick={() => run(() => deactivateInvitation(it.id))} className="border border-warn rounded-sm px-3 py-1.5 text-warn">Nonaktifkan</button>
                : <button disabled={pending} onClick={() => run(() => activateInvitation(it.id))} className="bg-brand text-white rounded-sm px-3 py-1.5">Aktifkan</button>}
              <button disabled={pending} onClick={() => { if (confirm("Hapus undangan ini?")) run(() => deleteInvitation(it.id)); }} className="border border-neg rounded-sm px-3 py-1.5 text-neg">Hapus</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
