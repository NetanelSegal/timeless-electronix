import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { buildSitemapXmlString } from '../utils/sitemap.js';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

/** Static SPA output (Cloudways Hybrid Stack / Apache document root). */
export const clientSitemapPath = path.join(
  repoRoot,
  'client',
  'dist',
  'sitemap.xml',
);

/** Prebuilt file read by Express in production. */
export const serverSitemapPath = path.join(
  repoRoot,
  'server',
  'dist',
  'sitemap.xml',
);

async function main() {
  console.log('buildSitemap: connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  const siteBase = env.PUBLIC_SITE_URL.trim() || env.CLIENT_URL;
  const xml = await buildSitemapXmlString(siteBase);
  for (const outPath of [clientSitemapPath, serverSitemapPath]) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, xml, 'utf8');
    console.log(`buildSitemap: wrote ${outPath}`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
