import { describe, it, expect } from "vitest";
import {
  buildBaseSeoSlug,
  isValidSeoSlug,
  slugWithNumericSuffix,
} from "../utils/seoSlug.js";

describe("seoSlug utils", () => {
  it("buildBaseSeoSlug combines manufacturer and part number", () => {
    expect(buildBaseSeoSlug("Yageo", "RC0402JR-074K7L")).toBe(
      "yageo-rc0402jr-074k7l",
    );
  });

  it("buildBaseSeoSlug uses part number only when manufacturer empty", () => {
    expect(buildBaseSeoSlug("", "ABC 123")).toBe("abc-123");
  });

  it("buildBaseSeoSlug returns empty when part number empty", () => {
    expect(buildBaseSeoSlug("Acme", "")).toBe("");
  });

  it("isValidSeoSlug accepts valid slugs", () => {
    expect(isValidSeoSlug("yageo-rc0402jr-074k7l")).toBe(true);
    expect(isValidSeoSlug("Bad_Slug")).toBe(false);
    expect(isValidSeoSlug("-leading")).toBe(false);
  });

  it("slugWithNumericSuffix appends counter", () => {
    expect(slugWithNumericSuffix("acme-part", 1)).toBe("acme-part-1");
  });
});
