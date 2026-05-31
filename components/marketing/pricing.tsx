import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function rupiah(n: number) {
  return n === 0 ? "Gratis" : `Rp${n.toLocaleString("id-ID")}`;
}

export async function Pricing() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("id, name, price, original_price, duration_days, features")
    .eq("is_active", true)
    .order("price");
  return (
    <section id="harga" className="max-w-6xl mx-auto px-5 py-16">
      <h2 className="font-display text-3xl text-ink text-center">Harga yang Sederhana</h2>
      <p className="text-ink-2 text-center mt-2">Mulai gratis, upgrade kapan saja.</p>
      <div className="grid gap-5 md:grid-cols-3 mt-10">
        {(packages ?? []).map((p, i) => {
          const featured = i === (packages?.length ?? 0) - 1;
          const features = Array.isArray(p.features) ? (p.features as string[]) : [];
          return (
            <div key={p.id} className={`rounded-lg p-6 border ${featured ? "border-brand bg-brand-soft" : "border-line bg-card"}`}>
              <p className="font-display text-xl text-ink">{p.name}</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl text-ink">{rupiah(p.price)}</span>
                {p.original_price && p.price > 0 && <span className="text-sm text-ink-3 line-through">{rupiah(p.original_price)}</span>}
              </div>
              <p className="text-xs text-ink-3 mt-1">Aktif {p.duration_days} hari</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-2">
                {features.map((f) => (<li key={f} className="flex gap-2"><span className="text-pos">✓</span>{f}</li>))}
              </ul>
              <Link href="/register" className={`block text-center rounded-sm px-4 py-2.5 mt-6 font-semibold ${featured ? "bg-brand text-white" : "border border-line-strong text-ink-2"}`}>
                {p.price === 0 ? "Coba Gratis" : "Pilih Paket"}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
