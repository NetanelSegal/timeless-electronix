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

/** API shape: always `imageUrls` (possibly empty); never `imageUrl`. */
export function serializeProduct(doc: Record<string, unknown>): Record<string, unknown> {
  const { imageUrl, imageUrls: _stored, ...rest } = doc;
  return {
    ...rest,
    imageUrls: effectiveImageUrls({
      imageUrls: _stored as string[] | undefined,
      imageUrl: imageUrl as string | undefined,
    }),
  };
}

export function isPermutationOf(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
