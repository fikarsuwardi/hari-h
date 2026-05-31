// @vitest-environment node
import { describe, it, expect } from "vitest";
import { invitationDataSchema } from "@/lib/invitation/schema";

const valid = {
  couple: {
    groom: { name: "Putra" },
    bride: { name: "Putri" },
  },
  events: [
    { name: "Akad", date: "2026-09-01", startTime: "08:00", venue: "Masjid Agung" },
  ],
};

describe("invitationDataSchema", () => {
  it("accepts minimal valid data and applies defaults", () => {
    const r = invitationDataSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.gallery).toEqual([]);
      expect(r.data.events).toHaveLength(1);
    }
  });
  it("rejects when couple names missing", () => {
    const r = invitationDataSchema.safeParse({ events: [] });
    expect(r.success).toBe(false);
  });
});
