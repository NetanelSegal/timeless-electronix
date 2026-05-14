import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { buildSitemapXmlString } from '../utils/sitemap.js';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(
  dirname,
  '..',
  '..',
  '..',
  'client',
  'dist',
  'sitemap.xml',
);

async function main() {
  console.log('buildSitemap: connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  const siteBase = env.PUBLIC_SITE_URL.trim() || env.CLIENT_URL;
  const xml = await buildSitemapXmlString(siteBase);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');
  await mongoose.disconnect();
  console.log(`buildSitemap: wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
