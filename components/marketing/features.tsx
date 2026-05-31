const FEATURES = [
  ["Galeri Foto", "Pamerkan momen terbaik kalian."],
  ["Hitung Mundur", "Bangun antisipasi menuju hari-H."],
  ["Navigasi Lokasi", "Tamu langsung diarahkan ke peta."],
  ["Amplop Digital", "Terima hadiah lewat transfer & e-wallet."],
  ["RSVP & Ucapan", "Kumpulkan konfirmasi & doa tamu."],
  ["Musik Latar", "Suasana hangat sejak halaman dibuka."],
];

export function Features() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Semua yang kalian butuhkan</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        {FEATURES.map(([title, desc]) => (
          <div key={title} className="bg-card border border-line rounded p-6">
            <p className="font-semibold text-ink">{title}</p>
            <p className="text-sm text-ink-2 mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
