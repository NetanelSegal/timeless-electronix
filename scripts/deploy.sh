#!/usr/bin/env bash
# Cloudways post-deployment hook. Run from the deployed monorepo root (public_html).
# Web document root should be client/dist/ — this script builds that folder in place.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "deploy: installing dependencies..."
npm install
npm install --prefix client
npm install --prefix server

echo "deploy: building client, server, and sitemap..."
npm run build

echo "deploy: restarting API..."
if pm2 describe timeless-api >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

echo "deploy: done"
