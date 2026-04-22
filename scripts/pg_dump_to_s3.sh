#!/usr/bin/env bash
set -euo pipefail

# Sauvegarde PostgreSQL quotidienne vers S3/R2 (via AWS CLI).
#
# Requis:
# - `pg_dump` (souvent dans l'image postgres ou sur l'hôte)
# - `aws` (AWS CLI) configuré (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_DEFAULT_REGION)
#
# Variables attendues:
# - DATABASE_URL (ex: postgres://user:pass@host:5432/dbname)
# - BACKUP_BUCKET (ex: s3://mon-bucket/backups)
# - (optionnel) AWS_ENDPOINT_URL (ex: https://<accountid>.r2.cloudflarestorage.com)

ts="$(date -u +%Y%m%dT%H%M%SZ)"
tmp="/tmp/photoevent_pg_${ts}.dump.gz"

: "${DATABASE_URL:?DATABASE_URL manquant}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET manquant (ex: s3://bucket/backups)}"

echo "Dump PostgreSQL -> ${tmp}"
pg_dump "${DATABASE_URL}" --format=custom | gzip -c > "${tmp}"

key="${BACKUP_BUCKET%/}/photoevent_${ts}.dump.gz"
echo "Upload -> ${key}"

if [[ -n "${AWS_ENDPOINT_URL:-}" ]]; then
  aws s3 cp "${tmp}" "${key}" --endpoint-url "${AWS_ENDPOINT_URL}"
else
  aws s3 cp "${tmp}" "${key}"
fi

rm -f "${tmp}"
echo "OK"

