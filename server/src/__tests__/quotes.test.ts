import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { QuoteRequest } from "../models/QuoteRequest.js";

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
