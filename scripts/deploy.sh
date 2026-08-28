#!/usr/bin/env bash
# Cloudways post-deployment hook. Run from the deployed monorepo root (public_html).
# Web document root should be client/dist/ — this script builds that folder in place.
set -euxo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
LOG_FILE="${REPO_ROOT}/deploy.log"

exec > >(tee -a "$LOG_FILE") 2>&1
echo "deploy: started at $(date -Is)"
echo "deploy: repo root=$REPO_ROOT"

if [ ! -f package.json ] || [ ! -d client ] || [ ! -d server ]; then
  echo "deploy: ERROR expected monorepo at repo root (package.json, client/, server/)."
  echo "deploy: If public_html only contains built static files, point Git deploy at the repo root and set Apache webroot to client/dist."
  exit 1
fi

if [ ! -f server/.env ]; then
  echo "deploy: ERROR server/.env is missing. Create it from .env.example before deploying."
  exit 1
fi

# Cloudways shells may not load nvm by default.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
fi

echo "deploy: node=$(command -v node || echo missing) version=$(node -v 2>/dev/null || echo unknown)"

echo "deploy: installing dependencies..."
npm install
npm install --prefix client
npm install --prefix server

echo "deploy: building server..."
npm run build --prefix server

# Must run BEFORE the client build: buildSitemap writes client/public/sitemap.xml,
# and only `vite build` copies client/public/ into client/dist/ (the web root).
# Generating it afterwards leaves the previous deploy's sitemap live.
echo "deploy: building sitemap..."
if npm run build:sitemap --prefix server; then
  echo "deploy: sitemap generated"
else
  echo "deploy: WARNING sitemap build failed; deploying with the previous sitemap"
fi

echo "deploy: building client..."
npm run build --prefix client

# Must run AFTER the client build: it writes into client/dist, which
# `vite build` empties. One flat shell per existing product slug is what lets
# Apache return a real 404 for a part that does not exist (see .htaccess).
# A failure here writes no marker, so the .htaccess rule stays dormant and the
# SPA shell keeps being served -- never fail the deploy over it.
echo "deploy: prerendering product shells..."
if npm run build:prerender --prefix server; then
  echo "deploy: product shells generated"
else
  echo "deploy: WARNING prerender failed; /catalog/<slug> keeps serving the SPA shell under 200"
fi

node scripts/verify-sitemap.js

echo "deploy: restarting API..."
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe timeless-api >/dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --update-env
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save || echo "deploy: WARNING pm2 save failed; API may not survive a reboot"
else
  echo "deploy: WARNING pm2 not found; install with: npm install -g pm2"
fi

# Fail the deploy if the API is not actually serving. Without this a dead
# backend goes unnoticed while Apache serves 503 for every /api/* request,
# which renders the whole catalog as soft 404s to search engines.
echo "deploy: waiting for API health..."
health_url="http://127.0.0.1:${API_PORT:-3001}/api/health"

# curl is not guaranteed on the host; fall back to node, which is present
# because we just built with it. Never fail the deploy over a missing tool.
probe_health() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 5 "$health_url" >/dev/null 2>&1
  elif command -v wget >/dev/null 2>&1; then
    wget -q -T 5 -O /dev/null "$health_url" >/dev/null 2>&1
  else
    node -e '
      const http = require("http");
      const req = http.get(process.argv[1], (res) => {
        res.resume();
        process.exit(res.statusCode === 200 ? 0 : 1);
      });
      req.setTimeout(5000, () => { req.destroy(); process.exit(1); });
      req.on("error", () => process.exit(1));
    ' "$health_url" >/dev/null 2>&1
  fi
}

attempt=0
healthy=0
while [ "$attempt" -lt 30 ]; do
  attempt=$((attempt + 1))
  if probe_health; then
    echo "deploy: API healthy after ${attempt} attempt(s)"
    healthy=1
    break
  fi
  sleep 2
done

if [ "$healthy" != "1" ]; then
  echo "deploy: ERROR API did not become healthy at $health_url"
  echo "deploy: last 40 lines of pm2 logs:"
  pm2 logs timeless-api --lines 40 --nostream 2>&1 || true
  exit 1
fi

echo "deploy: finished at $(date -Is)"
