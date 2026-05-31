export type Person = {
  name: string;
  fullName?: string;
  photoUrl?: string;
  parents?: string;
  instagram?: string;
};

export type EventItem = {
  name: string;
  date: string; // ISO yyyy-mm-dd
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  mapsUrl?: string;
};

export type StoryItem = { title: string; date?: string; text: string };
export type GiftAccount = {
  type: "bank" | "ewallet";
  bank?: string;
  number: string;
  holder: string;
};

export type InvitationData = {
  couple: { groom: Person; bride: Person };
  events: EventItem[];
  quotes?: { text: string; source?: string };
  loveStory?: StoryItem[];
  gallery: string[];
  prewedVideoUrl?: string;
  musicUrl?: string;
  livestream?: { platform: string; url: string };
  gift?: GiftAccount[];
  settings?: { primaryColor?: string };
};

export type InvitationView = {
  title: string;
  slug: string;
  themeKey: string;
  data: InvitationData;
};
