// @vitest-environment node
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Putri dan Putra")).toBe("putri-dan-putra");
  });
  it("strips non-alphanumeric except dash", () => {
    expect(slugify("Andi & Sari!")).toBe("andi-sari");
  });
  it("collapses multiple dashes and trims", () => {
    expect(slugify("  a   b  ")).toBe("a-b");
  });
});
