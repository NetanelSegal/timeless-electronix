export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parsePageLimit(
  query: Record<string, string>,
  defaults: { limit?: number; maxLimit?: number } = {},
): { page: number; limit: number } {
  const { limit: defaultLimit = 24, maxLimit = 100 } = defaults;
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit ?? String(defaultLimit), 10) || defaultLimit));
  return { page, limit };
}

export function buildSearchFilter(
  search: string,
  fields: string[],
): Record<string, unknown> {
  if (!search) return {};
  const escaped = escapeRegex(search);
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: escaped, $options: "i" },
    })),
  };
}

export type SortDir = "asc" | "desc";

/** Merge non-empty filter objects with `$and` (Mongo). */
export function mergeAndFilters(
  ...parts: Record<string, unknown>[]
): Record<string, unknown> {
  const nonEmpty = parts.filter((p) => Object.keys(p).length > 0);
  if (nonEmpty.length === 0) return {};
  if (nonEmpty.length === 1) return nonEmpty[0]!;
  return { $and: nonEmpty };
}

/** Parse `true` / `false` query strings; anything else is undefined. */
export function parseQueryBoolean(
  val: string | undefined,
): boolean | undefined {
  if (val === "true") return true;
  if (val === "false") return false;
  return undefined;
}

/**
 * Whitelisted Mongo `.sort()` spec with stable `_id` tie-breaker.
 * Unknown `sort` field falls back to `fallback`. Missing/invalid `order` uses
 * `fieldDefaultOrder[field]` when set, otherwise `fallback.order`.
 */
export function buildMongoSortSpec(
  query: Record<string, string>,
  config: {
    allowlist: readonly string[];
    fallback: { field: string; order: SortDir };
    fieldDefaultOrder?: Partial<Record<string, SortDir>>;
  },
): Record<string, 1 | -1> {
  const allow = new Set(config.allowlist);
  const raw = query.sort?.trim();
  const field =
    raw && allow.has(raw) ? raw : config.fallback.field;
  const o = query.order?.trim().toLowerCase();
  let order: SortDir;
  if (o === "asc") order = "asc";
  else if (o === "desc") order = "desc";
  else
    order =
      config.fieldDefaultOrder?.[field] ?? config.fallback.order;
  const dir: 1 | -1 = order === "asc" ? 1 : -1;
  // Primary field first — MongoDB applies keys in order; `_id` must be last
  // as tie-breaker only, or unique _id would dominate and ignore the real sort.
  const spec: Record<string, 1 | -1> = { [field]: dir, _id: 1 };
  return spec;
}
