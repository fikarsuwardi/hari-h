"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRsvpSpam, deleteRsvp } from "@/lib/invitation/rsvp";

type Item = { id: string; guest_name: string; attendance: string; headcount: number; message: string | null; is_spam: boolean; created_at: string };
const ATT: Record<string, string> = { hadir: "Hadir", tidak: "Tidak hadir", ragu: "Ragu" };

export function RsvpManager({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const total = items.length;
  const hadir = items.filter((i) => i.attendance === "hadir" && !i.is_spam).reduce((s, i) => s + (i.headcount || 1), 0);

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    start(async () => { const r = await fn(); setMsg(r.error ?? r.success ?? ""); router.refresh(); });
  }
  function exportCsv() {
    // Cegah CSV/formula injection: sel yang diawali = + - @ (atau tab/CR) diberi
    // prefix kutip tunggal agar tidak dieksekusi Excel/Sheets.
    const sanitize = (c: string) => (/^[=+\-@\t\r]/.test(c) ? `'${c}` : c);
    const rows = [["Nama", "Kehadiran", "Jumlah", "Ucapan", "Waktu"],
      ...items.map((i) => [i.guest_name, i.attendance, String(i.headcount), (i.message ?? "").replace(/\n/g, " "), i.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${sanitize(String(c)).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "rsvp.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (!total) return <p className="text-ink-3">Belum ada RSVP.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <p className="text-sm text-ink-2">Total entri (termasuk spam): <strong>{total}</strong> · Total hadir: <strong>{hadir}</strong> orang</p>
        <button onClick={exportCsv} className="text-sm border border-line-strong rounded-sm px-3 py-1.5">Export CSV</button>
      </div>
      {msg && <p className="text-sm text-pos">{msg}</p>}
      {items.map((it) => (
        <div key={it.id} className={`bg-card border rounded p-4 ${it.is_spam ? "border-neg/40 opacity-60" : "border-line"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{it.guest_name} <span className="text-xs text-ink-3">· {ATT[it.attendance] ?? it.attendance} · {it.headcount} org</span></p>
              {it.message && <p className="text-sm text-ink-2 mt-1">{it.message}</p>}
            </div>
            <div className="flex gap-2 text-sm shrink-0">
              <button disabled={pending} onClick={() => run(() => toggleRsvpSpam(it.id, !it.is_spam))} className="border border-line-strong rounded-sm px-3 py-1.5">
                {it.is_spam ? "Bukan spam" : "Tandai spam"}
              </button>
              <button disabled={pending} onClick={() => { if (confirm("Hapus RSVP ini?")) run(() => deleteRsvp(it.id)); }} className="border border-neg rounded-sm px-3 py-1.5 text-neg">Hapus</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
