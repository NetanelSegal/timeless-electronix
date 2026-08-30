import type { Product } from "./types";

/**
 * The URL that represents this part. Every lot points here so they consolidate
 * into one page in search instead of competing as near-identical duplicates.
 * Falls back to the product's own slug when the server sends no group (older
 * response, or a lone lot).
 */
export function canonicalSlugFor(product: Product): string {
  const canonical = product.canonicalSeoSlug?.trim();
  return canonical || product.seoSlug;
}

/**
 * How to name the maker on the page. Usually one brand; ~2% of part numbers
 * are OEM cross-brands stocked under two (an HP part also sold as Lenovo), and
 * merging them onto one page is deliberate — the manufacturer is shown per lot.
 */
export function manufacturerLabel(product: Product): string {
  const names = (product.manufacturers ?? []).filter((n) => n.trim());
  if (names.length > 0) return names.join(" · ");
  return product.manufacturer;
}

/** Whether the lots disagree on the maker, so the lot table must show it. */
export function hasMultipleManufacturers(product: Product): boolean {
  return (product.manufacturers ?? []).filter((n) => n.trim()).length > 1;
}
