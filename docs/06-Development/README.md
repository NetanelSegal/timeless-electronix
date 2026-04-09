# 06 — Development

## Local environment

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- (Optional) Cloudinary account for image uploads
- (Optional) Resend account for email notifications

### Setup

```bash
# Install all dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Copy and fill environment variables
cp .env.example server/.env

# Seed the database with product data
npm run seed

# Start both client and server
npm run dev
```

The client runs at `http://localhost:5173`, the server at `http://localhost:3001`.

### Admin access

Navigate to `/admin/login` and enter the value of `ADMIN_SECRET` from your `.env` file.

## Repository layout

- `client/` — React SPA (Vite + TypeScript + TailwindCSS)
- `server/` — Express API (TypeScript + Mongoose)
- `docs/` — Project documentation
- `.cursor/rules/` — AI coding conventions

## Conventions

- See `.cursor/rules/02-stack.mdc` for stack conventions.
- See `.cursor/rules/03-component-patterns.mdc` for React patterns.
- See `.cursor/rules/04-server-patterns.mdc` for Express patterns.

## Branching & commits

- Feature branches: `feature/…`, `fix/…`
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`

## Links

- [`tasks.md`](tasks.md) — active task list
- [`progress.md`](progress.md) — dated progress log
