import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-2 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-xl text-brand">Hari-H</p>
          <p className="text-sm text-ink-3 mt-2 max-w-xs">Undangan pernikahan digital yang elegan, praktis, dan mudah dibagikan ke semua tamu.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">Navigasi</p>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><a href="#tema" className="hover:text-ink">Tema</a></li>
            <li><a href="#harga" className="hover:text-ink">Harga</a></li>
            <li><a href="#faq" className="hover:text-ink">FAQ</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3 mb-3">Mulai</p>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link href="/register" className="hover:text-ink">Daftar gratis</Link></li>
            <li><Link href="/login" className="hover:text-ink">Masuk</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-3">© 2026 Hari-H. Semua hak dilindungi.</div>
    </footer>
  );
}
