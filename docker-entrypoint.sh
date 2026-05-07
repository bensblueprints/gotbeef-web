#!/bin/sh
set -e

echo "[entrypoint] applying database schema (prisma db push)…"
node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate || {
  echo "[entrypoint] WARN: prisma db push failed; continuing anyway"
}

echo "[entrypoint] seeding admin users…"
node scripts/seed-admin.js || true

echo "[entrypoint] starting server.js"
exec node server.js
