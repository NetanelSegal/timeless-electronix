type RawProduct = {
  imageUrls?: string[] | null | undefined;
  imageUrl?: string | null | undefined;
};

/** Effective list: stored `imageUrls`, or legacy single `imageUrl` when array is empty. */
export function effectiveImageUrls(raw: RawProduct): string[] {
  const arr = Array.isArray(raw.imageUrls)
    ? raw.imageUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  if (arr.length > 0) return arr;
  const legacy = raw.imageUrl?.trim();
  if (legacy) return [legacy];
  return [];
}

function normalizeDateCode(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "string") return raw;
  return String(raw);
}

function normalizeTechnicalSpecs(raw: unknown): Record<string, unknown> | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/** API shape: always `imageUrls` (possibly empty); never `imageUrl`. */
export function serializeProduct(doc: Record<string, unknown>): Record<string, unknown> {
  const { imageUrl, imageUrls: _stored, dateCode: dcRaw, technicalSpecs: tsRaw, ...rest } = doc;
  const out: Record<string, unknown> = {
    ...rest,
    dateCode: normalizeDateCode(dcRaw),
    imageUrls: effectiveImageUrls({
      imageUrls: _stored as string[] | undefined,
      imageUrl: imageUrl as string | undefined,
    }),
  };
  const specs = normalizeTechnicalSpecs(tsRaw);
  if (specs !== undefined && Object.keys(specs).length > 0) {
    out.technicalSpecs = specs;
  } else if (tsRaw !== undefined && tsRaw !== null) {
    out.technicalSpecs = {};
  }
  return out;
}

/**
 * Public API shape: `serializeProduct` minus `ourReference`.
 *
 * The reference is an internal stock locator, and ~5% of rows hold free-text
 * warehouse notes in Hebrew rather than a clean NNN/NN code — physical shelf
 * locations and remarks that were never meant for customers. It stays on the
 * admin routes, and the quote flow resolves it server-side from the product id
 * so the office still knows which lot was ordered.
 */
export function serializePublicProduct(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const { ourReference: _internal, ...rest } = serializeProduct(doc);
  return rest;
}

export function isPermutationOf(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
