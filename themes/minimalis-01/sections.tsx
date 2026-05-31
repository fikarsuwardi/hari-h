import type { InvitationData } from "@/lib/invitation/types";
import { Countdown } from "@/components/invitation/ui/countdown";
import { CopyButton } from "@/components/invitation/ui/copy-button";
import s from "./styles.module.css";

export function Cover({ data, guestName }: { data: InvitationData; title?: string; guestName?: string }) {
  const { groom, bride } = data.couple;
  return (
    <section className={`${s.section} ${s.cover}`}>
      <p className={s.kicker}>The Wedding Of</p>
      <h1 className={s.display}>{groom.name} &amp; {bride.name}</h1>
      {data.events[0]?.date && <p className={s.muted}>{formatDate(data.events[0].date)}</p>}
      <div className={s.divider} />
      {guestName && (
        <div>
          <p className={s.kicker}>Kepada Yth.</p>
          <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20 }}>{guestName}</p>
        </div>
      )}
    </section>
  );
}

export function QuoteSection({ data }: { data: InvitationData }) {
  if (!data.quotes) return null;
  return (
    <section className={s.section}>
      <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20, fontStyle: "italic" }}>&ldquo;{data.quotes.text}&rdquo;</p>
      {data.quotes.source && <p className={s.muted} style={{ marginTop: 8 }}>— {data.quotes.source}</p>}
    </section>
  );
}

export function CoupleSection({ data }: { data: InvitationData }) {
  const people = [data.couple.groom, data.couple.bride];
  return (
    <section className={s.section}>
      <p className={s.kicker}>Mempelai</p>
      <div className={s.divider} />
      <div style={{ display: "grid", gap: 24 }}>
        {people.map((p, i) => (
          <div key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs; next/image optimisation deferred */}
            {p.photoUrl && <img src={p.photoUrl} alt={p.name} style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 999, margin: "0 auto 12px" }} />}
            <h2 className={s.h2}>{p.fullName ?? p.name}</h2>
            {p.parents && <p className={s.muted}>{p.parents}</p>}
            {p.instagram && <p className={s.muted}>@{p.instagram}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EventsSection({ data }: { data: InvitationData }) {
  if (!data.events.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Acara</p>
      <div className={s.divider} />
      <div style={{ display: "grid", gap: 16 }}>
        {data.events.map((e, i) => (
          <div key={i} className={s.card}>
            <h2 className={s.h2}>{e.name}</h2>
            <p className={s.muted}>{formatDate(e.date)}{e.startTime ? `, ${e.startTime}` : ""}{e.endTime ? `–${e.endTime}` : ""}</p>
            {e.venue && <p style={{ marginTop: 6 }}>{e.venue}</p>}
            {e.address && <p className={s.muted} style={{ fontSize: 14 }}>{e.address}</p>}
            {e.mapsUrl && <a href={e.mapsUrl} target="_blank" rel="noopener" style={{ color: "#7c8b78", display: "inline-block", marginTop: 8 }}>Lihat Peta →</a>}
          </div>
        ))}
      </div>
      {data.events[0]?.date && (
        <div style={{ marginTop: 24 }}>
          <Countdown iso={`${data.events[0].date}T${data.events[0].startTime ?? "08:00"}:00`} />
        </div>
      )}
    </section>
  );
}

export function GallerySection({ data }: { data: InvitationData }) {
  if (!data.gallery.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Galeri</p>
      <div className={s.divider} />
      <div className={s.gallery}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs; next/image optimisation deferred */}
        {data.gallery.map((url, i) => (<img key={i} src={url} alt={`Galeri ${i + 1}`} />))}
      </div>
    </section>
  );
}

export function GiftSection({ data }: { data: InvitationData }) {
  if (!data.gift?.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Amplop Digital</p>
      <div className={s.divider} />
      <div style={{ display: "grid", gap: 12 }}>
        {data.gift.map((g, i) => (
          <div key={i} className={s.card}>
            <p style={{ fontWeight: 600 }}>{g.bank ?? (g.type === "ewallet" ? "E-Wallet" : "Bank")}</p>
            <p style={{ fontFamily: "var(--font-fraunces)", fontSize: 20, letterSpacing: ".05em" }}>{g.number}</p>
            <p className={s.muted} style={{ fontSize: 14 }}>a.n. {g.holder}</p>
            <div style={{ marginTop: 8 }}><CopyButton value={g.number} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Closing({ data }: { data: InvitationData }) {
  const { groom, bride } = data.couple;
  return (
    <section className={s.section}>
      <p className={s.muted}>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.</p>
      <div className={s.divider} />
      <h2 className={s.h2}>{groom.name} &amp; {bride.name}</h2>
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
