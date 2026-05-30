import Link from "next/link";

const items = [
  { label: "Undangan", href: "/dashboard/invitation" },
  { label: "Tema Undangan", href: "/dashboard/invitation/create" },
  { label: "Beli Paket", href: "/dashboard/upgrade" },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-card p-4">
      <div className="font-display text-xl text-brand mb-6">Hari-H</div>
      <nav className="space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block rounded-sm px-3 py-2 text-ink-2 hover:bg-paper-2"
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
