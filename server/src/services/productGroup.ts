import { Product } from "../models/Product.js";
import { distinctManufacturerNames } from "../utils/manufacturerName.js";
import { PRODUCT_CONDITIONS } from "../utils/productListFilter.js";

/**
 * One stock lot of a part: same component, different intake. Lots differ by
 * quantity and internal reference, and in ~44% of groups by date code; they
 * almost never differ by condition. See docs/04-Architecture.
 */
export interface ProductLot {
  _id: string;
  seoSlug: string;
  manufacturer: string;
  condition: string;
  quantity: number;
  dateCode: string;
  ourReference: string;
}

export interface ProductGroup {
  lots: ProductLot[];
  canonicalSeoSlug: string;
  /** Display names across the group's lots; more than one for OEM cross-brands. */
  manufacturers: string[];
}

/** New stock first, then most available — a sensible order to show a buyer. */
const CONDITION_RANK = new Map<string, number>(
  PRODUCT_CONDITIONS.map((c, i) => [c, i]),
);

function conditionRank(condition: string): number {
  return CONDITION_RANK.get(condition) ?? PRODUCT_CONDITIONS.length;
}

/**
 * The lot whose URL represents the part. Oldest first, tie-broken by _id, so
 * the choice is deterministic and does not drift as stock changes — a
 * canonical that moves would undo the consolidation it exists to create. In
 * practice the oldest row is also the one holding the clean base slug, because
 * slugs were assigned in import order.
 */
export interface CanonicalCandidate {
  _id: unknown;
  createdAt?: Date;
  seoSlug?: string;
}

/**
 * Negative when `a` should be the canonical. Exported so the sitemap picks the
 * same row the product API does — if they disagree, the sitemap advertises a
 * URL that points its canonical somewhere else.
 */
export function compareCanonicalPriority(
  a: CanonicalCandidate,
  b: CanonicalCandidate,
): number {
  const at = a.createdAt?.getTime() ?? 0;
  const bt = b.createdAt?.getTime() ?? 0;
  if (at !== bt) return at - bt;
  return String(a._id) < String(b._id) ? -1 : 1;
}

export function selectCanonicalDoc<T extends CanonicalCandidate>(
  docs: readonly T[],
): T | undefined {
  return [...docs].sort(compareCanonicalPriority)[0];
}

export function sortLotsForDisplay(lots: ProductLot[]): ProductLot[] {
  return [...lots].sort((a, b) => {
    const rank = conditionRank(a.condition) - conditionRank(b.condition);
    if (rank !== 0) return rank;
    if (a.quantity !== b.quantity) return b.quantity - a.quantity;
    return a.seoSlug < b.seoSlug ? -1 : 1;
  });
}

/**
 * Every lot of `partNumber`. Matched exactly rather than case-insensitively:
 * the part number spelling is consistent within a group (measured: 0 of 781
 * sampled groups vary), and an exact match uses the partNumber index instead
 * of scanning the collection on every product page view.
 */
export async function getProductGroup(
  partNumber: string,
): Promise<ProductGroup> {
  const pn = partNumber.trim();
  if (!pn) return { lots: [], canonicalSeoSlug: "", manufacturers: [] };

  const docs = await Product.find(
    { partNumber: pn, seoSlug: { $nin: [null, ""] } },
    {
      seoSlug: 1,
      manufacturer: 1,
      condition: 1,
      quantity: 1,
      dateCode: 1,
      ourReference: 1,
      createdAt: 1,
    },
  ).lean();

  const canonical = selectCanonicalDoc(
    docs as { _id: unknown; createdAt?: Date; seoSlug?: string }[],
  );

  const lots: ProductLot[] = docs.map((d) => ({
    _id: String(d._id),
    seoSlug: String(d.seoSlug ?? ""),
    manufacturer: String(d.manufacturer ?? ""),
    condition: String(d.condition ?? ""),
    quantity: Number(d.quantity ?? 0),
    dateCode: String(d.dateCode ?? ""),
    ourReference: String(d.ourReference ?? ""),
  }));

  return {
    lots: sortLotsForDisplay(lots),
    canonicalSeoSlug: String(canonical?.seoSlug ?? ""),
    manufacturers: distinctManufacturerNames(lots.map((l) => l.manufacturer)),
  };
}
