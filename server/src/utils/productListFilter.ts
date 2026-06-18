import {
  buildSearchFilter,
  mergeAndFilters,
  parseQueryBoolean,
} from './helpers.js';

export const PRODUCT_CONDITIONS = [
  'New/Standard',
  'Used',
  'Refurbished',
  'Broken',
] as const;

export const PUBLIC_PRODUCT_SEARCH_FIELDS = [
  'partNumber',
  'manufacturer',
  'description',
  'seoSlug',
  'productSummary',
] as const;

export const ADMIN_PRODUCT_SEARCH_FIELDS = [
  ...PUBLIC_PRODUCT_SEARCH_FIELDS,
  'ourReference',
] as const;

export type ProductListFilterMode = 'public' | 'admin';

function searchFieldsForQuery(
  query: Record<string, string>,
  allFields: readonly string[],
): string[] {
  const searchFieldRaw = (query.searchField || '').trim();
  const allow = new Set(allFields);
  if (searchFieldRaw && allow.has(searchFieldRaw)) {
    return [searchFieldRaw];
  }
  return [...allFields];
}

/** Shared Mongo filter for public catalog and admin product lists. */
export function productListFilterFromQuery(
  query: Record<string, string>,
  mode: ProductListFilterMode,
): Record<string, unknown> {
  const allSearchFields =
    mode === 'admin'
      ? ADMIN_PRODUCT_SEARCH_FIELDS
      : PUBLIC_PRODUCT_SEARCH_FIELDS;

  const search = (query.search || '').trim();
  const textFilter = search
    ? buildSearchFilter(search, searchFieldsForQuery(query, allSearchFields))
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
    qtyParts.length === 0
      ? {}
      : qtyParts.length === 1
        ? qtyParts[0]!
        : { $and: qtyParts };

  const hasImages = parseQueryBoolean(query.hasImages);
  const imagesFilter =
    hasImages === true
      ? {
          $or: [
            { 'imageUrls.0': { $exists: true } },
            { imageUrl: { $exists: true, $nin: [null, ''] } },
          ],
        }
      : {};

  const conditionRaw = (query.condition || '').trim();
  const conditionFilter =
    mode === 'public' &&
    conditionRaw &&
    (PRODUCT_CONDITIONS as readonly string[]).includes(conditionRaw)
      ? { condition: conditionRaw }
      : {};

  if (mode === 'admin') {
    const sampleVal = parseQueryBoolean(query.isSample);
    const sampleFilter =
      sampleVal === undefined ? {} : { isSample: sampleVal };

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

  return mergeAndFilters(
    textFilter,
    mfgFilter,
    qtyFilter as Record<string, unknown>,
    imagesFilter,
    conditionFilter,
  );
}
