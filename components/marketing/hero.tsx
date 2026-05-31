import Link from "next/link";

export function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Undangan Pernikahan Digital</p>
      <h1 className="font-display text-4xl md:text-6xl text-ink mt-4 leading-tight">Rayakan hari bahagia,<br />bagikan dengan mudah</h1>
      <p className="text-ink-2 mt-5 max-w-xl mx-auto">Buat undangan pernikahan digital yang elegan dalam hitungan menit. Pilih tema, isi data, bagikan tautannya — tamu cukup membuka satu link.</p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <Link href="/register" className="bg-brand text-white rounded-sm px-6 py-3 font-semibold">Buat Undangan</Link>
        <a href="#tema" className="border border-line-strong text-ink-2 rounded-sm px-6 py-3">Lihat Tema</a>
      </div>
      <p className="text-sm text-ink-3 mt-6">Gratis dicoba · Tanpa kartu kredit</p>
    </section>
  );
}
