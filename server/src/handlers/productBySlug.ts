import type { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product.js';
import { serializeProduct } from '../utils/productImages.js';

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
    res.json(serializeProduct(product as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
}
