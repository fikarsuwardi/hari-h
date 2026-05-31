"use client";
import { useActionState, useState } from "react";
import { applyReseller } from "@/lib/reseller/actions";

type Reseller = { code: string; status: string; commission_rate: number } | null;

export function ResellerApply({ reseller }: { reseller: Reseller }) {
  const [state, action, pending] = useActionState(applyReseller, null);
  const [copied, setCopied] = useState(false);

  if (reseller) {
    const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${reseller.code}` : "";
    return (
      <div className="bg-card border border-line rounded p-6 space-y-3">
        <p className="text-sm">Status: <span className={`rounded-full px-2 py-0.5 text-xs ${reseller.status === "active" ? "bg-pos-soft text-pos" : "bg-warn-soft text-warn"}`}>{reseller.status === "active" ? "Aktif" : "Menunggu persetujuan"}</span></p>
        {reseller.status === "active" && (
          <>
            <div>
              <p className="text-sm text-ink-2">Kode referral</p>
              <p className="font-display text-2xl text-brand">{reseller.code}</p>
            </div>
            <div>
              <p className="text-sm text-ink-2 mb-1">Tautan ajakan</p>
              <div className="flex gap-2">
                <input readOnly value={link} className="flex-1 border border-line rounded-sm px-3 py-2 text-sm" />
                <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="bg-brand text-white rounded-sm px-4 text-sm">{copied ? "Disalin!" : "Salin"}</button>
              </div>
            </div>
            <p className="text-xs text-ink-3">Komisi: {reseller.commission_rate}% (pelacakan otomatis segera hadir).</p>
          </>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="bg-card border border-line rounded p-6 space-y-4">
      {state?.error && <p className="text-neg text-sm">{state.error}</p>}
      {state?.success && <p className="text-pos text-sm">{state.success}</p>}
      <p className="text-sm text-ink-2">Daftar sebagai reseller untuk mendapat kode referral. Admin akan meninjau pendaftaran Anda.</p>
      <label className="flex items-start gap-2 text-sm text-ink-2">
        <input type="checkbox" name="agree" className="mt-1" /> Saya menyetujui ketentuan program reseller.
      </label>
      <button disabled={pending} className="bg-brand text-white rounded-sm px-6 py-2.5 disabled:opacity-60">{pending ? "Mengirim..." : "Daftar Reseller"}</button>
    </form>
  );
}
