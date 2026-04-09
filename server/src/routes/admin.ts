import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "node:fs";
import { parse } from "csv-parse";
import { env } from "../config/env.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { Product } from "../models/Product.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { QuoteRequest } from "../models/QuoteRequest.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// --- Auth ---
router.post("/login", (req, res) => {
  const { secret } = req.body as { secret?: string };
  if (secret !== env.ADMIN_SECRET) {
    res.status(401).json({ error: "Invalid secret code" });
    return;
  }
  const token = jwt.sign({ role: "admin" }, env.JWT_SECRET, {
    expiresIn: "24h",
  });
  res.json({ token });
});

// All routes below require auth
router.use(adminAuth);

// --- Stats ---
router.get("/stats", async (_req, res, next) => {
  try {
    const [totalProducts, totalQuotes, newQuotes, unreadMessages] =
      await Promise.all([
        Product.countDocuments(),
        QuoteRequest.countDocuments(),
        QuoteRequest.countDocuments({ status: "new" }),
        ContactMessage.countDocuments({ isRead: false }),
      ]);
    res.json({ totalProducts, totalQuotes, newQuotes, unreadMessages });
  } catch (err) {
    next(err);
  }
});

// --- Products CRUD ---
router.get("/products", async (req, res, next) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "50",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { partNumber: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (product.imageUrl) {
      deleteFromCloudinary(product.imageUrl).catch(console.error);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- CSV Import ---
interface CsvRow {
  part_number: string;
  description: string;
  quantity: string;
  our_reference: string;
  mfg: string;
  dc: string;
  is_sample: string;
}

router.post("/products/import", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const rows: CsvRow[] = await new Promise((resolve, reject) => {
      const results: CsvRow[] = [];
      fs.createReadStream(req.file!.path)
        .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
        .on("data", (row: CsvRow) => results.push(row))
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    const docs = rows.map((row) => ({
      partNumber: row.part_number,
      description: row.description,
      quantity: parseInt(row.quantity, 10) || 0,
      ourReference: row.our_reference,
      manufacturer: row.mfg,
      dateCode: row.dc,
      isSample: row.is_sample === "true",
    }));

    const result = await Product.insertMany(docs);
    fs.unlinkSync(req.file!.path);
    res.json({ imported: result.length });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// --- Image Upload ---
router.post(
  "/products/:id/image",
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image uploaded" });
        return;
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({ error: "Product not found" });
        return;
      }

      if (product.imageUrl) {
        deleteFromCloudinary(product.imageUrl).catch(console.error);
      }

      const imageUrl = await uploadToCloudinary(req.file.path);
      product.imageUrl = imageUrl;
      await product.save();
      fs.unlinkSync(req.file.path);

      res.json({ imageUrl });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      next(err);
    }
  },
);

// --- Messages ---
router.get("/messages", async (req, res, next) => {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, parseInt(limit, 10) || 50);

    const [messages, total] = await Promise.all([
      ContactMessage.find()
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ContactMessage.countDocuments(),
    ]);

    res.json({ messages, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
});

router.patch("/messages/:id/read", async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true },
    );
    if (!msg) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.json(msg);
  } catch (err) {
    next(err);
  }
});

router.delete("/messages/:id", async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Quotes ---
router.get("/quotes", async (req, res, next) => {
  try {
    const { page = "1", limit = "50", status } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, parseInt(limit, 10) || 50);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [quotes, total] = await Promise.all([
      QuoteRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      QuoteRequest.countDocuments(filter),
    ]);

    res.json({ quotes, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
});

router.patch("/quotes/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body as { status: string };
    const validStatuses = ["new", "in-progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const quote = await QuoteRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!quote) {
      res.status(404).json({ error: "Quote not found" });
      return;
    }
    res.json(quote);
  } catch (err) {
    next(err);
  }
});

export default router;
