# 04 — Architecture

## System overview

A two-tier web application: a React SPA (client) that talks to an Express API (server) backed by MongoDB.

```
┌─────────────┐     /api/*     ┌──────────────┐      ┌──────────┐
│  React SPA  │ ──────────────▶│  Express API │─────▶│ MongoDB  │
│  (Vite)     │◀──────────────│  (Node/TS)   │      └──────────┘
└─────────────┘    JSON        └──────┬───────┘
                                      │
                               ┌──────┴───────┐
                               │  Cloudinary  │  (image CDN)
                               │  Resend      │  (email API)
                               └──────────────┘
```

## Repository layout

```
timeless-electronix/
  client/                   React SPA (Vite + TS + Tailwind)
    src/
      components/           Header, Footer, ProductCard
      context/              QuoteContext (localStorage cart)
      lib/                  api.ts, adminApi.ts, types.ts, constants.ts
      pages/                Home, Catalog, About, Contact, Quote
      pages/admin/          AdminLogin, AdminLayout, AdminDashboard,
                            AdminProducts, AdminMessages, AdminQuotes
  server/
    src/
      config/               env.ts (Zod-validated), db.ts (Mongoose connect)
      middleware/            adminAuth.ts, errorHandler.ts
      models/               Product, ContactMessage, QuoteRequest
      routes/               products, contact, quotes, admin
      services/             email (Resend), cloudinary
      scripts/              seed.ts (CSV import)
      __tests__/            Vitest + Supertest API tests
      app.ts                Express app (importable for tests)
      index.ts              Entry point (connects DB, starts server)
  docs/                     Documentation (this structure)
  .cursor/rules/            AI coding rules
  Product_export.csv        Source data (~18,800 products)
  .env.example              All environment variables
```

## Data model

### Product
- `partNumber` (string, indexed) — e.g. "RC0402JR-074K7L"
- `description` (string) — e.g. "Our own stock, RoHS Compliant, PB-Free"
- `quantity` (number) — stock count
- `ourReference` (string) — internal reference code
- `manufacturer` (string, indexed) — e.g. "YAGEO"
- `dateCode` (string) — manufacturing date code
- `imageUrl` (string, optional) — Cloudinary URL
- `isSample` (boolean)
- `createdAt`, `updatedAt` (auto)

Text index on `partNumber` + `manufacturer` for search.

### ContactMessage
- `fullName`, `company`, `email`, `phone`, `message`
- `isRead` (boolean, default false)
- `createdAt`

### QuoteRequest
- `items[]` — `{ partNumber, manufacturer, quantity, ourReference }`
- `customerName`, `customerEmail`, `customerPhone`, `customerCompany`
- `message` (optional)
- `status` — `new` | `in-progress` | `completed` | `cancelled`
- `createdAt`

## API architecture

Base path: `/api`

### Public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List products (search, manufacturer, page, limit) |
| GET | `/products/manufacturers` | Distinct manufacturer list |
| GET | `/products/:id` | Single product |
| POST | `/contact` | Submit contact form (Zod validated) |
| POST | `/quotes` | Submit quote request (Zod validated) |
| GET | `/health` | Health check |

### Admin endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/login` | Validate secret code, return JWT |
| GET | `/admin/stats` | Dashboard counts |
| GET | `/admin/products` | Paginated product list |
| POST | `/admin/products` | Create product |
| PUT | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product |
| POST | `/admin/products/import` | CSV bulk import (multipart) |
| POST | `/admin/products/:id/image` | Upload image to Cloudinary (multipart) |
| GET | `/admin/messages` | List contact messages |
| PATCH | `/admin/messages/:id/read` | Mark message as read |
| DELETE | `/admin/messages/:id` | Delete message |
| GET | `/admin/quotes` | List quotes (filterable by status) |
| PATCH | `/admin/quotes/:id/status` | Update quote status |

## Security & auth

- **Admin authentication**: Single secret code (`ADMIN_SECRET` env var). Login endpoint validates the code and returns a JWT (signed with `JWT_SECRET`, 24h expiry). All admin routes check the JWT via `adminAuth` middleware.
- **No public user auth** — the site is a public catalog with quote request functionality.
- **CORS** configured to only allow the client origin.

## Integrations

- **Cloudinary**: Image upload via server-side SDK. Images stored in `timeless-electronix/` folder with auto-optimization. Graceful no-op when not configured.
- **Resend**: Email notifications for contact form submissions and quote requests. Fire-and-forget (doesn't block API response). Graceful no-op when not configured.

## Deployment

The app is designed to be deployable anywhere:
- **Client**: Static build (`npm run build` in client/) deployable to any static host (Vercel, Netlify, S3).
- **Server**: Node.js process deployable to any host (Railway, Render, VPS, container).
- **Database**: Any MongoDB instance (Atlas, self-hosted, container).
- The Vite dev proxy (`/api` → localhost:3001) handles dev; in production, configure a reverse proxy or same-origin setup.

### SEO (split static + API hosting)

- **SPA fallback**: Client-side routes (e.g. `/catalog/:id`) must return `index.html` with HTTP 200. The repo includes [`client/public/_redirects`](../../client/public/_redirects) (Netlify, Cloudflare Pages–style) and [`client/vercel.json`](../../client/vercel.json) (Vercel rewrites). Use the file that matches your static host.
- **Canonical URLs & social tags**: Set `VITE_PUBLIC_SITE_URL` (no trailing slash) in the client environment at Vite build time.
- **robots.txt (static site)**: Committed at [`client/public/robots.txt`](../../client/public/robots.txt). Edit the **`Sitemap:`** line to your deployed API origin + **`/sitemap.xml`** (Express root, not `/api`).
- **Sitemap (API, build-time)**: **`npm run build`** on the server runs **`buildSitemap.ts`** after `tsc`, writing **`dist/sitemap.xml`** from MongoDB using **`PUBLIC_SITE_URL`** for all `<loc>` values. In **`NODE_ENV=production`**, **`GET /sitemap.xml`** serves that file when present; otherwise it generates from the DB (dev/tests). Production deploys should set **`NODE_ENV=production`** and run a full server build with **`MONGODB_URI`** available.
