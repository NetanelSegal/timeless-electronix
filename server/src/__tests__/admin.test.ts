import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { Product } from "../models/Product.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { QuoteRequest } from "../models/QuoteRequest.js";

async function getAdminToken(): Promise<string> {
  const res = await request(app).post("/api/admin/login").send({ secret: "test-secret" });
  return res.body.token as string;
}

describe("Admin API", () => {
  describe("Auth", () => {
    it("POST /api/admin/login succeeds with correct secret", async () => {
      const res = await request(app).post("/api/admin/login").send({ secret: "test-secret" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
    });

    it("POST /api/admin/login fails with wrong secret", async () => {
      const res = await request(app).post("/api/admin/login").send({ secret: "wrong" });
      expect(res.status).toBe(401);
    });

    it("Protected routes reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/admin/stats");
      expect(res.status).toBe(401);
    });
  });

  describe("Stats", () => {
    it("GET /api/admin/stats returns counts", async () => {
      const token = await getAdminToken();
      await Product.create({ partNumber: "TEST1", manufacturer: "X", quantity: 10 });
      await ContactMessage.create({ fullName: "A", email: "a@a.com", message: "Hi" });
      await QuoteRequest.create({
        items: [{ partNumber: "P1", manufacturer: "M", quantity: 1, ourReference: "" }],
        customerName: "B",
        customerEmail: "b@b.com",
        status: "new",
      });

      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.totalProducts).toBe(1);
      expect(res.body.unreadMessages).toBe(1);
      expect(res.body.newQuotes).toBe(1);
    });
  });

  describe("Products CRUD", () => {
    it("Creates, updates, and deletes a product", async () => {
      const token = await getAdminToken();

      const createRes = await request(app)
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ partNumber: "NEW-PART", manufacturer: "TEST", quantity: 500 });
      expect(createRes.status).toBe(201);
      const id = createRes.body._id;

      const updateRes = await request(app)
        .put(`/api/admin/products/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantity: 999 });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.quantity).toBe(999);

      const deleteRes = await request(app)
        .delete(`/api/admin/products/${id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    it("Product images: reorder, delete, reject invalid reorder", async () => {
      const token = await getAdminToken();

      const createRes = await request(app)
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ partNumber: "IMG-CRUD", manufacturer: "X", quantity: 1 });
      expect(createRes.status).toBe(201);
      expect(createRes.body.imageUrls).toEqual([]);
      expect(createRes.body.imageUrl).toBeUndefined();
      const id = createRes.body._id as string;

      await Product.findByIdAndUpdate(id, {
        imageUrls: ["https://a.example/a.jpg", "https://a.example/b.jpg"],
      });

      const reorderRes = await request(app)
        .put(`/api/admin/products/${id}/images`)
        .set("Authorization", `Bearer ${token}`)
        .send({ imageUrls: ["https://a.example/b.jpg", "https://a.example/a.jpg"] });
      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.imageUrls).toEqual([
        "https://a.example/b.jpg",
        "https://a.example/a.jpg",
      ]);

      const badReorder = await request(app)
        .put(`/api/admin/products/${id}/images`)
        .set("Authorization", `Bearer ${token}`)
        .send({ imageUrls: ["https://a.example/b.jpg"] });
      expect(badReorder.status).toBe(400);

      const delRes = await request(app)
        .delete(`/api/admin/products/${id}/images`)
        .set("Authorization", `Bearer ${token}`)
        .send({ url: "https://a.example/a.jpg" });
      expect(delRes.status).toBe(200);
      expect(delRes.body.imageUrls).toEqual(["https://a.example/b.jpg"]);
    });
  });

  describe("Messages", () => {
    it("Lists and marks messages as read", async () => {
      const token = await getAdminToken();
      await ContactMessage.create({ fullName: "Test", email: "t@t.com", message: "Hello" });

      const listRes = await request(app)
        .get("/api/admin/messages")
        .set("Authorization", `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.messages).toHaveLength(1);
      expect(listRes.body.messages[0].isRead).toBe(false);

      const id = listRes.body.messages[0]._id;
      const readRes = await request(app)
        .patch(`/api/admin/messages/${id}/read`)
        .set("Authorization", `Bearer ${token}`);
      expect(readRes.status).toBe(200);
      expect(readRes.body.isRead).toBe(true);
    });
  });

  describe("Quotes management", () => {
    it("Lists quotes and updates status", async () => {
      const token = await getAdminToken();
      await QuoteRequest.create({
        items: [{ partNumber: "P1", manufacturer: "M", quantity: 100, ourReference: "R1" }],
        customerName: "Customer",
        customerEmail: "c@c.com",
        status: "new",
      });

      const listRes = await request(app)
        .get("/api/admin/quotes")
        .set("Authorization", `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.quotes).toHaveLength(1);

      const id = listRes.body.quotes[0]._id;
      const statusRes = await request(app)
        .patch(`/api/admin/quotes/${id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "completed" });
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.status).toBe("completed");
    });
  });
});
