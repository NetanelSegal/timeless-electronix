# Progress Log

## 2026-08-28

### Soft-404 outbreak: root cause, indexing fixes, and crawlable pagination

Search Console reported **7,141 Soft 404** (first seen 23.5.2026) and **4,874
"crawled, currently not indexed"** against 16.9K indexed pages. The API was
returning 503 for every `/api/*` request.

**Root cause.** `connectDB()` called `process.exit(1)` on a failed Mongo
connection and `app.listen()` only ran after it, so a transient Mongo blip
stopped the process from ever binding port 3001. pm2 exhausted `max_restarts`
and gave up, leaving Apache to serve 503 indefinitely. Every product page and
`/catalog` then rendered a "not found" empty state under HTTP 200 — exactly
what Google logs as a soft 404.

Commits: `8209db1`, `44e8618`, `4b47cf1` (merge), `41cfb58`, `aa2fcea`.

- **Server**: listen before connecting; retry Mongo with capped exponential
  backoff instead of exiting, so a DB outage degrades to 5xx rather than taking
  the port down. `/api/health` now reports DB state and returns 503 when
  disconnected. pm2 got an exponential backoff restart delay.
- **Client**: `apiClient` throws `ApiError` carrying the HTTP status;
  `ProductDetail` distinguishes a real 404 from a 5xx/network failure and
  renders a distinct "temporarily unavailable" state; `Catalog` no longer falls
  through to the "no matches" empty state on a failed request; all no-content
  states carry `noindex`.
- **Crawlable pagination**: `Pagination` renders real anchors, so the full
  catalog is reachable instead of only the first 24 products. Each page of the
  series canonicalises to itself (`/catalog?page=N`) — pointing them all at
  `/catalog` would have collapsed pages 2..785 onto page 1.
- **`patchParams` bug** (`aa2fcea`): `CatalogFilters` fires one debounced
  `onPatch` 400ms after mount, and `patchParams` reset `page` to 1
  unconditionally, so any direct load of `/catalog?page=N` snapped back to page
  1 — a crawler following `/catalog?page=2` was served page 1's products. It
  now returns early when the patch changes nothing.
- **Deploy**: generate the sitemap *before* the client build (`buildSitemap`
  writes to `client/public/`, and only `vite build` copies that into the web
  root, so the previous ordering shipped the prior deploy's sitemap every
  time); gate the deploy on `/api/health` with a curl/wget/node fallback probe.
- **`.htaccess`**: strip trailing slashes so `/catalog/x/` and `/catalog/x` are
  one URL, redirecting explicitly over https (TLS terminates upstream, so a
  relative `RewriteRule` target inherited the backend's http scheme).

Verified live after deploy: `/api/health` → `200 {"db":"connected"}`, the
production bundle contains both the `patchParams` guard and the self-canonical,
`/catalog/` → 301 → `https://.../catalog`, and `sitemap.xml` carries the
deploy's own timestamp with 18,841 URLs.

### Audit of the remaining Search Console problems

Reviewing a proposal to inject SEO metadata server-side surfaced findings that
changed the plan. Recorded here because they set the priorities:

1. **`/catalog/<unknown-slug>` returned HTTP 200.** The API correctly answered
   404, but the SPA shell was served under 200 — the textbook soft 404, and
   untouched by the fixes above. Addressed below.
2. **"Crawled, currently not indexed" is a content problem, not a rendering
   one.** Product descriptions are templated boilerplate (`High-quality {mfr}
   Electronic Component ({pn}). Suitable for various industrial and consumer
   electronic applications.`) across all 18.8K products, and **645 slug groups
   differ only by a trailing numeric suffix** — e.g. `3m-3341-1s-nb889-20` and
   `-21` are the same 3M part, split into two pages by their internal
   reference. No amount of server-side rendering fixes thin duplicate content.
3. **`ourReference` is not a leak.** It was flagged as information disclosure
   from the model definition alone; the frontend deliberately displays it
   (`Ref:` badge on `ProductCard` and `ProductDetail`) and the quote cart
   carries it through to admin quote line items. Left in place — see
   [`tasks.md`](tasks.md) for the open question.
4. **Rejected: routing the SPA fallback through Express** to inject metadata
   per request. It would have made every page depend on Node + Mongo, which is
   precisely the failure mode that caused this incident, with a blast radius of
   the whole site rather than just the data. It also introduced stored XSS via
   unsanitised product fields (`partNumber`, `description`, `technicalSpecs` are
   free-form; only `seoSlug` is regex-constrained), reflected XSS and host-header
   injection through a request-derived canonical, and a crawl-amplification DoS
   of 18.8K Mongo queries.

### Real 404s for unknown parts (build-time prerender)

Chosen instead of the Express proposal because it keeps every request static:
no availability coupling, no request data in the HTML, no per-request database
work.

- **[`server/src/utils/prerender.ts`](../../server/src/utils/prerender.ts)** —
  writes one flat `catalog/<slug>.html` per existing product into
  `client/dist`, each a hard link to the built shell (18.8K shells cost one
  inode's worth of data; falls back to a copy where links are unavailable).
  Nothing is injected into the HTML, so no product field reaches the page and
  there is no escaping to get wrong.
- **Path-traversal guard**: the slug becomes a filename, so each one is
  *validated* (`isValidSeoSlug`, the same constraint the admin API enforces)
  rather than sanitised, plus a resolved-dirname check. Legacy and
  CSV-imported rows are not covered by the admin zod schema, so a row
  containing `../` must never write outside the catalog directory.
- **[`server/src/scripts/prerenderProductPages.ts`](../../server/src/scripts/prerenderProductPages.ts)**
  — CLI (`npm run build:prerender --prefix server`) streaming slugs from a
  Mongo cursor. Runs **after** `vite build`, which empties `client/dist`.
- **[`client/public/.htaccess`](../../client/public/.htaccess)** — rule 3 serves
  a prerendered shell for a known slug; rule 4 returns a real 404 for an
  unknown one. `ErrorDocument 404 /index.html` keeps the styled "Product not
  found" page (which carries `noindex`) as the 404 body. Files are flat, not
  directories, so `mod_dir` cannot re-add the trailing slash that rule 2 strips.
- **Fail-safe**: rule 4 is gated on a `.prerendered` marker written only after
  the full slug set is emitted. A deploy that cannot reach the database writes
  no marker, the rule goes dormant, and the SPA shell keeps being served — a
  failed prerender can never 404 all 18K product pages. The deploy step warns
  instead of failing for the same reason.
- 6 tests in
  [`server/src/__tests__/prerender.test.ts`](../../server/src/__tests__/prerender.test.ts)
  cover the happy path, traversal slugs, out-of-charset slugs, the marker
  ordering, a missing shell, and replacement of stale shells.

## 2026-07-06

### CI/CD — GitHub Actions + Cloudways auto-deploy

- Added [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml): `ci` job (lint + test), `deploy` job (Cloudways OAuth → git pull → Varnish purge) on `main` only.
- Added [`scripts/deploy.sh`](../../scripts/deploy.sh) for Cloudways post-deployment hook (`npm install`, `npm run build`, PM2 restart).
- Added [`ecosystem.config.cjs`](../../ecosystem.config.cjs) for the `timeless-api` Node process.
- Documented secrets and one-time Cloudways setup in [`docs/06-Development/README.md`](README.md).

## 2026-06-18

### Bulk database update and enum enforcement of product status (condition)

Processed and updated the status/condition of existing products in the remote MongoDB database based on `Timeless Stock List 15.06.26.xlsx`:

- **Restoration of Original Database**:
  - Reverted the database to its exact original state (18,836 products) by clearing the collection and re-seeding from `server/final_products_ready.csv`.
- **Mongoose Model & Enum Update**:
  - Added the `condition` field to the Mongoose interface and schema in `server/src/models/Product.ts`.
  - Configured `condition` strictly as an enum: `['New/Standard', 'Used', 'Refurbished', 'Broken']` with a default of `'New/Standard'`.
- **Excel Processing & Status Mapping (Python)**:
  - Scanned 25,276 rows of the stock list Excel sheet.
  - Parsed Columns 4 and 5 for status keywords:
    - Keywords like `broken`, `bent pins`, `scratched badly`, `damaged`, `scrap` mapped to `"Broken"`.
    - Keywords like `used`, `parts or repair`, `AS-IS`, `parts`, `marks, hits` mapped to `"Used"`.
    - Keyword `refurbished` mapped to `"Refurbished"`.
    - Keywords `new`, `standard` mapped to `"New/Standard"`.
  - Grouped condition classifications by `(partNumber, manufacturer)` case-insensitively, selecting the worst condition (Broken > Used > Refurbished > New/Standard) in case of multiple listings.
  - Wrote status mappings to `server/temp_conditions_to_update.json`.
- **Database Status Seeding & Standardization (TypeScript/Mongoose)**:
  - Loaded database products in-memory and mapped their keys against the Excel condition map.
  - Performed a highly optimized `bulkWrite` operation to update only the `condition` field of 13,315 matching database products.
  - Wrote a standardization migration script (`server/src/scripts/standardizeConditions.ts`) that sanitized all other non-matching products in the database so that every product strictly adheres to one of the four enum values.
  - Did not insert any new products and kept all original database quantities, descriptions, and slugs untouched.
  - Cleaned up all temporary files.

## 2026-04-14

### Same-origin API + sitemap routing rewrite

Updated the frontend and deployment routing setup to use same-origin API access and preserve sitemap delivery without breaking SPA routing:

- Added Vite dev proxy entries for `/api` and `/sitemap.xml` in `client/vite.config.ts` (targeting `http://localhost:3001`)
- Changed frontend API resolution to default to `/api` when `VITE_API_URL` is unset in both `client/src/lib/api.ts` and `client/src/lib/adminApi.ts`
- Updated environment defaults to same-origin (`VITE_API_URL=/api`) in `client/.env` and `.env.example`
- Added `client/public/.htaccess` with Cloudways/Apache-friendly rewrite order:
  - pass through `/api/*`
  - pass through `/sitemap.xml`
  - fallback all other non-file routes to `/index.html`
- Updated `client/public/robots.txt` sitemap URL to same-origin format
- Ran client type-check (`npm run lint --prefix client`) successfully

## 2026-04-10

### Full-stack clone implementation

Built the complete Timeless Electronix website clone from scratch:

**Server (Express + TypeScript + MongoDB)**
- Mongoose models: Product (18K+ items), ContactMessage, QuoteRequest
- Public API: products (search, filter, paginate), manufacturers list, contact form, quote submission
- Admin API: secret-code login with JWT, dashboard stats, products CRUD, CSV bulk import, Cloudinary image upload, messages management, quotes with status workflow
- Zod request validation on all mutation endpoints
- Resend email service for contact and quote notifications (graceful no-op when unconfigured)
- CSV seed script for importing `Product_export.csv`

**Client (React + Vite + TailwindCSS)**
- 5 public pages: Home, Catalog, About, Contact, Quote
- Home: hero with search, stats, "Who We Are", Industries, contact form, client logos, CTA
- Catalog: search + manufacturer dropdown, paginated product grid, "Add to Quote" per card
- Quote: localStorage-backed cart (QuoteContext), customer form, submit to API
- Admin dashboard: login (env secret), stats overview, products table with CRUD/CSV import/image upload, messages inbox, quotes management with status changes
- Dark theme matching the original site (custom Tailwind `@theme` tokens)
- Mobile-responsive with hamburger menu

**Testing**
- 19 API tests across 4 suites (products, contact, quotes, admin)
- In-memory MongoDB via mongodb-memory-server
- All tests passing

**Project quality**
- 4 Cursor rules: workflow, stack conventions, component patterns, server patterns
- Full documentation: Frameworks, Architecture, Development tasks/progress, Tests
- Git history with conventional commits
