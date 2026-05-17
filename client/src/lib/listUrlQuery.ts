export type ListSortDir = "asc" | "desc";

export type EffectiveListSortConfig = {
  allowedFields: readonly string[];
  defaultField: string;
  fieldDefaultOrder: Record<string, ListSortDir>;
};

/**
 * Read `sort` / `order` from URL search params with allowlist + per-field default order.
 * Matches server list endpoints' query conventions.
 */
export function effectiveListSort(
  searchParams: URLSearchParams,
  config: EffectiveListSortConfig,
): {
  field: string;
  order: ListSortDir;
  presetValue: string;
} {
  const raw = searchParams.get("sort")?.trim();
  const field =
    raw && config.allowedFields.includes(raw) ? raw : config.defaultField;
  const o = searchParams.get("order")?.toLowerCase();
  const order: ListSortDir =
    o === "asc" || o === "desc"
      ? o
      : config.fieldDefaultOrder[field] ?? "desc";
  return {
    field,
    order,
    presetValue: `${field}:${order}`,
  };
}

/** Parse `page` from URL; invalid or missing uses `fallback` (default 1). */
export function parsePageFromSearchParams(
  searchParams: URLSearchParams,
  fallback = 1,
): number {
  const pageParam = parseInt(searchParams.get("page") ?? "", 10);
  return Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : fallback;
}
