import { Router } from "express";
import { Product } from "../models/Product.js";
import {
  parsePageLimit,
  buildSearchFilter,
  buildMongoSortSpec,
} from "../utils/helpers.js";
import { serializeProduct } from "../utils/productImages.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const { page, limit } = parsePageLimit(query, { limit: 24, maxLimit: 100 });
    const manufacturer = query.manufacturer || "";

    const filter: Record<string, unknown> = {
      ...buildSearchFilter(query.search || "", ["partNumber", "manufacturer"]),
    };

    if (manufacturer) {
      filter.manufacturer = manufacturer;
    }

    const sortSpec = buildMongoSortSpec(query, {
      allowlist: ["quantity", "partNumber", "manufacturer", "updatedAt"],
      fallback: { field: "quantity", order: "desc" },
      fieldDefaultOrder: {
        quantity: "desc",
        partNumber: "asc",
        manufacturer: "asc",
        updatedAt: "desc",
      },
    });

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products: products.map((p) => serializeProduct(p as Record<string, unknown>)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
    res.json(serializeProduct(product as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
});

export default router;
