import { describe, it, expect } from "vitest";
import {
  canonicalSlugFor,
  hasMultipleManufacturers,
  manufacturerLabel,
} from "./productGroup";
import type { Product } from "./types";

function product(over: Partial<Product> = {}): Product {
  return {
    _id: "1",
    partNumber: "06035A1R2BAT2A",
    description: "",
    quantity: 200,
    ourReference: "NB808/42",
    manufacturer: "AVX",
    dateCode: "717",
    condition: "New/Standard",
    seoSlug: "avx-06035a1r2bat2a-nb808-42",
    productSummary: "",
    imageUrls: [],
    isSample: false,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

describe("canonicalSlugFor", () => {
  it("points a lot at the URL that represents the part", () => {
    expect(
      canonicalSlugFor(product({ canonicalSeoSlug: "avx-06035a1r2bat2a" })),
    ).toBe("avx-06035a1r2bat2a");
  });

  it("falls back to the product's own slug without a group", () => {
    expect(canonicalSlugFor(product())).toBe("avx-06035a1r2bat2a-nb808-42");
  });

  it("ignores a blank canonical rather than emitting an empty URL", () => {
    expect(canonicalSlugFor(product({ canonicalSeoSlug: "   " }))).toBe(
      "avx-06035a1r2bat2a-nb808-42",
    );
  });
});

describe("manufacturerLabel", () => {
  it("uses the group's cleaned name over the row's raw spelling", () => {
    expect(
      manufacturerLabel(product({ manufacturer: "avx", manufacturers: ["AVX"] })),
    ).toBe("AVX");
  });

  it("joins both brands for an OEM cross-brand", () => {
    expect(
      manufacturerLabel(product({ manufacturers: ["HP", "Lenovo"] })),
    ).toBe("HP · Lenovo");
  });

  it("falls back to the row's manufacturer without a group", () => {
    expect(manufacturerLabel(product({ manufacturer: "Murata" }))).toBe("Murata");
  });

  it("ignores blank entries", () => {
    expect(
      manufacturerLabel(product({ manufacturer: "Murata", manufacturers: ["  "] })),
    ).toBe("Murata");
  });
});

describe("hasMultipleManufacturers", () => {
  it("is true only when the lots disagree on the maker", () => {
    expect(hasMultipleManufacturers(product({ manufacturers: ["HP", "Lenovo"] }))).toBe(true);
    expect(hasMultipleManufacturers(product({ manufacturers: ["AVX"] }))).toBe(false);
    expect(hasMultipleManufacturers(product())).toBe(false);
  });
});
