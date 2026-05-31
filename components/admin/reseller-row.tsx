"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReseller, rejectReseller } from "@/lib/reseller/actions";

type Profile = { full_name: string | null; phone: string | null } | null;

type Reseller = {
  id: string;
  code: string;
  status: string;
  commission_rate: number;
  created_at: string;
  profiles: Profile | Profile[];
};

function getProfile(profiles: Profile | Profile[]): Profile {
  if (Array.isArray(profiles)) return profiles[0] ?? null;
  return profiles;
}

export function ResellerRow({ reseller }: { reseller: Reseller }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [rate, setRate] = useState("0");

  const profile = getProfile(reseller.profiles);

  async function handleApprove() {
    setMsg(null);
    const res = await approveReseller(reseller.id, parseFloat(rate) || 0);
    if (res.error) {
      setMsg({ type: "err", text: res.error });
    } else {
      setMsg({ type: "ok", text: res.success ?? "Disetujui" });
      startTransition(() => router.refresh());
    }
  }

  async function handleReject() {
    setMsg(null);
    const res = await rejectReseller(reseller.id);
    if (res.error) {
      setMsg({ type: "err", text: res.error });
    } else {
      setMsg({ type: "ok", text: res.success ?? "Ditolak" });
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="bg-card border border-line rounded p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-ink font-medium">{profile?.full_name ?? "—"}</p>
        <p className="text-ink-2 text-sm">{profile?.phone ?? "—"}</p>
        <p className="text-ink-3 text-xs">Kode: <span className="font-mono text-deposit">{reseller.code}</span></p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {reseller.status === "pending" ? (
          <>
            <div className="flex items-center gap-1">
              <label className="text-xs text-ink-3">Komisi %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                disabled={isPending}
                className="w-16 border border-line rounded-sm px-2 py-1 text-sm text-ink bg-card disabled:opacity-60"
              />
            </div>
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="bg-brand text-white rounded-sm px-3 py-1 text-sm disabled:opacity-60"
            >
              Setujui
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="border border-neg text-neg rounded-sm px-3 py-1 text-sm disabled:opacity-60"
            >
              Tolak
            </button>
          </>
        ) : (
          <span className="text-xs bg-pos-soft text-pos rounded-full px-2 py-0.5">
            Aktif · {reseller.commission_rate}%
          </span>
        )}
        {msg && (
          <span className={`text-xs ${msg.type === "ok" ? "text-pos" : "text-neg"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
