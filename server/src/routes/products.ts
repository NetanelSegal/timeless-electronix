import { Router } from 'express';
import { Product } from '../models/Product.js';
import {
  parsePageLimit,
  buildMongoSortSpec,
} from '../utils/helpers.js';
import { productListFilterFromQuery } from '../utils/productListFilter.js';
import { serializeProduct } from '../utils/productImages.js';
import { getProductBySeoSlug } from '../handlers/productBySlug.js';
import {
  getManufacturerVariants,
  listManufacturerDisplayNames,
} from '../services/manufacturerIndex.js';

const router = Router();

router.get('/slug/:seoSlug', getProductBySeoSlug);

router.get('/', async (req, res, next) => {
  try {
    const query = req.query as Record<string, string>;
    const exactSlug =
      typeof query.seoSlug === 'string' ? query.seoSlug.trim() : '';
    if (exactSlug) {
      await getProductBySeoSlug(req, res, next);
      return;
    }
    const { page, limit } = parsePageLimit(query, { limit: 24, maxLimit: 100 });
    const manufacturerVariants = await getManufacturerVariants(
      query.manufacturer || '',
    );
    const filter = productListFilterFromQuery(query, 'public', {
      manufacturerVariants,
    });

    const sortSpec = buildMongoSortSpec(query, {
      allowlist: ['quantity', 'partNumber', 'manufacturer', 'updatedAt'],
      fallback: { field: 'quantity', order: 'desc' },
      fieldDefaultOrder: {
        quantity: 'desc',
        partNumber: 'asc',
        manufacturer: 'asc',
        updatedAt: 'desc',
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

router.get('/manufacturers', async (_req, res, next) => {
  try {
    // Deduplicated: the raw distinct list offers ABRACON and Abracon as two
    // separate choices, and picking one misses the other's rows.
    res.json(await listManufacturerDisplayNames());
  } catch (err) {
    next(err);
  }
});

export default router;
