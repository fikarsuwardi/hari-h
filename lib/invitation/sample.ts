import type { InvitationView } from "./types";

export function sampleView(themeKey: string): InvitationView {
  return {
    title: "Contoh Undangan",
    slug: "contoh",
    themeKey,
    data: {
      couple: {
        groom: { name: "Rama", fullName: "Rama Aditya", parents: "Bpk. A & Ibu B" },
        bride: { name: "Sinta", fullName: "Sinta Maharani", parents: "Bpk. C & Ibu D" },
      },
      events: [
        { name: "Akad Nikah", date: "2026-12-12", startTime: "09:00", venue: "Masjid Raya" },
        { name: "Resepsi", date: "2026-12-12", startTime: "11:00", venue: "Balai Kota" },
      ],
      quotes: { text: "Cinta yang tumbuh dalam ikhtiar dan doa.", source: "—" },
      gallery: [],
      gift: [{ type: "bank", bank: "BCA", number: "1234567890", holder: "Rama Aditya" }],
    },
  };
}
