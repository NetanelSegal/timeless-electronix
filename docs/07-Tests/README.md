# 07 — Tests

## Test stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner |
| Supertest | HTTP request testing for Express |
| mongodb-memory-server | In-memory MongoDB for isolated tests |

## Test location

All server tests live in `server/src/__tests__/`.

## Test suites

| File | Tests | Coverage |
|------|-------|----------|
| `products.test.ts` | 6 | GET list, search, manufacturer filter, manufacturers endpoint, get by ID, 404 |
| `contact.test.ts` | 3 | Create message, required field validation, email format validation |
| `quotes.test.ts` | 3 | Create quote, empty items validation, email validation |
| `admin.test.ts` | 7 | Login success/failure, auth rejection, stats, product CRUD, message read, quote status |
| **Total** | **19** | |

## Running tests

```bash
cd server
npm run test        # or: npx vitest run
```

## Test setup

`server/src/__tests__/setup.ts`:
- Stubs all environment variables.
- Starts `mongodb-memory-server` before all tests.
- Clears all collections between tests.
- Disconnects and stops the server after all tests.

## Adding tests

- Add new test files as `server/src/__tests__/<domain>.test.ts`.
- Import `app` from `../app.js` (not `index.ts` which starts the server).
- Use the shared setup — no per-file DB setup needed.
