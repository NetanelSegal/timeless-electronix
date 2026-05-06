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

app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
