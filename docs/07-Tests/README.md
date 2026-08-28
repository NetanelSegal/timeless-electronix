# 07 — Tests

## Test stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner (server + client) |
| Supertest | HTTP request testing for Express |
| mongodb-memory-server | In-memory MongoDB for isolated tests |
| Testing Library (`@testing-library/react`, `user-event`) | Client component and hook tests |
| jsdom | Browser-like DOM for client Vitest |

## Test locations

- **Server:** `server/src/__tests__/`
- **Client:** `client/src/**/*.test.{ts,tsx}` (co-located next to source)

### Client setup

- Config: `client/vitest.config.ts` (Vite plugins aligned with the app, `environment: 'jsdom'`).
- Global setup: `client/src/test/setup.ts` (e.g. `@testing-library/jest-dom`).
- Run: `cd client && npm test` (or `npm run test --prefix client` from the repo root).

## Server test suites

| File | Tests | Coverage |
|------|-------|----------|
| `products.test.ts` | 11 | GET list, search, manufacturer filter, manufacturers endpoint, get by ID/slug, 404 |
| `contact.test.ts` | 3 | Create message, required field validation, email format validation |
| `quotes.test.ts` | 4 | Create quote, empty items validation, email validation |
| `admin.test.ts` | 14 | Login, JWT auth, stats, product CRUD/list filters, messages, quotes |
| `seoSlug.test.ts` | 5 | Slug charset, length cap, numeric-suffix collisions |
| `productSlugService.test.ts` | 5 | Slug assignment and uniqueness on write |
| `prerender.test.ts` | 6 | Shell per valid slug, marker ordering, path traversal, charset rejection, missing shell, stale replacement |
| **Total** | **48** | |

`prerender.test.ts` is the security boundary for the build-time prerender:
product slugs become filenames, so the traversal and charset cases assert that
a row containing `../` or characters outside `[a-z0-9-]` is **skipped**, never
sanitised into a write outside the catalog directory. See
[`04-Architecture`](../04-Architecture/README.md#request-routing-and-http-status-truthfulness).

## Client test suites

| File | Tests | Coverage |
|------|-------|----------|
| `AdminSidebar.test.tsx` | 3 | Collapse/expand, logout clears token |
| `AdminProductsFilters.test.tsx` | 3 | Panel toggle, search scope patch, debounced manufacturer |
| `useAdminSidebarCollapsed.test.ts` | 2 | localStorage read/write |
| `useCatalog.test.tsx` | 5 | URL param sync, sort presets, and the mount patch that must **not** reset `page` |
| `useDebouncedSearchToUrl.test.tsx` | 6 | Debounced URL writes |
| `useDebouncedValue.test.ts` | 3 | Debounce timing |
| `apiClient.test.ts` | 3 | `ApiError` carries the HTTP status so 404 and 5xx render differently |
| `listUrlQuery.test.ts` | 9 | Page parsing, sort resolution |
| **Total** | **34** | |

`useCatalog.test.tsx` and `apiClient.test.ts` are SEO regression guards, not
just unit tests — they pin the two bugs that turned backend downtime and
paginated crawling into soft 404s. See the 2026-08-28 entry in
[`06-Development/progress.md`](../06-Development/progress.md).

## Running tests

```bash
# From repo root (server then client)
npm test

cd server
npm run test        # or: npx vitest run

cd client
npm run test        # or: npx vitest run
npm run test:watch  # watch mode
```

## Test setup

`server/src/__tests__/setup.ts`:
- Stubs all environment variables.
- Starts `mongodb-memory-server` before all tests.
- Clears all collections between tests.
- Disconnects and stops the server after all tests.

## Adding tests

**Server:** add `server/src/__tests__/<domain>.test.ts`, import `app` from `../app.js` (not `index.ts`), use the shared setup.

**Client:** add `*.test.ts` / `*.test.tsx` next to the module under `client/src/`; use `render` / `renderHook` from Testing Library, `MemoryRouter` when routing matters, and `vi.mock` for modules such as `adminApi`.
