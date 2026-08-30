import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Product } from "../models/Product.js";

describe("Products API", () => {
  beforeEach(async () => {
    await Product.insertMany([
      {
        partNumber: "RC0402JR-074K7L",
        manufacturer: "YAGEO",
        description: "Resistor",
        quantity: 80000,
        ourReference: "NB100/1",
        dateCode: "2020",
        seoSlug: "yageo-rc0402jr-074k7l",
        productSummary: "YAGEO resistor",
      },
      {
        partNumber: "CL03A104KQ3NNNC",
        manufacturer: "SAMSUNG",
        description: "Capacitor",
        quantity: 100000,
        ourReference: "NB200/2",
        dateCode: "1747",
        seoSlug: "samsung-cl03a104kq3nnnc",
      },
      {
        partNumber: "GRM1555C1H7R0DZ01D",
        manufacturer: "Murata",
        description: "Cap 0402",
        quantity: 1984,
        ourReference: "NB1219/34",
        dateCode: "",
        seoSlug: "murata-grm1555c1h7r0dz01d",
      },
    ]);
  });

  it("never exposes the internal stock reference publicly", async () => {
    // ~5% of rows hold free-text Hebrew warehouse notes here, so this must not
    // reach the browser on any public route.
    const list = await request(app).get("/api/products?limit=5");
    expect(list.status).toBe(200);
    expect(list.body.products.length).toBeGreaterThan(0);
    for (const product of list.body.products) {
      expect(product).not.toHaveProperty("ourReference");
    }

    const one = await request(app).get(
      "/api/products/slug/yageo-rc0402jr-074k7l",
    );
    expect(one.status).toBe(200);
    expect(one.body).not.toHaveProperty("ourReference");
    for (const lot of one.body.lots ?? []) {
      expect(lot).not.toHaveProperty("ourReference");
    }
  });

  it("GET /api/products returns paginated products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    for (const p of res.body.products) {
      expect(Array.isArray(p.imageUrls)).toBe(true);
      expect(p.imageUrl).toBeUndefined();
      expect(typeof p.seoSlug).toBe("string");
    }
  });

  it("GET /api/products merges legacy imageUrl into imageUrls and omits imageUrl", async () => {
    await Product.create({
      partNumber: "LEGACY-IMG",
      manufacturer: "M",
      description: "",
      quantity: 1,
      seoSlug: "legacy-img-part",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    });
    const res = await request(app).get("/api/products/slug/legacy-img-part");
    expect(res.status).toBe(200);
    expect(res.body.imageUrls).toEqual([
      "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
    ]);
    expect(res.body.imageUrl).toBeUndefined();
  });

  it("GET /api/products?search= filters by part number", async () => {
    const res = await request(app).get("/api/products?search=RC0402");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].partNumber).toBe("RC0402JR-074K7L");
  });

  it("GET /api/products?manufacturer= filters by manufacturer", async () => {
    const res = await request(app).get("/api/products?manufacturer=SAMSUNG");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].manufacturer).toBe("SAMSUNG");
  });

  it("GET /api/products?searchField=partNumber scopes search", async () => {
    const res = await request(app).get(
      "/api/products?search=RC0402&searchField=partNumber",
    );
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].partNumber).toBe("RC0402JR-074K7L");
  });

  it("GET /api/products?minQty= filters by minimum quantity", async () => {
    const res = await request(app).get("/api/products?minQty=50000");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  it("GET /api/products?condition= filters by condition", async () => {
    await Product.updateOne(
      { partNumber: "RC0402JR-074K7L" },
      { $set: { condition: "Used" } },
    );
    const res = await request(app).get("/api/products?condition=Used");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].partNumber).toBe("RC0402JR-074K7L");
  });

  it("GET /api/products/manufacturers returns distinct manufacturers", async () => {
    const res = await request(app).get("/api/products/manufacturers");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining(["Murata", "SAMSUNG", "YAGEO"]));
    expect(res.body).toHaveLength(3);
  });

  it("GET /api/products?seoSlug= returns a single product", async () => {
    const product = await Product.findOne({ partNumber: "RC0402JR-074K7L" });
    const res = await request(app).get(
      `/api/products?seoSlug=${encodeURIComponent(product!.seoSlug)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.partNumber).toBe("RC0402JR-074K7L");
    expect(res.body.seoSlug).toBe("yageo-rc0402jr-074k7l");
  });

  it("GET /api/products/slug/:seoSlug returns a single product", async () => {
    const product = await Product.findOne({ partNumber: "RC0402JR-074K7L" });
    const res = await request(app).get(
      `/api/products/slug/${encodeURIComponent(product!.seoSlug)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.partNumber).toBe("RC0402JR-074K7L");
    expect(res.body.seoSlug).toBe("yageo-rc0402jr-074k7l");
  });

  it("GET /api/products/slug/:seoSlug returns 404 when not found", async () => {
    const res = await request(app).get(
      "/api/products/slug/does-not-exist-slug-xyz",
    );
    expect(res.status).toBe(404);
  });

});
