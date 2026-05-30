"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-sm bg-card border border-line rounded shadow p-8 space-y-4"
      >
        <h1 className="font-display text-2xl text-ink">Masuk ke akun Anda</h1>
        {state?.error && <p className="text-neg text-sm">{state.error}</p>}
        <input
          name="email"
          type="email"
          placeholder="Alamat Email"
          className="w-full border border-line rounded-sm px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Kata Sandi"
          className="w-full border border-line rounded-sm px-3 py-2"
        />
        <button
          disabled={pending}
          className="w-full bg-brand text-white rounded-sm py-2.5 font-semibold disabled:opacity-60"
        >
          {pending ? "Memproses..." : "Masuk"}
        </button>
        <div className="flex justify-between text-sm text-ink-3">
          <Link href="/lost-password">Lupa kata sandi?</Link>
          <Link href="/register">Daftar</Link>
        </div>
      </form>
    </main>
  );
}
