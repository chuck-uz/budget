#!/bin/sh
set -e
echo "[entrypoint] applying migrations..."
# Запускаем настоящий build/index.js (а не .bin-симлинк) — иначе ломается путь к wasm.
node node_modules/prisma/build/index.js migrate deploy || echo "[entrypoint] migrate deploy failed (continuing)"
echo "[entrypoint] seeding admin user..."
node scripts/seed-user.mjs || echo "[entrypoint] seed failed (continuing)"
echo "[entrypoint] starting server..."
exec node server.js
