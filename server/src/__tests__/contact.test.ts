import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { ContactMessage } from "../models/ContactMessage.js";

describe("Contact API", () => {
  it("POST /api/contact creates a message", async () => {
    const res = await request(app).post("/api/contact").send({
      fullName: "John Doe",
      email: "john@example.com",
      message: "Need 1000 capacitors",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const msg = await ContactMessage.findById(res.body.id);
    expect(msg).toBeTruthy();
    expect(msg!.fullName).toBe("John Doe");
    expect(msg!.isRead).toBe(false);
  });

  it("POST /api/contact validates required fields", async () => {
    const res = await request(app).post("/api/contact").send({
      email: "john@example.com",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("POST /api/contact validates email format", async () => {
    const res = await request(app).post("/api/contact").send({
      fullName: "John",
      email: "not-an-email",
      message: "Hello",
    });
    expect(res.status).toBe(400);
  });
});
