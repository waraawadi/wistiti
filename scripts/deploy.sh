#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=()
if [[ -f "${ROOT_DIR}/.env.prod" ]]; then
  ENV_FILE=(--env-file "${ROOT_DIR}/.env.prod")
fi

echo "==> Pull"
git pull

echo "==> Build images"
docker compose "${ENV_FILE[@]}" -f docker-compose.prod.yml build

echo "==> Migrate + seed AppConfig"
docker compose "${ENV_FILE[@]}" -f docker-compose.prod.yml run --rm django_wsgi python manage.py migrate --noinput

echo "==> Collect static"
docker compose "${ENV_FILE[@]}" -f docker-compose.prod.yml run --rm django_wsgi python manage.py collectstatic --noinput

echo "==> Restart"
docker compose "${ENV_FILE[@]}" -f docker-compose.prod.yml up -d

echo "OK"

