import { adminApi } from "../adminApi";
import { buildBaseSeoSlug, isValidSeoSlug } from "../seoSlug";

export { buildBaseSeoSlug, isValidSeoSlug };

export type SlugAvailabilityResponse =
  | { available: true }
  | { available: false; suggestion: string };

export async function fetchSlugAvailability(
  seoSlug: string,
  excludeId?: string,
): Promise<SlugAvailabilityResponse> {
  const params = new URLSearchParams({ seoSlug });
  if (excludeId) params.set("excludeId", excludeId);
  return adminApi.get<SlugAvailabilityResponse>(
    `/products/slug-availability?${params}`,
  );
}
