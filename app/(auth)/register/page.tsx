"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "../actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-sm bg-card border border-line rounded shadow p-8 space-y-4"
      >
        <h1 className="font-display text-2xl text-ink">Daftar</h1>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        {state?.success && <p className="text-pos text-sm">{state.success}</p>}
        <input name="fullName" placeholder="Nama Lengkap" className="w-full border border-line rounded-sm px-3 py-2" />
        <input name="email" type="email" placeholder="Alamat Email" className="w-full border border-line rounded-sm px-3 py-2" />
        <input name="phone" placeholder="No WhatsApp" className="w-full border border-line rounded-sm px-3 py-2" />
        <input name="password" type="password" placeholder="Kata Sandi (min 8)" className="w-full border border-line rounded-sm px-3 py-2" />
        <button disabled={pending} className="w-full bg-brand text-white rounded-sm py-2.5 font-semibold disabled:opacity-60">
          {pending ? "Memproses..." : "Daftar"}
        </button>
        <p className="text-sm text-ink-3">
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
      </form>
    </main>
  );
}
