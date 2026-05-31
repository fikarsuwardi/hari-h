"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminThumbUpload({ value, onChange }: { value?: string | null; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Maks 5MB."); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const path = `thumb-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("themes").upload(path, file, { upsert: true });
    if (error) { setErr("Gagal upload."); setBusy(false); return; }
    onChange(supabase.storage.from("themes").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail preview
          <img src={value} alt="" className="w-16 h-20 object-cover rounded" />
        )}
        <input type="file" accept="image/*" onChange={handle} disabled={busy} className="text-sm" />
      </div>
      {busy && <p className="text-xs text-ink-3">Mengupload...</p>}
      {err && <p className="text-xs text-neg">{err}</p>}
    </div>
  );
}
