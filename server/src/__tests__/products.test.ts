import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Product } from "../models/Product.js";

describe("Products API", () => {
  beforeEach(async () => {
    await Product.insertMany([
      { partNumber: "RC0402JR-074K7L", manufacturer: "YAGEO", description: "Resistor", quantity: 80000, ourReference: "NB100/1", dateCode: "2020" },
      { partNumber: "CL03A104KQ3NNNC", manufacturer: "SAMSUNG", description: "Capacitor", quantity: 100000, ourReference: "NB200/2", dateCode: "1747" },
      { partNumber: "GRM1555C1H7R0DZ01D", manufacturer: "Murata", description: "Cap 0402", quantity: 1984, ourReference: "NB1219/34", dateCode: "" },
    ]);
  });

  it("GET /api/products returns paginated products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
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

  it("GET /api/products/manufacturers returns distinct manufacturers", async () => {
    const res = await request(app).get("/api/products/manufacturers");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining(["Murata", "SAMSUNG", "YAGEO"]));
    expect(res.body).toHaveLength(3);
  });

  it("GET /api/products/:id returns a single product", async () => {
    const product = await Product.findOne({ partNumber: "RC0402JR-074K7L" });
    const res = await request(app).get(`/api/products/${product!._id}`);
    expect(res.status).toBe(200);
    expect(res.body.partNumber).toBe("RC0402JR-074K7L");
  });

  it("GET /api/products/:id returns 404 for invalid id", async () => {
    const res = await request(app).get("/api/products/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});
