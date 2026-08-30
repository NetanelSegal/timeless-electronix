/**
 * A JavaScript object stringified into a string field during an import. The
 * real part number is not recoverable from the database, so such a page is
 * kept out of search until the row is repaired from the source stock list —
 * it would otherwise be indexed with "[object Object]" as its title.
 * Mirrors server/src/utils/productData.ts.
 */
export const CORRUPTED_STRING_SENTINEL = "[object Object]";

export function isCorruptedValue(value: unknown): boolean {
  return typeof value === "string" && value.trim() === CORRUPTED_STRING_SENTINEL;
}
