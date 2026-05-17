import { Product } from "../models/Product.js";
import { slugWithNumericSuffix } from "../utils/seoSlug.js";

export async function isSeoSlugTaken(
  seoSlug: string,
  excludeId?: string,
): Promise<boolean> {
  const filter: Record<string, unknown> = { seoSlug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await Product.findOne(filter).select("_id").lean();
  return !!doc;
}

export async function findFirstAvailableSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let current = baseSlug;
  let counter = 1;
  while (await isSeoSlugTaken(current, excludeId)) {
    current = slugWithNumericSuffix(baseSlug, counter);
    counter++;
  }
  return current;
}
