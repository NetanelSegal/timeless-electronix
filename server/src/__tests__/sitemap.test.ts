import { describe, it, expect, beforeEach } from "vitest";
import { Product } from "../models/Product.js";
import { buildSitemapXmlString } from "../utils/sitemap.js";
import { getProductGroup } from "../services/productGroup.js";

const BASE = "https://example.com";
const d = (iso: string) => new Date(iso);

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
}

function productLocs(xml: string): string[] {
  return locs(xml).filter((l) => l.includes("/catalog/"));
}

describe("sitemap", () => {
  it("lists one URL per part, not one per stock lot", async () => {
    await Product.insertMany([
      { partNumber: "06035A1R2BAT2A", seoSlug: "avx-x", quantity: 1, createdAt: d("2026-03-01T00:00:00Z") },
      { partNumber: "06035A1R2BAT2A", seoSlug: "avx-x-nb808-42", quantity: 1, createdAt: d("2026-03-02T00:00:00Z") },
      { partNumber: "06035A1R2BAT2A", seoSlug: "avx-x-nb802-47", quantity: 1, createdAt: d("2026-03-03T00:00:00Z") },
      { partNumber: "OTHER", seoSlug: "other-part", quantity: 1, createdAt: d("2026-03-01T00:00:00Z") },
    ]);

    const xml = await buildSitemapXmlString(BASE);
    expect(productLocs(xml)).toEqual([
      `${BASE}/catalog/avx-x`,
      `${BASE}/catalog/other-part`,
    ]);
  });

  it("advertises exactly the URL the product API canonicalises to", async () => {
    await Product.insertMany([
      { partNumber: "P", seoSlug: "p-newer", quantity: 1, createdAt: d("2026-05-02T00:00:00Z") },
      { partNumber: "P", seoSlug: "p-older", quantity: 1, createdAt: d("2026-05-01T00:00:00Z") },
    ]);

    const xml = await buildSitemapXmlString(BASE);
    const group = await getProductGroup("P");

    expect(productLocs(xml)).toEqual([`${BASE}/catalog/${group.canonicalSeoSlug}`]);
    expect(group.canonicalSeoSlug).toBe("p-older");
  });

  it("uses the latest change anywhere in the group as lastmod", async () => {
    await Product.insertMany([
      { partNumber: "P", seoSlug: "p-a", quantity: 1, createdAt: d("2026-05-01T00:00:00Z"), updatedAt: d("2026-05-01T00:00:00Z") },
      { partNumber: "P", seoSlug: "p-b", quantity: 1, createdAt: d("2026-05-02T00:00:00Z"), updatedAt: d("2026-07-20T00:00:00Z") },
    ]);

    const xml = await buildSitemapXmlString(BASE);
    expect(xml).toContain(`${BASE}/catalog/p-a`);
    expect(xml).toContain("<lastmod>2026-07-20</lastmod>");
  });

  it("keeps rows with a blank part number as their own URLs", async () => {
    // partNumber is required by the schema, so such rows can only arrive
    // through a raw bulk write — which is how this catalog was loaded.
    await Product.collection.insertMany([
      { partNumber: "", seoSlug: "blank-one", quantity: 1, createdAt: d("2026-05-01T00:00:00Z") },
      { partNumber: "", seoSlug: "blank-two", quantity: 1, createdAt: d("2026-05-02T00:00:00Z") },
    ]);

    const xml = await buildSitemapXmlString(BASE);
    expect(productLocs(xml).sort()).toEqual([
      `${BASE}/catalog/blank-one`,
      `${BASE}/catalog/blank-two`,
    ]);
  });

  it("keeps the static pages and escapes the URLs", async () => {
    const xml = await buildSitemapXmlString(BASE);
    expect(locs(xml)).toEqual([
      `${BASE}/`,
      `${BASE}/catalog`,
      `${BASE}/about`,
      `${BASE}/contact`,
      `${BASE}/quote`,
    ]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it("leaves out rows whose part number is a stringified object", async () => {
    await Product.insertMany([
      { partNumber: "[object Object]", seoSlug: "everlight-object-object", quantity: 1, createdAt: d("2026-05-01T00:00:00Z") },
      { partNumber: "REAL-PART", seoSlug: "real-part", quantity: 1, createdAt: d("2026-05-01T00:00:00Z") },
    ]);

    const xml = await buildSitemapXmlString(BASE);
    expect(productLocs(xml)).toEqual([`${BASE}/catalog/real-part`]);
  });

  it("skips rows with no slug", async () => {
    await Product.insertMany([
      { partNumber: "A", seoSlug: "a-slug", quantity: 1, createdAt: d("2026-05-01T00:00:00Z") },
    ]);
    await Product.collection.insertOne({ partNumber: "B", seoSlug: "", quantity: 1 });

    const xml = await buildSitemapXmlString(BASE);
    expect(productLocs(xml)).toEqual([`${BASE}/catalog/a-slug`]);
  });
});
