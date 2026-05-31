"use client";
import { useEffect, useState, useTransition } from "react";
import { getPublicRsvps, submitRsvp, type PublicRsvp } from "@/lib/invitation/rsvp";

export function RsvpSection({ slug, guestName }: { slug: string; guestName?: string }) {
  const [list, setList] = useState<PublicRsvp[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => { getPublicRsvps(slug).then(setList); }, [slug]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    e.currentTarget.reset();
    start(async () => {
      const r = await submitRsvp(slug, form);
      if (r.error) { setErr(r.error); setMsg(""); }
      else { setMsg(r.success ?? ""); setErr(""); setList(await getPublicRsvps(slug)); }
    });
  }

  const label = { hadir: "Hadir", tidak: "Tidak hadir", ragu: "Masih ragu" } as const;
  return (
    <section style={{ padding: "56px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#7c8b78" }}>RSVP &amp; Ucapan</p>
      <div style={{ width: 48, height: 1, background: "#cdbfa8", margin: "20px auto" }} />
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 360, margin: "0 auto", textAlign: "left" }}>
        <input name="name" defaultValue={guestName ?? ""} placeholder="Nama Anda" required
          style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }} />
        <select name="attendance" defaultValue="hadir" style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }}>
          <option value="hadir">Hadir</option>
          <option value="tidak">Tidak hadir</option>
          <option value="ragu">Masih ragu</option>
        </select>
        <input name="headcount" type="number" min={1} max={20} defaultValue={1} placeholder="Jumlah tamu"
          style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }} />
        <textarea name="message" placeholder="Ucapan & doa" rows={3}
          style={{ padding: "10px 12px", border: "1px solid #ece2cf", borderRadius: 8 }} />
        <button disabled={pending} style={{ padding: "10px", background: "#7c8b78", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          {pending ? "Mengirim..." : "Kirim"}
        </button>
        {msg && <p style={{ color: "#2d6a4f", fontSize: 14 }}>{msg}</p>}
        {err && <p style={{ color: "#b3261e", fontSize: 14 }}>{err}</p>}
      </form>

      <div style={{ marginTop: 32, display: "grid", gap: 12, maxWidth: 360, margin: "32px auto 0", textAlign: "left" }}>
        {list.map((r, i) => (
          <div key={`${r.createdAt}-${i}`} style={{ background: "#fff", border: "1px solid #ece2cf", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong style={{ fontSize: 14 }}>{r.guestName}</strong>
              <span style={{ fontSize: 12, color: "#7c8b78" }}>{label[r.attendance as keyof typeof label] ?? r.attendance}</span>
            </div>
            {r.message && <p style={{ fontSize: 14, color: "#46544c", marginTop: 4 }}>{r.message}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
