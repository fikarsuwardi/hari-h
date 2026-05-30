import { signOut } from "@/app/(auth)/actions";

export function Header({ email }: { email: string }) {
  return (
    <header className="h-14 border-b border-line bg-card flex items-center justify-between px-6">
      <span className="text-sm text-ink-3">{email}</span>
      <form action={signOut}>
        <button className="text-sm text-ink-2 hover:text-neg">Keluar</button>
      </form>
    </header>
  );
}
