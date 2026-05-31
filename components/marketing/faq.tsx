const FAQS = [
  ["Apakah ada masa coba gratis?", "Ya. Paket trial gratis aktif 2 hari — cukup daftar tanpa kartu kredit, isi data, dan lihat hasilnya secara langsung."],
  ["Berapa lama undangan saya aktif?", "Tergantung paket: paket berbayar aktif 6 bulan hingga 1 tahun sejak diaktifkan."],
  ["Apakah bisa ganti tema setelah dibuat?", "Bisa. Kamu dapat mengganti tema dan menyunting data kapan saja dari dashboard."],
  ["Bagaimana tamu membuka undangan?", "Cukup bagikan satu tautan. Tamu membukanya di browser tanpa perlu memasang aplikasi apa pun."],
  ["Apakah data undangan saya aman?", "Undangan hanya dapat diakses lewat tautan unik dan tidak diindeks mesin pencari."],
];

export function Faq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Pertanyaan Umum</h2>
      <div className="mt-8 space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="bg-card border border-line rounded p-4 group">
            <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between items-center">
              {q}<span className="text-ink-3 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-ink-2 mt-3">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
