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
- **robots.txt (static site)**: Committed at [`client/public/robots.txt`](../../client/public/robots.txt). For same-origin setups, point **`Sitemap:`** to your main site origin + **`/sitemap.xml`**.
- **Sitemap (static, like robots.txt)**: **`npm run build:sitemap`** writes **`client/public/sitemap.xml`** (gitignored); Vite copies it to **`client/dist/sitemap.xml`**. Not served by Express.
- **Cloudways (document root = `client/dist`)**: Deploy the **full monorepo** via Git (not the `client/dist` folder — it is gitignored). Set Apache webroot to **`client/dist`**. Use [`client/public/.htaccess`](../../client/public/.htaccess) (copied into `dist` on build) to proxy **`/api`** to Node on port 3001 and SPA-fallback. Run **`npm run build`** on the server after each deploy so **`client/dist/sitemap.xml`** exists. See [`docs/06-Development/README.md`](../06-Development/README.md) for GitHub Actions + Cloudways setup.


### Request routing and HTTP status truthfulness

The web root is static; Node is only reached through the `/api` proxy. This is
deliberate — it keeps the site renderable when the API is down, which is what
turned a Mongo blip into 7,141 soft 404s in May 2026.

Apache rule order in [`client/public/.htaccess`](../../client/public/.htaccess):

| # | Rule | Purpose |
|---|------|---------|
| 1 | `^api/(.*)` → `127.0.0.1:3001` | Proxy the API (`[P]`) |
| 2 | `^(.+)/$` → https, 301 | One URL per page; explicit https because TLS terminates upstream |
| 3 | `^catalog/([^/]+)$` → `catalog/$1.html` if it exists | Serve a prerendered product shell (200) |
| 4 | `^catalog/([^/]+)$` → 404, if `.prerendered` exists and the shell does not | A part that does not exist gets a real 404 |
| 5–6 | anything else not a file → `index.html` | SPA fallback (200) |

**Why a prerender rather than server-side rendering.** A crawler asking for a
product that is not in the catalog must get a 404, but Apache cannot know which
of the 18.8K slugs are real without asking something. Routing the SPA fallback
through Express would answer that — at the cost of making every page depend on
Node + Mongo (the failure mode above), injecting unsanitised product fields
into HTML, and running a database query per crawl. Instead the build writes one
flat `catalog/<slug>.html` per existing product (hard links to the shell, so
~one inode's worth of data), turning the question into a file-existence test
that Apache answers on its own.

- The shells are byte-identical copies of `index.html`. No product data is
  injected, so there is no escaping to get wrong and nothing to leak; React
  fetches and renders the product client-side exactly as before.
- Slugs become filenames, so they are **validated** (`isValidSeoSlug`) rather
  than sanitised, with a resolved-dirname check behind it. Legacy and
  CSV-imported rows bypass the admin zod schema.
- Files are flat, not directories, so `mod_dir`'s `DirectorySlash` cannot
  re-add the trailing slash that rule 2 strips.
- `ErrorDocument 404 /index.html` makes the 404 body the SPA shell, so the
  styled "Product not found" page (which carries `noindex`) still renders —
  under a 404 status instead of 200.
- **Fail-safe**: rule 4 is gated on the `.prerendered` marker, written only
  after the full slug set is emitted. A deploy that cannot reach the database
  writes no marker, the rule goes dormant, and the SPA shell is served as
  before. A failed prerender can never 404 the whole catalog.

Build order matters: `build:sitemap` runs **before** `vite build` (it writes to
`client/public/`, which Vite copies into the web root), and `build:prerender`
runs **after** it (it writes into `client/dist`, which Vite empties).