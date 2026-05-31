import type { InvitationView } from "@/lib/invitation/types";
import { MusicToggle } from "@/components/invitation/ui/music-toggle";
import { Cover, QuoteSection, CoupleSection, EventsSection, GallerySection, GiftSection, Closing } from "./sections";
import s from "./styles.module.css";

export default function MinimalisO1({ view, guestName }: { view: InvitationView; guestName?: string }) {
  const { data, title } = view;
  return (
    <main className={s.root}>
      <Cover data={data} title={title} guestName={guestName} />
      <QuoteSection data={data} />
      <CoupleSection data={data} />
      <EventsSection data={data} />
      <GallerySection data={data} />
      <GiftSection data={data} />
      <Closing data={data} />
      {data.musicUrl && <MusicToggle src={data.musicUrl} />}
    </main>
  );
}
