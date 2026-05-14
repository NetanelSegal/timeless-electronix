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

const SEO_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const technicalSpecsField = z
  .unknown()
  .optional()
  .transform((v): Record<string, unknown> | undefined => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return undefined;
      try {
        const p = JSON.parse(t) as unknown;
        if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
          return p as Record<string, unknown>;
        }
      } catch {
        return undefined;
      }
      return undefined;
    }
    if (typeof v === 'object' && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return undefined;
  });

const productInputSchema = z.object({
  partNumber: z.string().min(1),
  manufacturer: z.string().default(''),
  description: z.string().default(''),
  quantity: z.number().int().min(0).default(0),
  ourReference: z.string().default(''),
  dateCode: z.string().default(''),
  seoSlug: z
    .string()
    .min(1)
    .regex(SEO_SLUG_REGEX, 'seoSlug must be lowercase letters, digits, and hyphens'),
  productSummary: z.string().default(''),
  technicalSpecs: technicalSpecsField,
});

const adminQuoteLineItemSchema = z.object({
  partNumber: z.string().min(1),
  manufacturer: z.string().default(''),
  quantity: z.number().int().min(1),
  ourReference: z.string().default(''),
});

const adminQuoteItemsPatchSchema = z.object({
  items: z.array(adminQuoteLineItemSchema).min(1, 'At least one item is required'),
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

const ADMIN_PRODUCT_SEARCH_FIELDS_ALL = [
  'partNumber',
  'manufacturer',
  'ourReference',
  'description',
  'seoSlug',
  'productSummary',
] as const;

const ADMIN_PRODUCT_SEARCH_FIELD_ALLOWLIST = new Set<string>([
  ...ADMIN_PRODUCT_SEARCH_FIELDS_ALL,
]);

function adminProductListFilterFromQuery(
  query: Record<string, string>,
): Record<string, unknown> {
  const search = (query.search || '').trim();
  const searchFieldRaw = (query.searchField || '').trim();
  const searchFields =
    searchFieldRaw && ADMIN_PRODUCT_SEARCH_FIELD_ALLOWLIST.has(searchFieldRaw)
      ? [searchFieldRaw]
      : [...ADMIN_PRODUCT_SEARCH_FIELDS_ALL];

  const textFilter = search
    ? buildSearchFilter(search, [...searchFields])
    : {};

  const manufacturer = (query.manufacturer || '').trim();
  const mfgFilter = manufacturer ? { manufacturer } : {};

  const minQtyRaw = parseInt(query.minQty ?? '', 10);
  const maxQtyRaw = parseInt(query.maxQty ?? '', 10);
  const qtyParts: Record<string, unknown>[] = [];
  if (!Number.isNaN(minQtyRaw) && minQtyRaw >= 0) {
    qtyParts.push({ quantity: { $gte: minQtyRaw } });
  }
  if (!Number.isNaN(maxQtyRaw) && maxQtyRaw >= 0) {
    qtyParts.push({ quantity: { $lte: maxQtyRaw } });
  }
  const qtyFilter =
    qtyParts.length === 0 ? {} : qtyParts.length === 1 ? qtyParts[0]! : { $and: qtyParts };

  const sampleVal = parseQueryBoolean(query.isSample);
  const sampleFilter =
    sampleVal === undefined ? {} : { isSample: sampleVal };

  const hasImages = parseQueryBoolean(query.hasImages);
  const imagesFilter =
    hasImages === true
      ? {
          $or: [
            { 'imageUrls.0': { $exists: true } },
            {
              imageUrl: { $exists: true, $nin: [null, ''] },
            },
          ],
        }
      : {};

  const missingSlug = parseQueryBoolean(query.missingSlug);
  const slugFilter =
    missingSlug === true
      ? {
          $or: [
            { seoSlug: { $exists: false } },
            { seoSlug: '' },
            { seoSlug: null },
          ],
        }
      : {};

  return mergeAndFilters(
    textFilter,
    mfgFilter,
    qtyFilter as Record<string, unknown>,
    sampleFilter,
    imagesFilter,
    slugFilter,
  );
}

// --- Products CRUD ---
router.get('/products', async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const { page, limit } = parsePageLimit(query, { limit: 50, maxLimit: 200 });
    const filter = adminProductListFilterFromQuery(query);

    const sortSpec = buildMongoSortSpec(query, {
      allowlist: [
        'updatedAt',
        'partNumber',
        'manufacturer',
        'quantity',
        'ourReference',
        'seoSlug',
      ],
      fallback: { field: 'updatedAt', order: 'desc' },
      fieldDefaultOrder: {
        updatedAt: 'desc',
        partNumber: 'asc',
        manufacturer: 'asc',
        quantity: 'desc',
        ourReference: 'asc',
        seoSlug: 'asc',
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
    const slugTaken = await Product.findOne({ seoSlug: data.seoSlug }).lean();
    if (slugTaken) {
      res.status(400).json({ error: 'This SEO slug is already in use' });
      return;
    }
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
    if (data.seoSlug !== undefined) {
      const slugTaken = await Product.findOne({
        seoSlug: data.seoSlug,
        _id: { $ne: req.params.id },
      }).lean();
      if (slugTaken) {
        res.status(400).json({ error: 'This SEO slug is already in use' });
        return;
      }
    }
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

// --- CSV Import (columns: partNumber, seoSlug, description, quantity, ourReference,
// manufacturer, dateCode, productSummary, technicalSpecs JSON, imageUrls, _id, etc.) ---
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
        .filter(
          (doc) =>
            String(doc.partNumber ?? '').trim().length > 0 &&
            String(doc.seoSlug ?? '').trim().length > 0,
        );

      if (docs.length === 0) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({
          error:
            'No valid rows (each row needs partNumber and seoSlug for import)',
        });
        return;
      }

      let imported = 0;
      for (const doc of docs) {
        await Product.findOneAndUpdate(
          { 
            partNumber: doc.partNumber as string, 
            manufacturer: doc.manufacturer as string 
          },
          { 
            $set: {
              description: doc.description,
              dateCode: doc.dateCode,
              seoSlug: doc.seoSlug,
              productSummary: doc.productSummary,
              technicalSpecs: doc.technicalSpecs,
              imageUrls: doc.imageUrls,
              isSample: doc.isSample,
              updatedAt: new Date(),
            },
            $inc: { quantity: (doc.quantity as number) || 0 },
            $addToSet: { ourReference: doc.ourReference as string }
          },
          { upsert: true, new: true }
        );
        imported++;
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

router.patch('/quotes/:id/items', async (req, res, next) => {
  try {
    const data = adminQuoteItemsPatchSchema.parse(req.body);
    const quote = await QuoteRequest.findByIdAndUpdate(
      req.params.id,
      { items: data.items },
      { new: true },
    ).lean();
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }
    res.json(quote);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Invalid body' });
      return;
    }
    next(err);
  }
});

export default router;
