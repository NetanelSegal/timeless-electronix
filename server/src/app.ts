import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isDbConnected } from './config/db.js';
import productRoutes from './routes/products.js';
import contactRoutes from './routes/contact.js';
import quoteRoutes from './routes/quotes.js';
import adminRoutes from './routes/admin.js';
import { getProductBySeoSlug } from './handlers/productBySlug.js';

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/products/slug/:seoSlug', getProductBySeoSlug);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  const db = isDbConnected();
  res.status(db ? 200 : 503).json({
    status: db ? 'ok' : 'degraded',
    db: db ? 'connected' : 'disconnected',
  });
});

app.use(errorHandler);

export default app;
