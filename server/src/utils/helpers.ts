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
