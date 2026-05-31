"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  userId, invitationId, value, onChange, label,
}: {
  userId: string; invitationId: string; value?: string | null;
  onChange: (url: string) => void; label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Maksimal 5MB."); return; }
    setBusy(true); setErr("");
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${invitationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("invitations").upload(path, file, { upsert: true });
    if (error) { setErr("Gagal upload."); setBusy(false); return; }
    const { data } = supabase.storage.from("invitations").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }
  return (
    <div>
      <label className="text-sm text-ink-2">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- preview of uploaded image
          <img src={value} alt="" className="w-16 h-16 object-cover rounded" />
        )}
        <input type="file" accept="image/*" onChange={handle} disabled={busy} className="text-sm" />
      </div>
      {busy && <p className="text-xs text-ink-3">Mengupload...</p>}
      {err && <p className="text-xs text-neg">{err}</p>}
    </div>
  );
}
