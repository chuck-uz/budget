#!/bin/sh
set -e
echo "[entrypoint] applying migrations..."
node_modules/.bin/prisma migrate deploy || echo "[entrypoint] migrate deploy failed (continuing)"
echo "[entrypoint] starting server..."
exec node server.js
