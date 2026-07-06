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

echo "deploy: building client..."
npm run build --prefix client

echo "deploy: building server..."
npm run build --prefix server

echo "deploy: building sitemap..."
if npm run build:sitemap --prefix server; then
  node scripts/verify-sitemap.js
else
  echo "deploy: WARNING sitemap build failed; client and server builds are still deployed"
fi

echo "deploy: restarting API..."
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe timeless-api >/dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --update-env
  else
    pm2 start ecosystem.config.cjs
  fi
else
  echo "deploy: WARNING pm2 not found; install with: npm install -g pm2"
fi

echo "deploy: finished at $(date -Is)"
