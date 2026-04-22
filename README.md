# PhotoEvent — partage de photos d’événements (Django 5 + Next.js 14)

API Django (DRF, JWT, Channels, Celery), frontend **Next.js 14** avec **pnpm**, thème depuis `GET /api/config/`.

## Mode recommandé : tout avec Docker

### Menu interactif (prod / dev)

```bash
cp .env.example .env
# Éditer .env (SECRET_KEY, NEXT_PUBLIC_*, etc.)
chmod +x scripts/stack.sh
./scripts/stack.sh
```

Options en ligne de commande (CI / cron) :

```bash
./scripts/stack.sh prod    # docker-compose.prod.yml (charge .env.prod si présent)
./scripts/stack.sh dev     # docker-compose.dev.yml — pnpm dev + hot reload
./scripts/stack.sh down    # arrêt des deux stacks (dev + prod)
```

Sans le script, équivalent Compose v2 :

```bash
docker compose -f docker-compose.dev.yml up -d --build
# Production (VPS) :
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

**Aller vite avec des images déjà présentes :** les services `postgres`, `redis` et `nginx` utilisent `pull_policy: if_not_present` (pas de re-téléchargement si la couche est locale). Les builds `django` / `frontend` ont `pull: false` pour réutiliser le `FROM` local (`python:3.12-slim`, `node:20-alpine`) au lieu de toujours interroger le registry. Vous pouvez forcer la version déjà sur votre disque via `.env` : `POSTGRES_IMAGE`, `REDIS_IMAGE`, `NGINX_IMAGE`. Activez BuildKit (souvent par défaut) pour les caches `apt` / `pip` / `pnpm` dans les Dockerfiles.

- **API + médias** : [http://localhost](http://localhost) (Nginx → Daphne, `/media/` en local)
- **Frontend** : [http://localhost:3000](http://localhost:3000) (Next.js, image prod `pnpm build` + `node server.js`)

Les variables `NEXT_PUBLIC_*` sont injectées au **runtime** en dev (service `pnpm dev`). En prod, elles sont prises au **build** de l’image : après modification, `docker compose -f docker-compose.prod.yml build --no-cache frontend`.

Créer un superutilisateur : `docker compose -f docker-compose.dev.yml exec django python manage.py createsuperuser`.

### Frontend en dev (hot reload + pnpm) dans Docker

Fichier **`docker-compose.dev.yml`** (stack complète). Utiliser `./scripts/stack.sh` → choix **1**, ou la commande Compose ci‑dessus.

Sur Linux, si le navigateur n’atteint pas l’API, vérifiez que `NEXT_PUBLIC_API_URL` pointe vers l’URL **vue par le navigateur** (souvent `http://localhost` avec Nginx sur le port 80).

## Frontend en local avec pnpm (backend déjà Docker ou non)

Utile pour aller vite sur l’UI sans reconstruire l’image :

```bash
cd frontend
corepack enable
corepack prepare pnpm@9.14.4 --activate
pnpm install
cp .env.local.example .env.local
pnpm dev
```

## API utiles

- **GET** `/api/config/` — public : `{ app_name, color_primary, color_secondary, color_white, logo_url }`
- **PATCH** `/api/config/` — **superuser** + JWT
- **POST** `/api/token/` — `{ "username", "password" }`
- **POST** `/api/token/refresh/` — `{ "refresh" }`

## Stockage (`STORAGE_BACKEND`)

| Valeur   | Comportement |
|----------|----------------|
| `local`  | `MEDIA_ROOT` |
| `s3`     | AWS S3 |
| `r2`     | Cloudflare R2 (`R2_ENDPOINT_URL`) |

## Structure

| Chemin | Rôle |
|--------|------|
| `backend/` | Django, `Dockerfile`, Celery worker |
| `frontend/` | Next.js, `Dockerfile` (pnpm), `Dockerfile.dev` |
| `docker-compose.dev.yml` | Développement : Postgres, Redis, Django runserver, Celery, Nginx, Next (pnpm dev) |
| `docker-compose.prod.yml` | Production : ASGI + Gunicorn, Celery beat, Nginx, TLS, frontend build |
| `scripts/stack.sh` | Menu dev/prod et tâches Docker |

## Backend hors Docker (optionnel)

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DJANGO_SETTINGS_MODULE=config.settings.development
python manage.py migrate && python manage.py runserver
```

Pour l’ASGI : `daphne -b 0.0.0.0 -p 8000 config.asgi:application` — worker Celery : `celery -A config worker -l INFO`.
