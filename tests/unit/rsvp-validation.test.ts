// @vitest-environment node
import { describe, it, expect } from "vitest";
import { rsvpSchema } from "@/lib/validation/rsvp";

describe("rsvpSchema", () => {
  it("accepts valid", () => {
    expect(rsvpSchema.safeParse({ name: "Budi", attendance: "hadir", headcount: 2, message: "Selamat" }).success).toBe(true);
  });
  it("rejects empty name", () => {
    expect(rsvpSchema.safeParse({ name: "", attendance: "hadir", headcount: 1 }).success).toBe(false);
  });
  it("rejects bad attendance", () => {
    expect(rsvpSchema.safeParse({ name: "Budi", attendance: "mungkin", headcount: 1 }).success).toBe(false);
  });
});
