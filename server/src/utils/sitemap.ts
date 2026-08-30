import { Product } from "../models/Product.js";
import { compareCanonicalPriority } from "../services/productGroup.js";

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const STATIC_PATHS = ["/", "/catalog", "/about", "/contact", "/quote"] as const;

interface CanonicalEntry {
  _id: unknown;
  createdAt?: Date;
  seoSlug: string;
  /** Latest change anywhere in the group — the page shows every lot. */
  lastmod?: Date;
}

/**
 * Group key. A blank part number cannot be grouped with anything, so it falls
 * back to a key unique to the row — matching the product API, which treats a
 * blank part number as its own canonical.
 */
function groupKey(partNumber: string, seoSlug: string): string {
  const pn = partNumber.trim();
  return pn ? `pn:${pn}` : `slug:${seoSlug}`;
}

/**
 * One URL per part, not per stock lot. The lots stay reachable and return 200,
 * but only the canonical belongs in the sitemap: advertising all of them asks
 * Google to crawl 3,618 pages that each point their canonical elsewhere.
 *
 * The winner is chosen with the same comparator the product API uses, so the
 * sitemap can never advertise a URL that canonicalises somewhere else.
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

  const cursor = Product.find(
    { seoSlug: { $nin: [null, ""] } },
    { seoSlug: 1, partNumber: 1, createdAt: 1, updatedAt: 1 },
  )
    .lean()
    .cursor();

  const canonicalByPart = new Map<string, CanonicalEntry>();

  for await (const doc of cursor) {
    const slug = String(doc.seoSlug ?? "").trim();
    if (!slug) continue;
    const candidate: CanonicalEntry = {
      _id: doc._id,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : undefined,
      seoSlug: slug,
      lastmod: doc.updatedAt instanceof Date ? doc.updatedAt : undefined,
    };
    const key = groupKey(String(doc.partNumber ?? ""), slug);
    const held = canonicalByPart.get(key);
    if (!held) {
      canonicalByPart.set(key, candidate);
      continue;
    }
    // Keep the most recent change in the group, whichever row wins the URL.
    const lastmod =
      held.lastmod && candidate.lastmod
        ? held.lastmod > candidate.lastmod
          ? held.lastmod
          : candidate.lastmod
        : (held.lastmod ?? candidate.lastmod);
    const winner =
      compareCanonicalPriority(candidate, held) < 0 ? candidate : held;
    canonicalByPart.set(key, { ...winner, lastmod });
  }

  const entries = [...canonicalByPart.values()].sort((a, b) =>
    a.seoSlug < b.seoSlug ? -1 : a.seoSlug > b.seoSlug ? 1 : 0,
  );

  for (const entry of entries) {
    const loc = `${base}/catalog/${entry.seoSlug}`;
    const lastmod = entry.lastmod?.toISOString().slice(0, 10);
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
