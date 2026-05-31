// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isReservedSlug, validateSlug } from "@/lib/invitation/reserved-slugs";

describe("reserved slugs", () => {
  it("flags reserved words", () => {
    expect(isReservedSlug("login")).toBe(true);
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("andi-dan-sari")).toBe(false);
  });
  it("validateSlug returns error for invalid/reserved", () => {
    expect(validateSlug("andi-sari")).toBeNull();
    expect(validateSlug("Andi Sari")).toMatch(/huruf kecil/i);
    expect(validateSlug("ab")).toMatch(/minimal/i);
    expect(validateSlug("api")).toMatch(/tidak tersedia/i);
  });
});
