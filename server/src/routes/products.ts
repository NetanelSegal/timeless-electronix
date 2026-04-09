import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      manufacturer = "",
      page = "1",
      limit = "24",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { partNumber: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
      ];
    }

    if (manufacturer) {
      filter.manufacturer = manufacturer;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ quantity: -1 })
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

router.get("/manufacturers", async (_req, res, next) => {
  try {
    const manufacturers = await Product.distinct("manufacturer", {
      manufacturer: { $ne: "" },
    });
    manufacturers.sort((a, b) => a.localeCompare(b));
    res.json(manufacturers);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
