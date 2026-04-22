#!/usr/bin/env bash
# PhotoEvent — menu Docker ultra simple (dev / prod / stop)
# Usage (avec menu) : ./scripts/stack.sh
# Usage (direct)    : ./scripts/stack.sh dev | prod | down | down-v | ps-dev | ps-prod | logs-dev | logs-prod | superuser-dev | superuser-prod
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_DEV=(-f "${ROOT}/docker-compose.dev.yml")
COMPOSE_VPS=(-f "${ROOT}/docker-compose.prod.yml")

cd "${ROOT}" || exit 1

info() { printf '%s\n' "$*"; }
warn() { printf '[attention] %s\n' "$*" >&2; }
err() { printf '[erreur] %s\n' "$*" >&2; }

have() { command -v "$1" >/dev/null 2>&1; }

port_in_use() {
  # Retourne 0 si le port TCP est déjà écouté sur l'hôte.
  # Ne dépend pas de sudo (pas d'info process), juste l'occupation.
  local port="${1}"
  ss -ltn 2>/dev/null | awk 'NR>1 {print $4}' | grep -Eq "(:|\\])${port}\$"
}

ensure_ports() {
  # Si l'utilisateur n'a pas fixé les ports et qu'ils sont occupés,
  # on choisit une alternative non-conflictuelle pour cette exécution.
  if [[ -z "${NGINX_PORT:-}" ]] && port_in_use 80; then
    warn "Le port 80 est déjà utilisé sur l'hôte. Je bascule NGINX_PORT=8080 pour cette exécution."
    export NGINX_PORT=8080
  fi
  if [[ -z "${FRONTEND_PORT:-}" ]] && port_in_use 3000; then
    warn "Le port 3000 est déjà utilisé sur l'hôte. Je bascule FRONTEND_PORT=3001 pour cette exécution."
    export FRONTEND_PORT=3001
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    err "Docker est introuvable. Installez Docker puis réessayez."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    err "Docker Compose v2 est requis (commande : docker compose)."
    exit 1
  fi
}

ensure_env_hint() {
  if [[ ! -f "${ROOT}/.env" ]] && [[ -f "${ROOT}/.env.example" ]]; then
    warn "Aucun fichier .env à la racine. Copiez .env.example vers .env et adaptez SECRET_KEY, etc."
  fi
}

ensure_env_prod_hint() {
  if [[ ! -f "${ROOT}/.env.prod" ]]; then
    warn "Aucun fichier .env.prod à la racine. Copiez .env.prod et adaptez les valeurs pour la prod VPS."
  fi
}

ensure_script_exec() {
  chmod +x "${ROOT}/scripts/deploy.sh" "${ROOT}/scripts/backup.sh" 2>/dev/null || true
}

load_dotenv() {
  if [[ ! -f "${ROOT}/.env" ]]; then
    return 0
  fi
  set +u
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
  set -u
}

compose_dev() {
  docker compose "${COMPOSE_DEV[@]}" "$@"
}

compose_vps_prod() {
  local env_file=()
  if [[ -f "${ROOT}/.env.prod" ]]; then
    env_file=(--env-file "${ROOT}/.env.prod")
  fi
  docker compose "${env_file[@]}" "${COMPOSE_VPS[@]}" "$@"
}

action_up_prod() {
  ensure_env_prod_hint
  info "Démarrage stack **production** (docker-compose.prod.yml — VPS / préprod)…"
  if [[ ! -f "${ROOT}/.env.prod" ]]; then
    warn "Pas de .env.prod : variables depuis l'environnement ou .env à la racine du projet."
  fi
  compose_vps_prod up -d --build
  info "Mode Nginx Proxy Manager : le service nginx est exposé en interne (proxy network), TLS géré par NPM."
}

action_up_dev() {
  info "Démarrage stack **développement** (frontend : pnpm dev + hot reload)…"
  compose_dev up -d --build
  info "API : http://localhost:${NGINX_PORT:-80} — Frontend dev : http://localhost:${FRONTEND_PORT:-3000}"
}

action_down() {
  info "Arrêt (dev + prod compose)…"
  compose_dev down --remove-orphans 2>/dev/null || true
  compose_vps_prod down --remove-orphans 2>/dev/null || true
}

action_down_with_volumes() {
  warn "Cette action supprime les volumes Docker (Postgres, media, static, etc.)."
  read -r -p "Confirmer arrêt + suppression volumes (dev + prod) ? tapez 'OUI' : " c
  if [[ "${c:-}" != "OUI" ]]; then
    info "Annulé."
    return 0
  fi
  info "Arrêt + suppression volumes (dev + prod compose)…"
  compose_dev down -v --remove-orphans 2>/dev/null || true
  compose_vps_prod down -v --remove-orphans 2>/dev/null || true
  info "OK. Les volumes de ce projet ont été supprimés."
}

action_fix_postgres_version_hint() {
  info "Diagnostic Postgres (local) :"
  info "- Si le conteneur postgres crash avec 'initialized by PostgreSQL version 15' → vous avez un volume pgdata v15."
  info "- Solutions :"
  info "  A) Reset volumes (menu: Reset complet) si vous n'avez pas besoin des données."
  info "  B) Ou remettre POSTGRES_IMAGE=postgres:15-alpine dans .env pour garder les données."
}

action_ps() {
  info "Conteneurs du projet (dev) :"
  compose_dev ps -a
}

action_ps_vps() {
  info "Conteneurs du projet (prod VPS) :"
  compose_vps_prod ps -a
}

action_logs() {
  read -r -p "Service (django, nginx, frontend, postgres, redis, celery_worker) ou Entrée pour tous : " svc
  if [[ -n "${svc}" ]]; then
    compose_dev logs -f --tail=200 "${svc}"
  else
    compose_dev logs -f --tail=100
  fi
}

action_logs_vps() {
  read -r -p "Service (django_wsgi, django_asgi, nginx, frontend_wistitii, postgres, redis, celery_worker, celery_beat) ou Entrée pour tous : " svc
  if [[ -n "${svc}" ]]; then
    compose_vps_prod logs -f --tail=200 "${svc}"
  else
    compose_vps_prod logs -f --tail=200
  fi
}

action_rebuild_prod_nocache() {
  info "Rebuild frontend sans cache, puis up (dev)…"
  compose_dev build --no-cache frontend
  compose_dev up -d
}

action_rebuild_vps_frontend_nocache() {
  info "Rebuild frontend sans cache, puis up (prod VPS)…"
  compose_vps_prod build --no-cache frontend_wistitii
  compose_vps_prod up -d
}

action_migrate() {
  info "Migrations Django…"
  compose_dev exec django python manage.py migrate --noinput
}

action_createsuperuser() {
  info "Création superutilisateur Django…"
  compose_dev exec django python manage.py createsuperuser
}

action_shell_django() {
  compose_dev exec django python manage.py shell
}

action_migrate_vps() {
  info "Migrations Django (prod VPS)…"
  compose_vps_prod exec django_wsgi python manage.py migrate --noinput
}

action_collectstatic_vps() {
  info "Collect static (prod VPS)…"
  compose_vps_prod exec django_wsgi python manage.py collectstatic --noinput
}

action_createsuperuser_vps() {
  info "Création superutilisateur Django (prod VPS)…"
  compose_vps_prod exec django_wsgi python manage.py createsuperuser
}

action_shell_django_vps() {
  compose_vps_prod exec django_wsgi python manage.py shell
}

action_deploy_vps() {
  ensure_env_prod_hint
  ensure_script_exec
  info "Déploiement VPS (git pull + build + migrate + collectstatic + restart)…"
  "${ROOT}/scripts/deploy.sh"
}

action_backup_vps() {
  ensure_env_prod_hint
  ensure_script_exec
  info "Backup VPS (pg_dump -> upload -> rétention)…"
  # utilise .env.prod si présent (préféré) sinon .env
  if [[ -f "${ROOT}/.env.prod" ]]; then
    set -a; source "${ROOT}/.env.prod"; set +a
  else
    set -a; source "${ROOT}/.env"; set +a
  fi
  "${ROOT}/scripts/backup.sh"
}

action_check_prod() {
  ensure_env_prod_hint
  if ! have python3; then
    err "python3 introuvable."
    return 1
  fi
  if [[ ! -f "${ROOT}/check_prod.py" ]]; then
    err "check_prod.py introuvable."
    return 1
  fi
  info "Lancement check_prod.py (pensez à exporter BASE_URL/WS_URL/REDIS_URL si besoin)…"
  python3 "${ROOT}/check_prod.py" || true
}

action_certbot_first_issue() {
  warn "Action obsolète: en mode Nginx Proxy Manager, le certificat TLS est géré par NPM."
  warn "Configurez le Proxy Host NPM vers photoevent-nginx:80 avec WebSocket et Let's Encrypt."
  return 0
}

show_menu() {
  info ""
  info "======== PhotoEvent — Menu Docker ========"
  info "  1) DEV (docker-compose.dev.yml — hot reload)"
  info "  2) PROD (docker-compose.prod.yml — .env.prod si présent)"
  info "  3) STOP (dev + prod compose)"
  info "  4) STOP + SUPPRIMER VOLUMES (dev + prod)"
  info "  5) Suivi DEV (etat des conteneurs)"
  info "  6) Suivi PROD (etat des conteneurs)"
  info "  7) Logs DEV"
  info "  8) Logs PROD"
  info "  9) Creer superuser DEV"
  info " 10) Creer superuser PROD"
  info "  0) Quitter"
  info "=========================================="
}

require_docker
ensure_env_hint
load_dotenv
ensure_ports

# Non interactif : ./scripts/stack.sh dev|prod|down|down-v|ps-dev|ps-prod|logs-dev|logs-prod|superuser-dev|superuser-prod
case "${1:-}" in
  prod)
    action_up_prod
    exit 0
    ;;
  dev)
    action_up_dev
    exit 0
    ;;
  down)
    action_down
    exit 0
    ;;
  down-v|reset)
    action_down_with_volumes
    exit 0
    ;;
  ps-dev)
    action_ps
    exit 0
    ;;
  ps-prod)
    action_ps_vps
    exit 0
    ;;
  logs-dev)
    action_logs
    exit 0
    ;;
  logs-prod)
    action_logs_vps
    exit 0
    ;;
  superuser-dev)
    action_createsuperuser
    exit 0
    ;;
  superuser-prod)
    action_createsuperuser_vps
    exit 0
    ;;
esac

while true; do
  show_menu
  read -r -p "Votre choix : " choice
  case "${choice}" in
    1) action_up_dev ;;
    2) action_up_prod ;;
    3) action_down ;;
    4) action_down_with_volumes ;;
    5) action_ps ;;
    6) action_ps_vps ;;
    7) action_logs ;;
    8) action_logs_vps ;;
    9) action_createsuperuser ;;
    10) action_createsuperuser_vps ;;
    0)
      info "Au revoir."
      exit 0
      ;;
    *)
      err "Choix invalide : ${choice}"
      ;;
  esac
  read -r -p "Entrée pour revenir au menu…" _
done
