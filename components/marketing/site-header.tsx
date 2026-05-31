import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-brand">Hari-H</Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-ink-2">
          <a href="#tema" className="hover:text-ink">Tema</a>
          <a href="#harga" className="hover:text-ink">Harga</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm text-ink-2 px-3 py-2">Masuk</Link>
          <Link href="/register" className="text-sm bg-brand text-white rounded-sm px-4 py-2">Daftar</Link>
        </div>
      </div>
    </header>
  );
}
