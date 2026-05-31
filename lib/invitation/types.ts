export type Person = {
  name: string;
  fullName?: string | null;
  photoUrl?: string | null;
  parents?: string | null;
  instagram?: string | null;
};

export type EventItem = {
  name: string;
  date: string; // ISO yyyy-mm-dd
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
};

export type StoryItem = { title: string; date?: string | null; text: string };
export type GiftAccount = {
  type: "bank" | "ewallet";
  bank?: string;
  number: string;
  holder: string;
};

export type InvitationData = {
  couple: { groom: Person; bride: Person };
  events: EventItem[];
  quotes?: { text: string; source?: string } | null;
  loveStory?: StoryItem[] | null;
  gallery: string[];
  prewedVideoUrl?: string | null;
  musicUrl?: string | null;
  livestream?: { platform: string; url: string } | null;
  gift?: GiftAccount[] | null;
  settings?: { primaryColor?: string } | null;
};

export type InvitationView = {
  title: string;
  slug: string;
  themeKey: string;
  data: InvitationData;
};
