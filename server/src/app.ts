import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import productRoutes from './routes/products.js';
import contactRoutes from './routes/contact.js';
import quoteRoutes from './routes/quotes.js';
import adminRoutes from './routes/admin.js';
import { sendSitemapXml } from './utils/sitemap.js';

const app = express();

const sitemapPath = path.join(process.cwd(), 'dist', 'sitemap.xml');

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));

app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const useBuiltFile =
      process.env.NODE_ENV === 'production' && fs.existsSync(sitemapPath);
    if (useBuiltFile) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.sendFile(path.resolve(sitemapPath));
      return;
    }
    await sendSitemapXml(res, env.CLIENT_URL);
  } catch (err) {
    next(err);
  }
});

app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
