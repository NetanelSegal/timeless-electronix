import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientSitemap = path.join(repoRoot, 'client', 'dist', 'sitemap.xml');

const missing = [clientSitemap].filter((p) => !fs.existsSync(p));
if (missing.length > 0) {
  console.error(
    'verify-sitemap: missing file(s). Run a full `npm run build` (server build needs MONGODB_URI):\n' +
      missing.map((p) => `  - ${p}`).join('\n'),
  );
  process.exit(1);
}

console.log('verify-sitemap: ok');
