import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Product } from "../models/Product.js";
import { clearManufacturerCache } from "../services/manufacturerIndex.js";
import { productListFilterFromQuery } from "../utils/productListFilter.js";

/** The same brand, spelled three ways — as it is in the imported data. */
beforeEach(async () => {
  clearManufacturerCache();
  await Product.insertMany([
    { partNumber: "P1", manufacturer: "ABRACON", quantity: 10, seoSlug: "abracon-p1" },
    { partNumber: "P2", manufacturer: "Abracon", quantity: 20, seoSlug: "abracon-p2" },
    { partNumber: "P3", manufacturer: "abracon", quantity: 30, seoSlug: "abracon-p3" },
    { partNumber: "P4", manufacturer: "Yageo", quantity: 40, seoSlug: "yageo-p4" },
  ]);
});

describe("manufacturer filter", () => {
  it("matches every casing variant of the chosen brand", async () => {
    const res = await request(app).get("/api/products?manufacturer=ABRACON");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.products.map((p: { seoSlug: string }) => p.seoSlug).sort()).toEqual([
      "abracon-p1",
      "abracon-p2",
      "abracon-p3",
    ]);
  });

  it("matches regardless of the casing the caller sends", async () => {
    for (const q of ["ABRACON", "Abracon", "abracon", "  AbRaCoN  "]) {
      const res = await request(app).get(
        `/api/products?manufacturer=${encodeURIComponent(q)}`,
      );
      expect(res.body.total, `query ${q}`).toBe(3);
    }
  });

  it("does not bleed into another brand", async () => {
    const res = await request(app).get("/api/products?manufacturer=Yageo");
    expect(res.body.total).toBe(1);
  });

  it("finds nothing for an unknown manufacturer", async () => {
    const res = await request(app).get("/api/products?manufacturer=NoSuchBrand");
    expect(res.body.total).toBe(0);
  });

  it("lists each brand once in the dropdown", async () => {
    const res = await request(app).get("/api/products/manufacturers");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(["ABRACON", "Yageo"]);
  });
});

describe("productListFilterFromQuery manufacturer clause", () => {
  it("uses $in when variants are supplied", () => {
    const f = productListFilterFromQuery({ manufacturer: "ABRACON" }, "public", {
      manufacturerVariants: ["ABRACON", "Abracon"],
    });
    expect(JSON.stringify(f)).toContain('"$in":["ABRACON","Abracon"]');
  });

  it("falls back to an exact match when none are supplied", () => {
    const f = productListFilterFromQuery({ manufacturer: "ABRACON" }, "public");
    expect(JSON.stringify(f)).toContain('"manufacturer":"ABRACON"');
  });

  it("adds no manufacturer clause when none is requested", () => {
    const f = productListFilterFromQuery({}, "public");
    expect(JSON.stringify(f)).not.toContain("manufacturer");
  });
});
