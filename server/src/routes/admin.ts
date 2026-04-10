import { Router } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { z } from 'zod';
import { env } from '../config/env.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { Product } from '../models/Product.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { QuoteRequest } from '../models/QuoteRequest.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../services/cloudinary.js';
import {
  parsePageLimit,
  buildSearchFilter,
  buildMongoSortSpec,
  mergeAndFilters,
  parseQueryBoolean,
} from '../utils/helpers.js';
import {
  effectiveImageUrls,
  isPermutationOf,
  serializeProduct,
} from '../utils/productImages.js';
import {
  productDocFromCsvRow,
  type ProductCsvRow,
} from '../utils/productCsvImport.js';

const productInputSchema = z.object({
  partNumber: z.string().min(1),
  manufacturer: z.string().default(''),
  description: z.string().default(''),
  quantity: z.number().int().min(0).default(0),
  ourReference: z.string().default(''),
  dateCode: z.string().default(''),
});

const router = Router();
const upload = multer({ dest: 'uploads/' });

// --- Auth ---
router.post('/login', (req, res) => {
  const { secret } = req.body as { secret?: string };
  if (secret !== env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Invalid secret code' });
    return;
  }
  const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({ token });
});

// All routes below require auth
router.use(adminAuth);

// --- Stats ---
router.get('/stats', async (_req, res, next) => {
  try {
    const [totalProducts, totalQuotes, newQuotes, unreadMessages] =
      await Promise.all([
        Product.countDocuments(),
        QuoteRequest.countDocuments(),
        QuoteRequest.countDocuments({ status: 'new' }),
        ContactMessage.countDocuments({ isRead: false }),
      ]);
    res.json({ totalProducts, totalQuotes, newQuotes, unreadMessages });
  } catch (err) {
    next(err);
  }
});

// --- Products CRUD ---
router.get('/products', async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const { page, limit } = parsePageLimit(query, { limit: 50, maxLimit: 200 });
    const filter = buildSearchFilter(query.search || '', [
      'partNumber',
      'manufacturer',
      'ourReference',
      'description',
    ]);

    const sortSpec = buildMongoSortSpec(query, {
      allowlist: [
        'updatedAt',
        'partNumber',
        'manufacturer',
        'quantity',
        'ourReference',
      ],
      fallback: { field: 'updatedAt', order: 'desc' },
      fieldDefaultOrder: {
        updatedAt: 'desc',
        partNumber: 'asc',
        manufacturer: 'asc',
        quantity: 'desc',
        ourReference: 'asc',
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
      products: products.map((p) =>
        serializeProduct(p as Record<string, unknown>),
      ),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const data = productInputSchema.parse(req.body);
    const product = await Product.create(data);
    res
      .status(201)
      .json(
        serializeProduct(
          product.toObject() as unknown as Record<string, unknown>,
        ),
      );
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const data = productInputSchema.partial().parse(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(
      serializeProduct(
        product.toObject() as unknown as Record<string, unknown>,
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const existing = await Product.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const urls = [
      ...new Set(effectiveImageUrls(existing as Record<string, unknown>)),
    ];
    await Product.findByIdAndDelete(req.params.id);
    for (const u of urls) {
      deleteFromCloudinary(u).catch(console.error);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- CSV Import (columns match Mongo Product: partNumber, _id, etc.) ---
const IMPORT_BATCH = 500;

router.post(
  '/products/import',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const rows: ProductCsvRow[] = await new Promise((resolve, reject) => {
        const results: ProductCsvRow[] = [];
        fs.createReadStream(req.file!.path)
          .pipe(
            parse({
              columns: true,
              skip_empty_lines: true,
              trim: true,
              relax_quotes: true,
            }),
          )
          .on('data', (row: ProductCsvRow) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });

      const docs = rows
        .map((row) => productDocFromCsvRow(row))
        .filter((doc) => String(doc.partNumber ?? '').trim().length > 0);

      if (docs.length === 0) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'No valid rows (missing partNumber)' });
        return;
      }

      let imported = 0;
      for (let i = 0; i < docs.length; i += IMPORT_BATCH) {
        const batch = docs.slice(i, i + IMPORT_BATCH);
        const result = await Product.insertMany(batch);
        imported += result.length;
      }

      fs.unlinkSync(req.file!.path);
      res.json({ imported, skipped: rows.length - docs.length });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      next(err);
    }
  },
);

// --- Product images (CRUD) ---
const deleteImageBodySchema = z.object({ url: z.string().min(1) });
const reorderImagesBodySchema = z.object({ imageUrls: z.array(z.string()) });

router.post(
  '/products/:id/images',
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image uploaded' });
        return;
      }

      const current = await Product.findById(req.params.id).lean();
      if (!current) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const nextUrls = [
        ...effectiveImageUrls(current as Record<string, unknown>),
      ];
      const uploadedUrl = await uploadToCloudinary(req.file.path);
      fs.unlinkSync(req.file.path);
      nextUrls.push(uploadedUrl);

      const updated = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: { imageUrls: nextUrls }, $unset: { imageUrl: '' } },
        { new: true },
      ).lean();

      if (!updated) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json(serializeProduct(updated as Record<string, unknown>));
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      next(err);
    }
  },
);

router.delete('/products/:id/images', async (req, res, next) => {
  try {
    const { url } = deleteImageBodySchema.parse(req.body);
    const current = await Product.findById(req.params.id).lean();
    if (!current) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const urls = effectiveImageUrls(current as Record<string, unknown>);
    if (!urls.includes(url)) {
      res.status(400).json({ error: 'Image URL not found on this product' });
      return;
    }
    const filtered = urls.filter((u) => u !== url);
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { imageUrls: filtered }, $unset: { imageUrl: '' } },
      { new: true },
    ).lean();
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    deleteFromCloudinary(url).catch(console.error);
    res.json(serializeProduct(updated as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id/images', async (req, res, next) => {
  try {
    const { imageUrls: bodyUrls } = reorderImagesBodySchema.parse(req.body);
    const current = await Product.findById(req.params.id).lean();
    if (!current) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const currentUrls = effectiveImageUrls(current as Record<string, unknown>);
    if (!isPermutationOf(currentUrls, bodyUrls)) {
      res
        .status(400)
        .json({ error: 'imageUrls must be a reordering of existing images' });
      return;
    }
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { imageUrls: bodyUrls }, $unset: { imageUrl: '' } },
      { new: true },
    ).lean();
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(serializeProduct(updated as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
});

// --- Messages ---
router.get('/messages', async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const { page, limit } = parsePageLimit(query, { limit: 50, maxLimit: 200 });

    const searchFilter = buildSearchFilter(query.search || '', [
      'fullName',
      'email',
      'company',
      'message',
    ]);
    const readFilter: Record<string, unknown> = {};
    const readVal = parseQueryBoolean(query.isRead);
    if (readVal !== undefined) readFilter.isRead = readVal;

    const filter = mergeAndFilters(searchFilter, readFilter);

    const sortSpec = buildMongoSortSpec(query, {
      allowlist: ['createdAt', 'fullName', 'isRead'],
      fallback: { field: 'createdAt', order: 'desc' },
      fieldDefaultOrder: {
        createdAt: 'desc',
        fullName: 'asc',
        isRead: 'asc',
      },
    });

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch('/messages/:id/read', async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true },
    );
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json(msg);
  } catch (err) {
    next(err);
  }
});

router.delete('/messages/:id', async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Quotes ---
router.get('/quotes', async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const { page, limit } = parsePageLimit(query, { limit: 50, maxLimit: 200 });

    const statusFilter: Record<string, unknown> = {};
    if (query.status) statusFilter.status = query.status;

    const searchFilter = buildSearchFilter(query.search || '', [
      'customerName',
      'customerEmail',
      'customerCompany',
      'message',
    ]);

    const filter = mergeAndFilters(statusFilter, searchFilter);

    const sortSpec = buildMongoSortSpec(query, {
      allowlist: ['createdAt', 'status', 'customerName', 'customerEmail'],
      fallback: { field: 'createdAt', order: 'desc' },
      fieldDefaultOrder: {
        createdAt: 'desc',
        status: 'asc',
        customerName: 'asc',
        customerEmail: 'asc',
      },
    });

    const [quotes, total] = await Promise.all([
      QuoteRequest.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      QuoteRequest.countDocuments(filter),
    ]);

    res.json({ quotes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.patch('/quotes/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body as { status: string };
    const validStatuses = ['new', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const quote = await QuoteRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }
    res.json(quote);
  } catch (err) {
    next(err);
  }
});

export default router;
