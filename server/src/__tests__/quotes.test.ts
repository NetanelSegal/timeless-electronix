import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { QuoteRequest } from "../models/QuoteRequest.js";
import { Product } from "../models/Product.js";

describe("Quotes API", () => {
  it("POST /api/quotes creates a quote request", async () => {
    const res = await request(app).post("/api/quotes").send({
      items: [
        { partNumber: "RC0402", manufacturer: "YAGEO", quantity: 5000, ourReference: "NB1" },
      ],
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const quote = await QuoteRequest.findById(res.body.id);
    expect(quote).toBeTruthy();
    expect(quote!.items).toHaveLength(1);
    expect(quote!.status).toBe("new");
  });

  it("keeps two lots of the same part as separate lines", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .send({
        items: [
          {
            partNumber: "06035A1R2BAT2A",
            manufacturer: "AVX",
            quantity: 500,
            ourReference: "NB808/28",
            condition: "New/Standard",
            dateCode: "716",
          },
          {
            partNumber: "06035A1R2BAT2A",
            manufacturer: "AVX",
            quantity: 200,
            ourReference: "NB802/47",
            condition: "Used",
            dateCode: "705",
          },
        ],
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
      });
    expect(res.status).toBe(201);

    const quote = await QuoteRequest.findById(res.body.id);
    expect(quote!.items).toHaveLength(2);
    expect(quote!.items.map((i) => [i.condition, i.quantity, i.dateCode])).toEqual([
      ["New/Standard", 500, "716"],
      ["Used", 200, "705"],
    ]);
  });

  it("accepts a line saved before lot selection existed", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .send({
        items: [{ partNumber: "X", manufacturer: "Y", quantity: 1 }],
        customerName: "Jane",
        customerEmail: "jane@example.com",
      });
    expect(res.status).toBe(201);
    const quote = await QuoteRequest.findById(res.body.id);
    expect(quote!.items[0]!.condition).toBe("");
    expect(quote!.items[0]!.dateCode).toBe("");
  });

  it("fills the internal reference from the product, not the client", async () => {
    const [prod] = await Product.create([
      {
        partNumber: "06035A1R2BAT2A",
        manufacturer: "AVX",
        quantity: 4000,
        ourReference: "NB808/28 שידה מגירה",
        condition: "Used",
        dateCode: "716",
        seoSlug: "avx-lot-a",
      },
    ]);

    const res = await request(app)
      .post("/api/quotes")
      .send({
        items: [
          {
            productId: String(prod!._id),
            partNumber: "06035A1R2BAT2A",
            manufacturer: "AVX",
            quantity: 500,
            // a client cannot supply these; the server must overwrite them
            ourReference: "ATTACKER-SUPPLIED",
            condition: "New/Standard",
            dateCode: "0000",
          },
        ],
        customerName: "Jane",
        customerEmail: "jane@example.com",
      });
    expect(res.status).toBe(201);

    const quote = await QuoteRequest.findById(res.body.id);
    const line = quote!.items[0]!;
    expect(line.ourReference).toBe("NB808/28 שידה מגירה");
    expect(line.condition).toBe("Used");
    expect(line.dateCode).toBe("716");
    expect(line.quantity).toBe(500);
  });

  it("keeps a line whose product no longer exists, without a reference", async () => {
    const res = await request(app)
      .post("/api/quotes")
      .send({
        items: [
          {
            productId: "6a33b69424a6dd6578d692a1",
            partNumber: "GONE-1",
            manufacturer: "ACME",
            quantity: 3,
          },
        ],
        customerName: "Jane",
        customerEmail: "jane@example.com",
      });
    expect(res.status).toBe(201);

    const quote = await QuoteRequest.findById(res.body.id);
    expect(quote!.items[0]!.partNumber).toBe("GONE-1");
    expect(quote!.items[0]!.ourReference).toBe("");
  });

  it("POST /api/quotes requires at least one item", async () => {
    const res = await request(app).post("/api/quotes").send({
      items: [],
      customerName: "Jane",
      customerEmail: "jane@example.com",
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/quotes validates customer email", async () => {
    const res = await request(app).post("/api/quotes").send({
      items: [{ partNumber: "X", manufacturer: "Y", quantity: 1, ourReference: "" }],
      customerName: "Jane",
      customerEmail: "invalid",
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/quotes rejects non-positive quantity", async () => {
    const res = await request(app).post("/api/quotes").send({
      items: [{ partNumber: "X", manufacturer: "Y", quantity: 0, ourReference: "" }],
      customerName: "Jane",
      customerEmail: "jane@example.com",
    });
    expect(res.status).toBe(400);
  });
});
