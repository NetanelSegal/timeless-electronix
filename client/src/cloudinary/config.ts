import { Cloudinary } from "@cloudinary/url-gen";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export const isCloudinaryConfigured = Boolean(cloudName);

export const cld = new Cloudinary({
  cloud: { cloudName: cloudName || "placeholder" },
});

/**
 * Extracts the public ID from a full Cloudinary secure_url.
 * Returns null for non-Cloudinary URLs.
 *
 * Example: "https://res.cloudinary.com/demo/image/upload/v123/timeless-electronix/abc.jpg"
 *        → "timeless-electronix/abc"
 */
export function extractPublicId(url: string): string | null {
  const match = url.match(
    /res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/,
  );
  return match?.[1] ?? null;
}
