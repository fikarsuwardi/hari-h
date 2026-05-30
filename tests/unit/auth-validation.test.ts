// @vitest-environment node
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const r = registerSchema.safeParse({
      fullName: "Andi", email: "andi@mail.com", phone: "08123456789", password: "secret12",
    });
    expect(r.success).toBe(true);
  });
  it("rejects short password", () => {
    const r = registerSchema.safeParse({
      fullName: "Andi", email: "andi@mail.com", phone: "08123456789", password: "123",
    });
    expect(r.success).toBe(false);
  });
  it("rejects invalid email", () => {
    const r = loginSchema.safeParse({ email: "bukan-email", password: "secret12" });
    expect(r.success).toBe(false);
  });
});
