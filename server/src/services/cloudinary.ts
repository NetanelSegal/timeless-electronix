import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(filePath: string): Promise<string> {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured");
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "timeless-electronix",
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  });
  return result.secure_url;
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  if (!env.CLOUDINARY_CLOUD_NAME) return;
  const parts = imageUrl.split("/");
  const filename = parts[parts.length - 1];
  if (!filename) return;
  const publicId = `timeless-electronix/${filename.split(".")[0]}`;
  await cloudinary.uploader.destroy(publicId);
}
