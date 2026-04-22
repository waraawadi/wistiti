#!/usr/bin/env bash
set -euo pipefail

# Backup PostgreSQL (compose prod) -> gzip -> upload S3/R2 via aws cli
# Rétention: 30 jours (suppression des fichiers > 30 jours au prefix BACKUP_BUCKET)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${BACKUP_BUCKET:?BACKUP_BUCKET manquant (ex: s3://bucket/backups)}"

ts="$(date -u +%Y%m%dT%H%M%SZ)"
tmp="/tmp/photoevent_${ts}.sql.gz"

echo "==> Dump depuis container postgres"
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-photoevent}" -d "${POSTGRES_DB:-photoevent}" | gzip -c > "${tmp}"

dest="${BACKUP_BUCKET%/}/photoevent_${ts}.sql.gz"
echo "==> Upload -> ${dest}"
if [[ -n "${AWS_ENDPOINT_URL:-}" ]]; then
  aws s3 cp "${tmp}" "${dest}" --endpoint-url "${AWS_ENDPOINT_URL}"
else
  aws s3 cp "${tmp}" "${dest}"
fi

rm -f "${tmp}"

echo "==> Rétention 30 jours"
cutoff="$(date -u -d '30 days ago' +%Y%m%dT%H%M%SZ)"

list_cmd=(aws s3 ls "${BACKUP_BUCKET%/}/")
if [[ -n "${AWS_ENDPOINT_URL:-}" ]]; then
  list_cmd+=(--endpoint-url "${AWS_ENDPOINT_URL}")
fi

while read -r d t size key; do
  [[ -z "${key:-}" ]] && continue
  # extrait timestamp du nom: photoevent_YYYYMMDDTHHMMSSZ.sql.gz
  if [[ "${key}" =~ photoevent_([0-9]{8}T[0-9]{6}Z)\.sql\.gz ]]; then
    kts="${BASH_REMATCH[1]}"
    if [[ "${kts}" < "${cutoff}" ]]; then
      rm_cmd=(aws s3 rm "${BACKUP_BUCKET%/}/${key}")
      if [[ -n "${AWS_ENDPOINT_URL:-}" ]]; then
        rm_cmd+=(--endpoint-url "${AWS_ENDPOINT_URL}")
      fi
      echo "Delete old -> ${key}"
      "${rm_cmd[@]}"
    fi
  fi
done < <("${list_cmd[@]}")

echo "OK"

