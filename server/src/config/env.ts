import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  ADMIN_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  NOTIFICATION_EMAIL: z.string().email().default("sales@timeless-electronix.com"),
  PORT: z.coerce.number().default(3001),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  /** Public SPA origin for sitemap loc URLs (no trailing slash), e.g. https://www.example.com */
  PUBLIC_SITE_URL: z
    .string()
    .min(1)
    .default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
