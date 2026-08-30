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


### Parts, stock lots, and manufacturer names

A part number is **one product**; each database row is **one stock lot** of it.
Lots of the same part differ by quantity and internal reference, in ~44% of
groups by date code, and essentially never by condition (measured over 1,000
products spread across the catalog; the only two mixed-condition groups were
rows with a corrupted part number). Slugs were assigned at import: the first
lot gets `<manufacturer>-<partNumber>`, every later lot appends its reference
(`avx-06035a1r2bat2a-nb808-42`). That is correct collision avoidance, but it
produces **3,618 redundant URLs across 2,284 parts** — near-identical pages
competing with each other, against 4,874 "crawled, currently not indexed" in
Search Console.

**The group is keyed on `partNumber` alone, not `(partNumber, manufacturer)`.**
The manufacturer field is dirty — 594 of the 2,000 distinct strings are casing
variants of another (292 groups: `ABRACON`/`Abracon`, `LITTELFUSE`/`Littelfuse`)
— so keying on it would split a part across two pages purely on spelling. The
cost is that ~2% of part numbers appear under genuinely different brands (an
OEM part sold as both HP and Lenovo); those merge into one page, with the
manufacturer shown per lot. Part number spelling, unlike manufacturer, is
consistent within a group (0 of 781 sampled groups vary), so the lookup matches
exactly and uses the `partNumber` index rather than scanning per page view.

**Manufacturer filtering matches every casing variant.** The dropdown used to
offer `ABRACON` and `Abracon` as separate choices and the filter matched
exactly, so picking one silently dropped the other's rows — 292 brands were
split this way. `/api/products/manufacturers` now returns deduplicated display
names (2,000 → 1,698), and the catalog and admin filters expand the chosen name
to every raw spelling and match with `$in`. `$in` keeps the `manufacturer`
index in play; a case-insensitive regex would have scanned the collection on
the catalog's main browse path. The variant map is cached for 5 minutes, so a
newly imported brand becomes selectable within the TTL. Old links using any
casing keep working, since the name is normalised before lookup.

`GET /api/products/slug/:seoSlug` therefore returns, alongside the product:

| Field | Meaning |
|---|---|
| `canonicalSeoSlug` | Slug of the lot whose URL represents the part |
| `isCanonical` | Whether this URL is that one |
| `lots[]` | Every lot: condition, manufacturer, quantity, date code, reference, `_id` |
| `manufacturers[]` | Display names across the group, casing variants collapsed |

The canonical lot is the **oldest by `createdAt`**, tie-broken by `_id`. It must
not drift as stock changes — a canonical that moves undoes the consolidation it
exists to create — which is why it is not chosen by quantity. In practice the
oldest row also holds the clean base slug, because slugs were assigned in
import order.

Lot URLs stay reachable and return 200; they carry `rel=canonical` to the
canonical URL rather than redirecting, so nothing that is already linked or
indexed breaks.

A part page with more than one lot shows them as a table and quotes each one
separately, so a customer can ask for 500 from the new lot and 200 from the used
one in a single request. Each becomes its own cart line, keyed by the lot's
`_id`, and quote lines therefore carry `condition` and `dateCode` through to the
notification email and the admin view — the internal reference alone does not
tell the office which stock was meant. Both fields default to `""`, so a cart
saved before this existed still submits. A single-lot part keeps the simpler
add-to-quote control.

### Request routing and HTTP status truthfulness

The web root is static; Node is only reached through the `/api` proxy. This is
deliberate — it keeps the site renderable when the API is down, which is what
turned a Mongo blip into 7,141 soft 404s in May 2026.

Apache rule order in [`client/public/.htaccess`](../../client/public/.htaccess):

| # | Rule | Purpose |
|---|------|---------|
| 1 | `^api/(.*)` → `127.0.0.1:3001` | Proxy the API (`[P]`) |
| 2 | `^(.+)/$` → https, 301 | One URL per page; explicit https because TLS terminates upstream |
| 3 | `^catalog/([a-z0-9-]+)$` → `_parts/$1.html` if it exists | Serve a prerendered product shell (200) |
| 4 | `^catalog/([a-z0-9-]+)$` → 404, if `.prerendered` exists and the shell does not | A part that does not exist gets a real 404 |
| 4b | direct `/_parts/…` → 404 | The shells are reachable only through rule 3, so there is no duplicate URL |
| 5–6 | anything else not a file → `index.html` | SPA fallback (200) |

**Why a prerender rather than server-side rendering.** A crawler asking for a
product that is not in the catalog must get a 404, but Apache cannot know which
of the 18.8K slugs are real without asking something. Routing the SPA fallback
through Express would answer that — at the cost of making every page depend on
Node + Mongo (the failure mode above), injecting unsanitised product fields
into HTML, and running a database query per crawl. Instead the build writes one
flat `_parts/<slug>.html` per existing product (hard links to the shell, so
~one inode's worth of data), turning the question into a file-existence test
that Apache answers on its own.

- The shells are byte-identical copies of `index.html`. No product data is
  injected, so there is no escaping to get wrong and nothing to leak; React
  fetches and renders the product client-side exactly as before.
- Slugs become filenames, so they are **validated** (`isValidSeoSlug`) rather
  than sanitised, with a resolved-dirname check behind it. Legacy and
  CSV-imported rows bypass the admin zod schema.
- **The shells live in `_parts/`, not `catalog/`.** A real `catalog` directory
  in the web root collides with the `/catalog` route: `mod_dir` redirects
  `/catalog` → `/catalog/`, rule 2 strips the slash back, and the catalog page
  redirects forever. Keeping them out of the route namespace also means the
  rewritten target cannot re-match rule 3 on the next pass and fall through to
  the 404 in rule 4. Both were shipped and caught in production on 2026-08-28;
  see `progress.md`.
- **The `.htaccess` slug pattern and `isPrerenderableSlug` must accept exactly
  the same set** (`^[a-z0-9-]{1,120}$`, asserted by a table test). Whatever the
  rule 404s on a miss must be what the prerender writes on a hit; a slug in the
  gap gets no shell but still matches the 404 rule, which is how 522 real
  products were answered with a hard 404 on 2026-08-28. Anything outside the
  set matches neither rule and falls through to the SPA shell under 200.
- That predicate is deliberately **not** `isValidSeoSlug`. It expresses
  filename safety (no separator, no dot, bounded length); `isValidSeoSlug` also
  bans leading/trailing/doubled hyphens, which is a URL-shape policy for slugs
  we generate and not a security property. 521 legacy rows violate it
  harmlessly.
- **Cloudways serves existing static files from nginx, without consulting
  `.htaccess`.** Confirmed in production: a direct `/_parts/<slug>.html` hit
  returns `Server: nginx` with a one-year `Cache-Control` and never reaches
  mod_rewrite, so rule 4b cannot 404 it. Only paths with no file on disk fall
  through to Apache — which is exactly how `/catalog/<slug>` reaches rule 3.
  `Disallow: /_parts/` in `robots.txt` is therefore the effective control on
  the shells; rule 4b stays as defence in depth. **Anything that must be
  enforced on an existing file cannot be enforced from `.htaccess` here.**
- `ErrorDocument 404 /index.html` makes the 404 body the SPA shell, so the
  styled "Product not found" page (which carries `noindex`) still renders —
  under a 404 status instead of 200.
- **Fail-safe**: rule 4 is gated on the `.prerendered` marker, written only
  after the full slug set is emitted. A deploy that cannot reach the database —
  or a `DOCUMENT_ROOT` the rule cannot resolve — writes no marker, the rule
  goes dormant, and the SPA shell is served as before. A failed prerender can
  never 404 the whole catalog.

Build order matters: `build:sitemap` runs **before** `vite build` (it writes to
`client/public/`, which Vite copies into the web root), and `build:prerender`
runs **after** it (it writes into `client/dist`, which Vite empties).