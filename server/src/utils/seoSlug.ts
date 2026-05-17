/** Lowercase letters, digits, hyphens between segments (no leading/trailing hyphen). */
export const SEO_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_SEO_SLUG_LENGTH = 120;

export function buildBaseSeoSlug(
  manufacturer: string,
  partNumber: string,
): string {
  const mfg = manufacturer.trim();
  const pn = partNumber.trim();
  if (!pn) return "";

  const raw = mfg ? `${mfg}-${pn}` : pn;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) return "";
  return slug.length > MAX_SEO_SLUG_LENGTH
    ? slug.slice(0, MAX_SEO_SLUG_LENGTH).replace(/-+$/, "")
    : slug;
}

export function isValidSeoSlug(slug: string): boolean {
  const s = slug.trim();
  if (!s || s.length > MAX_SEO_SLUG_LENGTH) return false;
  return SEO_SLUG_REGEX.test(s);
}

export function slugWithNumericSuffix(baseSlug: string, counter: number): string {
  const candidate = `${baseSlug}-${counter}`;
  if (candidate.length <= MAX_SEO_SLUG_LENGTH) return candidate;
  const trimmedBase = baseSlug.slice(
    0,
    Math.max(1, MAX_SEO_SLUG_LENGTH - String(counter).length - 1),
  );
  return `${trimmedBase.replace(/-+$/, "")}-${counter}`;
}
