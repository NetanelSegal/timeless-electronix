import type { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product.js';
import { serializeProduct } from '../utils/productImages.js';
import { getProductGroup } from '../services/productGroup.js';

export function resolveSeoSlugParam(req: Request): string {
  const raw =
    req.params.seoSlug ??
    (typeof req.query.seoSlug === 'string' ? req.query.seoSlug : '');
  return decodeURIComponent(String(raw)).trim();
}

export async function getProductBySeoSlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const seoSlug = resolveSeoSlugParam(req);
    if (!seoSlug) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const product = await Product.findOne({ seoSlug }).lean();
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    // A part is one product with several stock lots. The response carries the
    // whole group so the page can present it as one offering and point its
    // canonical at a single URL, instead of 3.6k near-identical pages
    // competing with each other in search.
    const group = await getProductGroup(String(product.partNumber ?? ''));
    const canonicalSeoSlug = group.canonicalSeoSlug || String(product.seoSlug ?? '');
    res.json({
      ...serializeProduct(product as Record<string, unknown>),
      canonicalSeoSlug,
      isCanonical: canonicalSeoSlug === String(product.seoSlug ?? ''),
      lots: group.lots,
      manufacturers: group.manufacturers,
    });
  } catch (err) {
    next(err);
  }
}
