import { z } from "zod";

const personSchema = z.object({
  name: z.string().min(1),
  fullName: z.string().optional(),
  photoUrl: z.string().optional(),
  parents: z.string().optional(),
  instagram: z.string().optional(),
});

const eventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  mapsUrl: z.string().optional(),
});

export const invitationDataSchema = z.object({
  couple: z.object({ groom: personSchema, bride: personSchema }),
  events: z.array(eventSchema).default([]),
  quotes: z.object({ text: z.string(), source: z.string().optional() }).optional(),
  loveStory: z
    .array(z.object({ title: z.string(), date: z.string().optional(), text: z.string() }))
    .optional(),
  gallery: z.array(z.string()).default([]),
  prewedVideoUrl: z.string().optional(),
  musicUrl: z.string().optional(),
  livestream: z.object({ platform: z.string(), url: z.string() }).optional(),
  gift: z
    .array(
      z.object({
        type: z.enum(["bank", "ewallet"]),
        bank: z.string().optional(),
        number: z.string(),
        holder: z.string(),
      }),
    )
    .optional(),
  settings: z.object({ primaryColor: z.string().optional() }).optional(),
});
