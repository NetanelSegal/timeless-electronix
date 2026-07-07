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

## Production deployment (Cloudways + GitHub Actions)

CI and deploy are defined in [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

### Your layout (`client/dist` as web root)

Two settings are easy to confuse — they must be **different**:

| Setting | What to use | Why |
|--------|-------------|-----|
| **Git deploy path** (Cloudways → Deployment via Git) | **Repository root** (leave empty / `public_html` = full monorepo) | `client/dist` is **gitignored** and only exists after `npm run build`. Git must deploy the full repo so `scripts/deploy.sh`, `server/`, and source are on the server. |
| **Web document root** (Apache / app webroot) | **`client/dist`** | Visitors see the built SPA (`index.html`, assets, `.htaccess`). |

On disk it should look like:

```
public_html/                 ← full monorepo (from Git)
  client/
    dist/                    ← Apache document root (web root)
      index.html
      .htaccess              ← copied from client/public on build
  server/
    .env                     ← production secrets (not in Git)
    dist/                    ← compiled API
  scripts/deploy.sh
  ecosystem.config.cjs
```

The Node API runs via PM2 from `server/` (port 3001). [`client/public/.htaccess`](../../client/public/.htaccess) proxies `/api/*` to Node.

**Do not** set Cloudways Git to deploy only the `client/dist` folder from the repository — that folder is not in Git and the deploy would be empty or stale.

### Flow

1. **Pull request to `main`** — runs lint + tests only; no deploy.
2. **Push/merge to `main`** — runs lint + tests, then Cloudways git pull, SSH `scripts/deploy.sh` (build + PM2 restart), and Varnish cache purge.
3. **Manual redeploy** — GitHub → Actions → *Deploy to Cloudways* → *Run workflow*.

Auto-deploy on push in Cloudways should stay **off** (you already have this). Only GitHub Actions triggers production deploys after CI passes.

### One-time Cloudways setup

1. **Deployment via Git** — connect `NetanelSegal/timeless-electronix`, branch `main`, deploy path = **repository root** (not `client/dist`).
2. **Auto-deploy on push** — **disabled** (GitHub Actions handles deploy).
3. **`server/.env`** on the server with production values (copy from [`.env.example`](../../.env.example); never commit this file). Must exist **before** the first deploy build — without it, `scripts/deploy.sh` exits and **UI will not rebuild**.
4. **PM2** (first time only, SSH into the app after the first successful Git sync):

   ```bash
   cd ~/applications/<app-folder>/public_html
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

5. **Web root** — confirm Apache / application webroot points at **`client/dist`** (not the monorepo root).

Cloudways Git has **no post-deploy script field**. The workflow runs `scripts/deploy.sh` over **SSH** after git pull.

### GitHub repository secrets

Add these under GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Where to find it |
|--------|------------------|
| `CLOUDWAYS_EMAIL` | Your Cloudways login email |
| `CLOUDWAYS_API_KEY` | Cloudways → account menu (⋮) → **API** |
| `CLOUDWAYS_SERVER_ID` | Server numeric ID in the dashboard URL |
| `CLOUDWAYS_APP_ID` | Application numeric ID in the dashboard URL |
| `CLOUDWAYS_SSH_HOST` | Server **public IP** (Server → Master Credentials) |
| `CLOUDWAYS_SSH_USER` | SSH username, e.g. `master_xxxxx` |
| `CLOUDWAYS_SSH_PASSWORD` | SSH password (Master Credentials — **not** the public key file) |
| `CLOUDWAYS_APP_PATH` | `public_html` path, e.g. `/home/1277679.cloudwaysapps.com/zumcgfttvy/public_html` |

Use **password** auth unless you add a real **private** key (`-----BEGIN … PRIVATE KEY-----`). A line starting with `ssh-rsa AAAA…` is a **public** key and will fail with `no key found`.

### After secrets are added

1. **Commit and push** the CI/CD files to `main` (`.github/workflows/deploy.yml`, `scripts/deploy.sh`, `ecosystem.config.cjs`).
2. Open GitHub → **Actions** → *Deploy to Cloudways* and confirm the **Lint and test** job passes.
3. On success, the **Deploy** job runs: Cloudways git pull → SSH `scripts/deploy.sh` → Varnish purge.
4. Verify the site, `/api/products`, and that UI changes appear without a hard refresh.

If the deploy job fails, open the failed step log. Common causes: wrong server/app ID, invalid API key, missing `server/.env`, or missing SSH secrets.

### UI changes not appearing after deploy

The live site updates only when the workflow’s **SSH step** runs **`scripts/deploy.sh` successfully** (`npm run build` → writes `client/dist/`).

**Symptom:** GitHub deploy job is green, but the site still serves an old JS bundle (e.g. `index-BuSsMTS1.js` in View Source instead of a new hash).

**Check on the server (SSH):**

```bash
cd ~/applications/<app-folder>/public_html

# Full monorepo present? (not just index.html + assets/)
ls package.json client/src scripts/deploy.sh

# Did post-deploy run?
tail -50 deploy.log

# Run build manually to see errors
bash scripts/deploy.sh
```

**Common fixes:**

| Problem | Fix |
|--------|-----|
| `public_html` only has `index.html` + `assets/` (no `client/src`) | Git deploy path must be **repo root**, not `client/dist`. Apache webroot = `client/dist`. |
| `server/.env is missing` in `deploy.log` | Create `server/.env` on the server with production values |
| SSH deploy step fails | Add `CLOUDWAYS_SSH_*` secrets; confirm `CLOUDWAYS_APP_PATH` matches `public_html` |
| `pm2 not found` | `npm install -g pm2` then `pm2 start ecosystem.config.cjs && pm2 save` |
| Build fails on sitemap | Ensure `MONGODB_URI` and `PUBLIC_SITE_URL` are set in `server/.env` |

After a successful manual build, hard-refresh the browser (Ctrl+Shift+R) or purge Varnish in Cloudways.

### Optional: branch protection

Protect `main` and require the **Lint and test** (`ci`) status check so PRs cannot merge until tests pass.

## Links

- [`tasks.md`](tasks.md) — active task list
- [`progress.md`](progress.md) — dated progress log
