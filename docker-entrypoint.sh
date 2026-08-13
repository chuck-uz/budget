#!/bin/sh
set -e
# Миграции применяет отдельный one-shot сервис `migrate` (см. docker-compose.prod.yml).
echo "[entrypoint] seeding admin user..."
node scripts/seed-user.mjs || echo "[entrypoint] seed failed (continuing)"
echo "[entrypoint] starting server..."
exec node server.js
