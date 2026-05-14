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
| `products.test.ts` | 8 | GET list, search, manufacturer filter, manufacturers endpoint, get by ID, 404 |
| `contact.test.ts` | 3 | Create message, required field validation, email format validation |
| `quotes.test.ts` | 4 | Create quote, empty items validation, email validation |
| `admin.test.ts` | 12 | Login, JWT auth, stats, product CRUD/list filters, messages, quotes |
| **Total** | **27** | |

## Client test suites

| File | Tests | Coverage |
|------|-------|----------|
| `AdminSidebar.test.tsx` | 3 | Collapse/expand, logout clears token |
| `AdminProductsFilters.test.tsx` | 3 | Panel toggle, search scope patch, debounced manufacturer |
| `useAdminSidebarCollapsed.test.ts` | 2 | localStorage read/write |
| **Total** | **8** | |

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
