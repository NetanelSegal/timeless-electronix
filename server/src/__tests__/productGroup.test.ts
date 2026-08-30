import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Product } from "../models/Product.js";
import {
  selectCanonicalDoc,
  sortLotsForDisplay,
  getProductGroup,
} from "../services/productGroup.js";
import {
  distinctManufacturerNames,
  normalizeManufacturer,
  pickManufacturerDisplay,
} from "../utils/manufacturerName.js";

const d = (iso: string) => new Date(iso);

/** Three lots of one part, seeded out of chronological order on purpose. */
async function seedLots() {
  await Product.insertMany([
    {
      partNumber: "06035A1R2BAT2A",
      manufacturer: "AVX",
      quantity: 200,
      ourReference: "NB808/42",
      seoSlug: "avx-06035a1r2bat2a-nb808-42",
      condition: "New/Standard",
      createdAt: d("2026-03-02T00:00:00Z"),
    },
    {
      partNumber: "06035A1R2BAT2A",
      manufacturer: "avx",
      quantity: 3693,
      ourReference: "NB808/29",
      seoSlug: "avx-06035a1r2bat2a",
      condition: "New/Standard",
      createdAt: d("2026-03-01T00:00:00Z"),
    },
    {
      partNumber: "06035A1R2BAT2A",
      manufacturer: "AVX",
      quantity: 960,
      ourReference: "NB802/47",
      seoSlug: "avx-06035a1r2bat2a-nb802-47",
      condition: "Used",
      createdAt: d("2026-03-03T00:00:00Z"),
    },
  ]);
}

describe("manufacturer names", () => {
  it("treats casing variants as one brand", () => {
    expect(normalizeManufacturer("  ABRACON ")).toBe("abracon");
    expect(normalizeManufacturer("Abracon")).toBe("abracon");
  });

  it("picks the most common spelling, ties broken lexicographically", () => {
    expect(pickManufacturerDisplay(["AVX", "AVX", "avx"])).toBe("AVX");
    // a tie must resolve the same way every time
    expect(pickManufacturerDisplay(["Abracon", "ABRACON"])).toBe("ABRACON");
    expect(pickManufacturerDisplay(["ABRACON", "Abracon"])).toBe("ABRACON");
  });

  it("collapses variants into one display name", () => {
    expect(
      distinctManufacturerNames(["LITTELFUSE", "Littelfuse", "LITTELFUSE", "HP", ""]),
    ).toEqual(["HP", "LITTELFUSE"]);
  });
});

describe("selectCanonicalDoc", () => {
  it("takes the oldest row so the canonical never drifts", () => {
    const picked = selectCanonicalDoc([
      { _id: "b", createdAt: d("2026-03-02T00:00:00Z"), seoSlug: "second" },
      { _id: "a", createdAt: d("2026-03-01T00:00:00Z"), seoSlug: "first" },
    ]);
    expect(picked?.seoSlug).toBe("first");
  });

  it("breaks ties on _id rather than insertion order", () => {
    const same = d("2026-03-01T00:00:00Z");
    const a = { _id: "aaa", createdAt: same, seoSlug: "a" };
    const b = { _id: "bbb", createdAt: same, seoSlug: "b" };
    expect(selectCanonicalDoc([a, b])?.seoSlug).toBe("a");
    expect(selectCanonicalDoc([b, a])?.seoSlug).toBe("a");
  });

  it("returns undefined for an empty group", () => {
    expect(selectCanonicalDoc([])).toBeUndefined();
  });
});

describe("sortLotsForDisplay", () => {
  it("puts new stock first, then the largest quantity", () => {
    const lots = sortLotsForDisplay([
      { _id: "1", seoSlug: "c", manufacturer: "", condition: "Used", quantity: 9000, dateCode: "" },
      { _id: "2", seoSlug: "a", manufacturer: "", condition: "New/Standard", quantity: 10, dateCode: "" },
      { _id: "3", seoSlug: "b", manufacturer: "", condition: "New/Standard", quantity: 500, dateCode: "" },
    ]);
    expect(lots.map((l) => l.seoSlug)).toEqual(["b", "a", "c"]);
  });
});

describe("getProductGroup", () => {
  beforeEach(seedLots);

  it("returns every lot of the part", async () => {
    const g = await getProductGroup("06035A1R2BAT2A");
    expect(g.lots).toHaveLength(3);
    expect(g.lots.map((l) => l.quantity).sort((a, b) => a - b)).toEqual([
      200, 960, 3693,
    ]);
  });

  it("does not expose the internal stock reference on a lot", async () => {
    const g = await getProductGroup("06035A1R2BAT2A");
    for (const lot of g.lots) {
      expect(lot).not.toHaveProperty("ourReference");
    }
  });

  it("canonicalises to the oldest lot's slug", async () => {
    const g = await getProductGroup("06035A1R2BAT2A");
    expect(g.canonicalSeoSlug).toBe("avx-06035a1r2bat2a");
  });

  it("collapses manufacturer casing variants", async () => {
    const g = await getProductGroup("06035A1R2BAT2A");
    expect(g.manufacturers).toEqual(["AVX"]);
  });

  it("is empty for a blank part number", async () => {
    expect(await getProductGroup("  ")).toEqual({
      lots: [],
      canonicalSeoSlug: "",
      manufacturers: [],
    });
  });

  it("does not group unrelated rows that share a corrupted part number", async () => {
    await Product.insertMany([
      { partNumber: "[object Object]", manufacturer: "EVERLIGHT", quantity: 1, seoSlug: "everlight-object-object", createdAt: d("2026-01-01T00:00:00Z") },
      { partNumber: "[object Object]", manufacturer: "MOLEX", quantity: 1, seoSlug: "molex-object-object", createdAt: d("2026-01-02T00:00:00Z") },
    ]);
    // Two different manufacturers' products; they are not lots of one part.
    expect(await getProductGroup("[object Object]")).toEqual({
      lots: [],
      canonicalSeoSlug: "",
      manufacturers: [],
    });
  });

  it("lists both brands for an OEM cross-branded part", async () => {
    await Product.insertMany([
      { partNumber: "00HN475", manufacturer: "HP", quantity: 5, seoSlug: "hp-00hn475", createdAt: d("2026-01-01T00:00:00Z") },
      { partNumber: "00HN475", manufacturer: "Lenovo", quantity: 7, seoSlug: "lenovo-00hn475", createdAt: d("2026-02-01T00:00:00Z") },
    ]);
    const g = await getProductGroup("00HN475");
    expect(g.manufacturers).toEqual(["HP", "Lenovo"]);
    expect(g.canonicalSeoSlug).toBe("hp-00hn475");
  });
});

describe("GET /api/products/slug/:seoSlug group fields", () => {
  beforeEach(seedLots);

  it("marks the canonical lot", async () => {
    const res = await request(app).get("/api/products/slug/avx-06035a1r2bat2a");
    expect(res.status).toBe(200);
    expect(res.body.isCanonical).toBe(true);
    expect(res.body.canonicalSeoSlug).toBe("avx-06035a1r2bat2a");
    expect(res.body.lots).toHaveLength(3);
    expect(res.body.manufacturers).toEqual(["AVX"]);
  });

  it("points a non-canonical lot at the canonical slug", async () => {
    const res = await request(app).get(
      "/api/products/slug/avx-06035a1r2bat2a-nb802-47",
    );
    expect(res.status).toBe(200);
    expect(res.body.isCanonical).toBe(false);
    expect(res.body.canonicalSeoSlug).toBe("avx-06035a1r2bat2a");
    // the lot itself is still served — but never with the internal reference
    expect(res.body.quantity).toBe(960);
    expect(res.body).not.toHaveProperty("ourReference");
  });

  it("still answers 404 for an unknown slug", async () => {
    const res = await request(app).get("/api/products/slug/not-a-real-part");
    expect(res.status).toBe(404);
  });
});
