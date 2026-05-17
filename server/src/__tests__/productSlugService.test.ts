import { describe, it, expect } from "vitest";
import { Product } from "../models/Product.js";
import {
  findFirstAvailableSlug,
  isSeoSlugTaken,
} from "../services/productSlugService.js";

describe("productSlugService", () => {
  it("isSeoSlugTaken returns false when slug is free", async () => {
    expect(await isSeoSlugTaken("free-slug-xyz")).toBe(false);
  });

  it("isSeoSlugTaken returns true when slug exists", async () => {
    await Product.create({
      partNumber: "PN1",
      manufacturer: "M",
      quantity: 1,
      seoSlug: "taken-slug-service-test",
    });
    expect(await isSeoSlugTaken("taken-slug-service-test")).toBe(true);
  });

  it("isSeoSlugTaken excludes current product id", async () => {
    const doc = await Product.create({
      partNumber: "PN2",
      manufacturer: "M",
      quantity: 1,
      seoSlug: "exclude-id-slug-test",
    });
    expect(await isSeoSlugTaken("exclude-id-slug-test", String(doc._id))).toBe(
      false,
    );
  });

  it("findFirstAvailableSlug returns base when free", async () => {
    expect(await findFirstAvailableSlug("brand-new-slug-abc")).toBe(
      "brand-new-slug-abc",
    );
  });

  it("findFirstAvailableSlug returns suffixed slug when base is taken", async () => {
    await Product.create({
      partNumber: "PN3",
      manufacturer: "M",
      quantity: 1,
      seoSlug: "collision-base-slug",
    });
    expect(await findFirstAvailableSlug("collision-base-slug")).toBe(
      "collision-base-slug-1",
    );
  });
});
