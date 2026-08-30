# Tasks

## Completed

- [x] **Project setup**: Git init, root package.json, client (Vite+React+TS+Tailwind), server (Express+TS), `.env.example`, `.gitignore`
- [x] **Data model**: Mongoose schemas (Product, ContactMessage, QuoteRequest), DB connection, CSV seed script
- [x] **Server API**: All public routes (products, manufacturers, contact, quotes) and admin routes (login, stats, products CRUD, messages, quotes)
- [x] **Cloudinary integration**: Upload/delete service, admin image upload endpoint
- [x] **Email service**: Resend integration for contact and quote notifications
- [x] **Shared components**: Header (mobile hamburger), Footer, ProductCard, QuoteContext (localStorage cart)
- [x] **Home page**: Hero with search, stats counters, Who We Are, Industries, contact form, client logos, CTA
- [x] **Catalog page**: Search + manufacturer filter, paginated grid, Add to Quote
- [x] **About page**: Hero, Our Story, Core Values, Industry sectors, CTA
- [x] **Contact page**: Hero, business info, contact form
- [x] **Quote page**: Cart with quantity/remove, customer form, submit to API
- [x] **Admin auth**: Login page + JWT middleware
- [x] **Admin dashboard**: Stats, products table (CRUD, CSV import, image upload), messages inbox, quotes management
- [x] **Cursor rules**: Workflow, stack, component patterns, server patterns
- [x] **Testing**: 19 server API tests (Vitest + Supertest), all passing
- [x] **Documentation**: Frameworks, Architecture, Development, Tests docs updated
- [x] **Routing rewrite**: same-origin `/api` client base, Vite proxy for `/api` and `/sitemap.xml`, and Cloudways-ready Apache rewrite order via `client/public/.htaccess`
- [x] **Product Status (Condition) Seeding & Enum Enforcement**: Added `condition` string enum field (`'New/Standard' | 'Used' | 'Refurbished' | 'Broken'`) to the Mongoose schema and TypeScript interface. Extracted statuses from `Timeless Stock List 15.06.26.xlsx` to update 13,315 matching database products, and standardized all database products to strictly conform to the enum.
- [x] **Product detail page**: slug-based `/catalog/:seoSlug` route with images, specs, condition badge, and add-to-quote.
- [x] **Soft-404 / indexing fixes** (2026-08-28): kept the API alive through Mongo outages, stopped rendering 5xx as "not found", `noindex` on every no-content state, crawlable catalog pagination with self-referencing canonicals, https trailing-slash redirect, and a health gate on the deploy. See [`progress.md`](progress.md).
- [x] **Client-side tests**: Vitest + React Testing Library (34 tests across 8 files).
- [x] **SEO meta tags per page**: `PageSeo` (react-helmet-async) with canonical, Open Graph, and `noindex` control; product JSON-LD on the detail page.
- [x] **Image gallery** for products with multiple images (thumbnail strip on `ProductDetail`).
- [x] **Real 404s for unknown parts** (2026-08-28): build-time prerender of one flat shell per existing slug (into `_parts/`, outside the `/catalog` route namespace) plus `.htaccess` rules, so `/catalog/<unknown>` returns 404 instead of the SPA shell under 200. Gated on a `.prerendered` marker so a failed prerender cannot 404 the catalog.
- [x] ~~**Tidy 521 legacy slugs**~~ — **closed, will not do.** They have leading, trailing or doubled hyphens but are prerendered, serve 200, and are indexed under those URLs. Renaming them would retire 521 URLs Google already knows in exchange for cosmetics, and would need redirects to avoid losing them. The prerender guard was widened to accept them instead. One slug is 144 chars, over the 120 bound, and falls through to the SPA shell under 200.
- [ ] **Repair the 45 rows whose `partNumber` is `[object Object]`** — needs the source stock list. The value was lost at import and is **not** recoverable from the database: their `technicalSpecs` are empty. Until then they are `noindex`, emit no product JSON-LD, and are left out of the sitemap, so they are not indexed under a meaningless title. The description still holds the real text (e.g. "Photo Emitter LED SM 575NM YEL"), which may help match them back to the source rows.

## Backlog / Future

### Search Console — remaining work (prioritised 2026-08-28)

- [ ] **Consolidate 645 duplicate slug groups.** Slugs differing only by a
      trailing numeric suffix (`3m-3341-1s-nb889-20` / `-21`) are the same part
      split across pages by internal reference. Pick one canonical URL per
      (partNumber, manufacturer) and point the rest at it. This is the likeliest
      driver of the 4,874 "crawled, currently not indexed".
- [ ] **Differentiate product copy.** `description` and `productSummary` are
      templated boilerplate across all 18.8K products. Server-side rendering
      does not fix thin duplicate content — either write real copy for the parts
      that get searched, or `noindex` the long tail and spend crawl budget on
      the rest.
- [ ] **Decide on `ourReference` in the public API.** It is deliberately shown
      to customers (`Ref:` badge) and flows through the quote cart, so it is not
      a leak — but it is an internal stock reference, it is returned on every
      public product response, and it is what fragments the slugs above. Open
      question for the business, not a bug.
- [ ] **Request validation in Search Console** for the Soft 404 and "crawled,
      not indexed" reports, then track the counts down over the following weeks.
- [ ] **Server-side metadata injection** — only after the above. The prerender
      now makes this cheap and safe: titles, canonicals and JSON-LD can be baked
      into each shell at build time, with escaping done once at build rather
      than per request. Do **not** route the SPA fallback through Express; see
      the rejected proposal in [`progress.md`](progress.md).

### Engineering

- [ ] **Confirm the deploy built the right commit** — attempted and reverted.
      `public_html` is **not a git checkout the SSH user can read**:
      `git rev-parse HEAD` returns nothing, so polling it timed out and failed
      two deploys. The `sleep 30` is back, and the check in `scripts/deploy.sh`
      now skips when there is no readable checkout instead of blocking. The
      real fix is to poll the **Cloudways operation API** — `POST /api/v1/git/pull`
      returns an operation id that can be polled to completion — rather than
      guessing at a duration. Removing the sleep without that in place races
      the pull and fails with `EACCES` while it rewrites files.
- [x] **Upgraded `actions/checkout` and `actions/setup-node` to v5.**
- [x] Deleted the merged branches.

### Product

- [ ] Email templates with React Email components (currently inline HTML)
- [ ] Admin: bulk delete, export products
- [ ] Rate limiting on public API endpoints
