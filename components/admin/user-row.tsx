"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/lib/admin/actions";

type User = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "user" | "admin" | "reseller";
  account_status: string | null;
  created_at: string;
};

export function UserRow({ user }: { user: User }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as "user" | "admin" | "reseller";
    setMsg(null);
    const res = await setUserRole(user.id, role);
    if (res.error) {
      setMsg({ type: "err", text: res.error });
    } else {
      setMsg({ type: "ok", text: "Tersimpan" });
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="bg-card border border-line rounded p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-ink font-medium">{user.full_name ?? "—"}</p>
        <p className="text-ink-2 text-sm">{user.phone ?? "—"}</p>
        <p className="text-ink-3 text-xs">Status: {user.account_status ?? "—"}</p>
      </div>
      <div className="flex items-center gap-3">
        <select
          defaultValue={user.role}
          onChange={handleRoleChange}
          disabled={isPending}
          className="border border-line rounded-sm px-2 py-1 text-sm text-ink bg-card disabled:opacity-60"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="reseller">reseller</option>
        </select>
        {msg && (
          <span className={`text-xs ${msg.type === "ok" ? "text-pos" : "text-neg"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
