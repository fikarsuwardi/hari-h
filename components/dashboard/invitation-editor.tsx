"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { updateInvitation } from "@/lib/invitation/actions";
import { ImageUpload } from "./image-upload";
import type { InvitationData, EventItem, GiftAccount, Person } from "@/lib/invitation/types";

export function InvitationEditor({
  userId, id, initialTitle, initialData, slug,
}: {
  userId: string; id: string; initialTitle: string; initialData: InvitationData; slug: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [data, setData] = useState<InvitationData>(initialData);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function setPerson(which: "groom" | "bride", patch: Partial<Person>) {
    setData((d) => ({ ...d, couple: { ...d.couple, [which]: { ...d.couple[which], ...patch } } }));
  }
  function setEvent(i: number, patch: Partial<EventItem>) {
    setData((d) => ({ ...d, events: d.events.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  }
  function addEvent() {
    setData((d) => ({ ...d, events: [...d.events, { name: "", date: "" }] }));
  }
  function removeEvent(i: number) {
    setData((d) => ({ ...d, events: d.events.filter((_, idx) => idx !== i) }));
  }
  function setGift(i: number, patch: Partial<GiftAccount>) {
    setData((d) => ({ ...d, gift: (d.gift ?? []).map((g, idx) => (idx === i ? { ...g, ...patch } : g)) }));
  }
  function addGift() {
    setData((d) => ({ ...d, gift: [...(d.gift ?? []), { type: "bank", number: "", holder: "" }] }));
  }
  function removeGift(i: number) {
    setData((d) => ({ ...d, gift: (d.gift ?? []).filter((_, idx) => idx !== i) }));
  }
  function addGalleryUrl(url: string) {
    setData((d) => ({ ...d, gallery: [...d.gallery, url] }));
  }
  function removeGalleryUrl(i: number) {
    setData((d) => ({ ...d, gallery: d.gallery.filter((_, idx) => idx !== i) }));
  }

  function save() {
    start(async () => {
      const r = await updateInvitation(id, title, data);
      setMsg(r.error ?? r.success ?? "");
    });
  }

  const input = "w-full border border-line rounded-sm px-3 py-2 mt-1";
  const sec = "bg-card border border-line rounded p-5";
  const h = "font-display text-lg text-ink mb-3";

  return (
    <div className="max-w-2xl space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Edit Undangan</h1>
          <p className="text-sm text-ink-3">/{slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/invitation/${id}/preview`} className="border border-line-strong rounded-sm px-3 py-1.5 text-sm">Preview</Link>
          <Link href="/dashboard/invitation" className="text-sm text-ink-2 px-3 py-1.5">Kembali</Link>
        </div>
      </div>

      <div className={sec}>
        <h2 className={h}>Judul</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
      </div>

      <div className={sec}>
        <h2 className={h}>Mempelai</h2>
        {(["groom", "bride"] as const).map((w) => (
          <div key={w} className="mb-4">
            <p className="text-sm font-semibold text-ink-2 mb-1">{w === "groom" ? "Mempelai Pria" : "Mempelai Wanita"}</p>
            <input placeholder="Nama panggilan" value={data.couple[w].name} onChange={(e) => setPerson(w, { name: e.target.value })} className={input} />
            <input placeholder="Nama lengkap" value={data.couple[w].fullName ?? ""} onChange={(e) => setPerson(w, { fullName: e.target.value })} className={input} />
            <input placeholder="Nama orang tua" value={data.couple[w].parents ?? ""} onChange={(e) => setPerson(w, { parents: e.target.value })} className={input} />
            <input placeholder="Instagram (tanpa @)" value={data.couple[w].instagram ?? ""} onChange={(e) => setPerson(w, { instagram: e.target.value })} className={input} />
            <div className="mt-2">
              <ImageUpload userId={userId} invitationId={id} value={data.couple[w].photoUrl} label="Foto" onChange={(url) => setPerson(w, { photoUrl: url })} />
            </div>
          </div>
        ))}
      </div>

      <div className={sec}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-ink">Acara</h2>
          <button onClick={addEvent} className="text-sm text-brand">+ Tambah</button>
        </div>
        {data.events.map((e, i) => (
          <div key={i} className="border border-line rounded-sm p-3 mb-3">
            <input placeholder="Nama acara (mis. Akad)" value={e.name} onChange={(ev) => setEvent(i, { name: ev.target.value })} className={input} />
            <input type="date" value={e.date} onChange={(ev) => setEvent(i, { date: ev.target.value })} className={input} />
            <div className="flex gap-2">
              <input type="time" value={e.startTime ?? ""} onChange={(ev) => setEvent(i, { startTime: ev.target.value })} className={input} />
              <input type="time" value={e.endTime ?? ""} onChange={(ev) => setEvent(i, { endTime: ev.target.value })} className={input} />
            </div>
            <input placeholder="Tempat" value={e.venue ?? ""} onChange={(ev) => setEvent(i, { venue: ev.target.value })} className={input} />
            <input placeholder="Alamat" value={e.address ?? ""} onChange={(ev) => setEvent(i, { address: ev.target.value })} className={input} />
            <input placeholder="Link Google Maps" value={e.mapsUrl ?? ""} onChange={(ev) => setEvent(i, { mapsUrl: ev.target.value })} className={input} />
            <button onClick={() => removeEvent(i)} className="text-sm text-neg mt-2">Hapus acara</button>
          </div>
        ))}
      </div>

      <div className={sec}>
        <h2 className={h}>Quote / Ayat</h2>
        <textarea placeholder="Teks quote" value={data.quotes?.text ?? ""} onChange={(e) => setData((d) => ({ ...d, quotes: { text: e.target.value, source: d.quotes?.source } }))} className={input} rows={3} />
        <input placeholder="Sumber (mis. QS. Ar-Rum: 21)" value={data.quotes?.source ?? ""} onChange={(e) => setData((d) => ({ ...d, quotes: { text: d.quotes?.text ?? "", source: e.target.value } }))} className={input} />
      </div>

      <div className={sec}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-ink">Amplop Digital</h2>
          <button onClick={addGift} className="text-sm text-brand">+ Tambah</button>
        </div>
        {(data.gift ?? []).map((g, i) => (
          <div key={i} className="border border-line rounded-sm p-3 mb-3">
            <select value={g.type} onChange={(e) => setGift(i, { type: e.target.value as "bank" | "ewallet" })} className={input}>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
            </select>
            <input placeholder="Nama bank/e-wallet" value={g.bank ?? ""} onChange={(e) => setGift(i, { bank: e.target.value })} className={input} />
            <input placeholder="Nomor rekening/akun" value={g.number} onChange={(e) => setGift(i, { number: e.target.value })} className={input} />
            <input placeholder="Atas nama" value={g.holder} onChange={(e) => setGift(i, { holder: e.target.value })} className={input} />
            <button onClick={() => removeGift(i)} className="text-sm text-neg mt-2">Hapus</button>
          </div>
        ))}
      </div>

      <div className={sec}>
        <h2 className={h}>Musik Latar</h2>
        <input placeholder="URL file audio (mp3)" value={data.musicUrl ?? ""} onChange={(e) => setData((d) => ({ ...d, musicUrl: e.target.value }))} className={input} />
      </div>

      <div className={sec}>
        <h2 className={h}>Galeri Foto</h2>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {data.gallery.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded gallery image */}
              <img src={url} alt="" className="w-full h-24 object-cover rounded" />
              <button onClick={() => removeGalleryUrl(i)} className="absolute top-1 right-1 bg-neg text-white rounded-full w-5 h-5 text-xs">×</button>
            </div>
          ))}
        </div>
        <ImageUpload userId={userId} invitationId={id} label="Tambah foto galeri" onChange={addGalleryUrl} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-line p-3 flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-pos">{msg}</span>}
        <button onClick={save} disabled={pending} className="bg-brand text-white rounded-sm px-6 py-2 disabled:opacity-60">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
