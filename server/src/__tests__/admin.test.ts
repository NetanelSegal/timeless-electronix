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
      await Product.create({
        partNumber: "TEST1",
        manufacturer: "X",
        quantity: 10,
        seoSlug: "test1-stats-product",
      });
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
        .send({
          partNumber: "NEW-PART",
          manufacturer: "TEST",
          quantity: 500,
          seoSlug: "new-part-admin-crud",
        });
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

    it("GET /products/slug-availability reports taken slugs with suggestion", async () => {
      const token = await getAdminToken();
      await Product.create({
        partNumber: "SLUG-A",
        manufacturer: "M",
        quantity: 1,
        seoSlug: "slug-avail-test",
      });

      const free = await request(app)
        .get("/api/admin/products/slug-availability?seoSlug=free-slug-xyz")
        .set("Authorization", `Bearer ${token}`);
      expect(free.status).toBe(200);
      expect(free.body.available).toBe(true);

      const taken = await request(app)
        .get("/api/admin/products/slug-availability?seoSlug=slug-avail-test")
        .set("Authorization", `Bearer ${token}`);
      expect(taken.status).toBe(200);
      expect(taken.body.available).toBe(false);
      expect(taken.body.suggestion).toBe("slug-avail-test-1");
    });

    it("POST /products returns 409 when seoSlug is duplicate", async () => {
      const token = await getAdminToken();
      await Product.create({
        partNumber: "DUP-1",
        manufacturer: "M",
        quantity: 1,
        seoSlug: "duplicate-slug-test",
      });

      const res = await request(app)
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          partNumber: "DUP-2",
          manufacturer: "M",
          quantity: 1,
          seoSlug: "duplicate-slug-test",
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/slug/i);
    });

    it("GET /products filters by manufacturer, qty range, isSample, hasImages", async () => {
      const token = await getAdminToken();
      await Product.insertMany([
        {
          partNumber: "FILT-A",
          manufacturer: "Acme",
          quantity: 100,
          seoSlug: "filt-a",
          isSample: false,
          imageUrls: ["https://x.example/1.jpg"],
        },
        {
          partNumber: "FILT-B",
          manufacturer: "Beta",
          quantity: 5,
          seoSlug: "filt-b",
          isSample: true,
          imageUrls: [],
        },
        {
          partNumber: "FILT-C",
          manufacturer: "Acme",
          quantity: 200,
          seoSlug: "filt-c",
          isSample: false,
          imageUrl: "https://legacy.example/only.jpg",
          imageUrls: [],
        },
      ]);

      const byMfg = await request(app)
        .get("/api/admin/products?manufacturer=Acme&limit=100")
        .set("Authorization", `Bearer ${token}`);
      expect(byMfg.status).toBe(200);
      expect(byMfg.body.products.map((p: { partNumber: string }) => p.partNumber).sort()).toEqual(
        ["FILT-A", "FILT-C"].sort(),
      );

      const byQty = await request(app)
        .get("/api/admin/products?minQty=50&maxQty=150&limit=100")
        .set("Authorization", `Bearer ${token}`);
      expect(byQty.status).toBe(200);
      expect(byQty.body.products.map((p: { partNumber: string }) => p.partNumber)).toContain(
        "FILT-A",
      );
      expect(byQty.body.products.map((p: { partNumber: string }) => p.partNumber)).not.toContain(
        "FILT-B",
      );

      const bySample = await request(app)
        .get("/api/admin/products?isSample=true&limit=100")
        .set("Authorization", `Bearer ${token}`);
      expect(bySample.status).toBe(200);
      expect(bySample.body.products.every((p: { isSample: boolean }) => p.isSample)).toBe(true);
      expect(bySample.body.products.map((p: { partNumber: string }) => p.partNumber)).toContain(
        "FILT-B",
      );

      const byImg = await request(app)
        .get("/api/admin/products?hasImages=true&limit=100")
        .set("Authorization", `Bearer ${token}`);
      expect(byImg.status).toBe(200);
      const parts = byImg.body.products.map((p: { partNumber: string }) => p.partNumber);
      expect(parts).toContain("FILT-A");
      expect(parts).toContain("FILT-C");
      expect(parts).not.toContain("FILT-B");
    });

    it("GET /products searchField limits text search to one field", async () => {
      const token = await getAdminToken();
      await Product.insertMany([
        {
          partNumber: "UNIQUE-PN-XYZ",
          manufacturer: "Other",
          quantity: 1,
          seoSlug: "unique-pn-xyz",
          description: "no match here",
        },
        {
          partNumber: "OTHER-PN",
          manufacturer: "Other",
          quantity: 1,
          seoSlug: "other-pn",
          description: "contains UNIQUE-PN-XYZ in text",
        },
      ]);

      const scoped = await request(app)
        .get(
          "/api/admin/products?search=UNIQUE-PN-XYZ&searchField=partNumber&limit=100",
        )
        .set("Authorization", `Bearer ${token}`);
      expect(scoped.status).toBe(200);
      expect(scoped.body.products).toHaveLength(1);
      expect(scoped.body.products[0].partNumber).toBe("UNIQUE-PN-XYZ");
    });

    it("still returns the internal stock reference to admins", async () => {
      // The other half of the public-side guarantee: the field is stripped for
      // customers, but the office needs it to locate stock. Using the public
      // serializer here would silently break that.
      const token = await getAdminToken();
      await Product.create({
        partNumber: "REF-VISIBLE-1",
        manufacturer: "ACME",
        quantity: 5,
        ourReference: "NB999/1 שידה מגירה",
        seoSlug: "acme-ref-visible-1",
      });

      const res = await request(app)
        .get("/api/admin/products?search=REF-VISIBLE-1&limit=10")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      const row = res.body.products.find(
        (p: { partNumber: string }) => p.partNumber === "REF-VISIBLE-1",
      );
      expect(row).toBeTruthy();
      expect(row.ourReference).toBe("NB999/1 שידה מגירה");
    });

    it("GET /products missingSlug finds rows with empty or missing seoSlug", async () => {
      const token = await getAdminToken();
      const col = Product.collection;
      await col.insertOne({
        partNumber: "RAW-NO-SLUG",
        manufacturer: "Z",
        quantity: 1,
        description: "",
        ourReference: "",
        dateCode: "",
        imageUrls: [],
        isSample: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .get("/api/admin/products?missingSlug=true&limit=100")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(
        res.body.products.some((p: { partNumber: string }) => p.partNumber === "RAW-NO-SLUG"),
      ).toBe(true);
    });

    it("Product images: reorder, delete, reject invalid reorder", async () => {
      const token = await getAdminToken();

      const createRes = await request(app)
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          partNumber: "IMG-CRUD",
          manufacturer: "X",
          quantity: 1,
          seoSlug: "img-crud-admin-test",
        });
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

    it("PATCH /quotes/:id/items updates line quantities", async () => {
      const token = await getAdminToken();
      const created = await QuoteRequest.create({
        items: [
          { partNumber: "P1", manufacturer: "M1", quantity: 10, ourReference: "R1" },
          { partNumber: "P2", manufacturer: "M2", quantity: 5, ourReference: "" },
        ],
        customerName: "Customer",
        customerEmail: "c2@c.com",
        status: "new",
      });

      const patchRes = await request(app)
        .patch(`/api/admin/quotes/${created._id}/items`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [
            { partNumber: "P1", manufacturer: "M1", quantity: 250, ourReference: "R1" },
            { partNumber: "P2", manufacturer: "M2", quantity: 1, ourReference: "" },
          ],
        });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.items).toHaveLength(2);
      expect(patchRes.body.items[0].quantity).toBe(250);
      expect(patchRes.body.items[1].quantity).toBe(1);

      const fromDb = await QuoteRequest.findById(created._id).lean();
      expect(fromDb?.items[0].quantity).toBe(250);
      expect(fromDb?.items[1].quantity).toBe(1);
    });
  });
});
