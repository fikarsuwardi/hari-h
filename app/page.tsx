import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { ThemeShowcase } from "@/components/marketing/theme-showcase";
import { Pricing } from "@/components/marketing/pricing";
import { Features } from "@/components/marketing/features";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Hari-H — Undangan Pernikahan Digital Elegan & Praktis",
  description: "Buat undangan pernikahan digital yang elegan dalam hitungan menit. Pilih tema, isi data, bagikan satu tautan ke semua tamu. Gratis dicoba.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Hari-H — Undangan Pernikahan Digital",
    description: "Undangan pernikahan digital elegan, praktis, mudah dibagikan.",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ThemeShowcase />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
