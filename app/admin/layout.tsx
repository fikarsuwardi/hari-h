import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const items = [
    { label: "Tema", href: "/admin/themes" },
    { label: "Paket", href: "/admin/packages" },
    { label: "User", href: "/admin/users" },
    { label: "Reseller", href: "/admin/resellers" },
  ];
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-line bg-deposit-soft p-4">
        <div className="font-display text-lg text-deposit mb-6">Admin · Hari-H</div>
        <nav className="space-y-1">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="block rounded-sm px-3 py-2 text-ink-2 hover:bg-card">{it.label}</Link>
          ))}
          <Link href="/dashboard" className="block rounded-sm px-3 py-2 text-ink-3 hover:bg-card mt-4 text-sm">← Dashboard</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
