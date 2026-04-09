# 02 — Frameworks & Stack

## Frontend

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI library |
| TypeScript | ~5.7 | Type safety |
| Vite | 8 | Build tool / dev server |
| TailwindCSS | 4 | Utility-first CSS |
| React Router | 7 | Client-side routing |
| Lucide React | latest | Icon library |

## Backend

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| Express | 4 | HTTP server |
| TypeScript | ~5.7 | Type safety |
| tsx | 4 | TypeScript execution in dev |
| Mongoose | 8 | MongoDB ODM |
| Zod | 3 | Request validation |
| jsonwebtoken | 9 | Admin JWT auth |

## Database

- **MongoDB** — document store for products (~18K), contact messages, and quote requests.

## External Services

| Service | Purpose | Env Var |
|---------|---------|---------|
| Cloudinary | Product image hosting (upload from admin) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Resend | Transactional email (contact & quote notifications) | `RESEND_API_KEY` |

Both are optional — the app degrades gracefully when keys are not set.

## Dev Tooling

| Tool | Purpose |
|------|---------|
| concurrently | Run client + server together with `npm run dev` |
| Vitest | Test runner (server unit tests) |
| Supertest | HTTP assertions in tests |
| mongodb-memory-server | In-memory MongoDB for tests |

## Why these choices

- **React + Vite** — fast DX, wide ecosystem, TypeScript-first.
- **Express** — lightweight, well-understood, easy to deploy anywhere.
- **MongoDB + Mongoose** — natural fit for the product catalog (schemaless-ish parts data from CSV), good with the existing `Product_export.csv` shape.
- **Cloudinary** — purpose-built image CDN, simple upload API, no self-hosted storage needed.
- **Resend** — modern email API, simpler than SMTP config. Pairs with React Email for JSX templates.
- **Tailwind v4** — zero-config with the Vite plugin, custom theme tokens via `@theme`.
