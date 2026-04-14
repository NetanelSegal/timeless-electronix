# Progress Log

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
