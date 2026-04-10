import type { Response } from "express";
import { Product } from "../models/Product.js";

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const STATIC_PATHS = ["/", "/catalog", "/about", "/contact", "/quote"] as const;

/**
 * Full sitemap document. `siteBaseUrl` is the public SPA origin for loc URLs (no trailing slash).
 */
export async function buildSitemapXmlString(
  siteBaseUrl: string,
): Promise<string> {
  const base = siteBaseUrl.replace(/\/$/, "");
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const p of STATIC_PATHS) {
    const loc = `${base}${p}`;
    lines.push(`  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`);
  }

  const cursor = Product.find({}, { _id: 1, updatedAt: 1 }).lean().cursor();
  for await (const doc of cursor) {
    const id = String(doc._id);
    const loc = `${base}/catalog/${id}`;
    const lastmod =
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString().slice(0, 10)
        : undefined;
    if (lastmod) {
      lines.push(
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </url>`,
      );
    } else {
      lines.push(`  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`);
    }
  }

  lines.push("</urlset>");
  return lines.join("\n");
}

/** Send sitemap XML (used when no prebuilt file, e.g. dev/test). */
export async function sendSitemapXml(
  res: Response,
  siteBaseUrl: string,
): Promise<void> {
  const body = await buildSitemapXmlString(siteBaseUrl);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(body);
}
