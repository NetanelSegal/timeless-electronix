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

## Backlog / Future

- [ ] Product detail page (click through from catalog)
- [ ] Email templates with React Email components (currently inline HTML)
- [ ] Client-side tests (Vitest + React Testing Library)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] SEO meta tags per page
- [ ] Image gallery for products with multiple images
- [ ] Admin: bulk delete, export products
- [ ] Rate limiting on public API endpoints
