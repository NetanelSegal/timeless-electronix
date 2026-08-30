/**
 * A JavaScript object stringified into a string field during an import. 45
 * rows carry it as their part number; the real value is not recoverable from
 * the database (their technicalSpecs are empty), so it has to be repaired from
 * the source stock list. Until then these rows are kept out of search: the
 * page has no part number to rank for and renders "[object Object]" as its
 * title.
 */
export const CORRUPTED_STRING_SENTINEL = "[object Object]";

export function isCorruptedValue(value: unknown): boolean {
  return typeof value === "string" && value.trim() === CORRUPTED_STRING_SENTINEL;
}
