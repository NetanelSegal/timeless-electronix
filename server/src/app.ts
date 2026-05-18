import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import productRoutes from './routes/products.js';
import contactRoutes from './routes/contact.js';
import quoteRoutes from './routes/quotes.js';
import adminRoutes from './routes/admin.js';

const app = express();

/** Written by `buildSitemap.ts` next to the compiled app (`server/dist/sitemap.xml`). */
const sitemapPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'sitemap.xml',
);

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);

app.get('/sitemap.xml', (req, res, next) => {
  try {
    if (!fs.existsSync(sitemapPath)) {
      res.status(404).type('text/plain').send('Sitemap not found.');
      return;
    }
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(fs.readFileSync(sitemapPath, 'utf8'));
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
