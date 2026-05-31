import type { InvitationData } from "@/lib/invitation/types";
import { Countdown } from "@/components/invitation/ui/countdown";
import { CopyButton } from "@/components/invitation/ui/copy-button";
import s from "./styles.module.css";

function Divider() {
  return (
    <div className={s.divider}>
      <span className={s.dividerDot} />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function Cover({
  data,
  guestName,
}: {
  data: InvitationData;
  title?: string;
  guestName?: string;
}) {
  const { groom, bride } = data.couple;
  return (
    <section className={`${s.section} ${s.cover}`}>
      <span className={s.coverCorner} />
      <span className={s.coverCorner} />
      <span className={s.coverCorner} />
      <span className={s.coverCorner} />
      <p className={s.kicker}>The Wedding Of</p>
      <h1 className={s.display}>
        {groom.name} &amp; {bride.name}
      </h1>
      {data.events[0]?.date && (
        <p className={s.muted}>{formatDate(data.events[0].date)}</p>
      )}
      <Divider />
      {guestName ? (
        <div className={s.guestLabel}>
          <p className={s.kicker}>Kepada Yth.</p>
          <p className={s.guestName}>{guestName}</p>
        </div>
      ) : null}
    </section>
  );
}

export function QuoteSection({ data }: { data: InvitationData }) {
  if (!data.quotes) return null;
  return (
    <section className={s.section}>
      <Divider />
      <p
        style={{
          fontFamily: "var(--font-fraunces)",
          fontSize: 20,
          fontStyle: "italic",
          lineHeight: 1.6,
          color: "#d4c4a8",
        }}
      >
        &ldquo;{data.quotes.text}&rdquo;
      </p>
      {data.quotes.source && (
        <p className={s.muted} style={{ marginTop: 12 }}>
          — {data.quotes.source}
        </p>
      )}
      <Divider />
    </section>
  );
}

export function CoupleSection({ data }: { data: InvitationData }) {
  const people = [data.couple.groom, data.couple.bride];
  return (
    <section className={s.section}>
      <p className={s.kicker}>Mempelai</p>
      <Divider />
      <div style={{ display: "grid", gap: 32 }}>
        {people.map((p, i) => (
          <div key={i}>
            {p.photoUrl ? (
              <div className={s.photoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs; next/image optimisation deferred */}
                <img src={p.photoUrl} alt={p.name} />
              </div>
            ) : null}
            <h2 className={s.h2}>{p.fullName ?? p.name}</h2>
            {p.parents && (
              <p className={s.muted} style={{ marginTop: 4 }}>
                {p.parents}
              </p>
            )}
            {p.instagram && (
              <p className={s.muted} style={{ marginTop: 4, color: "#c2a878" }}>
                @{p.instagram}
              </p>
            )}
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
      <Divider />
      <div className={s.eventGrid}>
        {data.events.map((e, i) => (
          <div key={i} className={s.card}>
            <h2 className={s.h2}>{e.name}</h2>
            <p className={s.muted} style={{ marginTop: 6 }}>
              {formatDate(e.date)}
              {e.startTime ? `, ${e.startTime}` : ""}
              {e.endTime ? `–${e.endTime}` : ""}
            </p>
            {e.venue && <p style={{ marginTop: 8, color: "#efe7d9" }}>{e.venue}</p>}
            {e.address && (
              <p className={s.muted} style={{ marginTop: 4 }}>
                {e.address}
              </p>
            )}
            {e.mapsUrl && (
              <a
                href={e.mapsUrl}
                target="_blank"
                rel="noopener"
                className={s.mapLink}
              >
                Lihat Peta →
              </a>
            )}
          </div>
        ))}
      </div>
      {data.events[0]?.date && (
        <div style={{ marginTop: 28 }}>
          <Countdown
            iso={`${data.events[0].date}T${data.events[0].startTime ?? "08:00"}:00`}
          />
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
      <Divider />
      <div className={s.gallery}>
        {data.gallery.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs; next/image optimisation deferred
          <img key={i} src={url} alt={`Galeri ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}

export function GiftSection({ data }: { data: InvitationData }) {
  if (!data.gift?.length) return null;
  return (
    <section className={s.section}>
      <p className={s.kicker}>Amplop Digital</p>
      <Divider />
      <div className={s.giftGrid}>
        {data.gift.map((g, i) => (
          <div key={i} className={s.card}>
            <p style={{ fontWeight: 600, color: "#c2a878", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {g.bank ?? (g.type === "ewallet" ? "E-Wallet" : "Bank")}
            </p>
            <p className={s.accountNumber}>{g.number}</p>
            <p className={s.muted} style={{ marginTop: 4 }}>a.n. {g.holder}</p>
            <div style={{ marginTop: 12 }}>
              <CopyButton value={g.number} />
            </div>
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
      <Divider />
      <p className={s.closingText}>
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
        Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
      </p>
      <Divider />
      <h2 className={s.h2} style={{ color: "#c2a878" }}>
        {groom.name} &amp; {bride.name}
      </h2>
    </section>
  );
}
