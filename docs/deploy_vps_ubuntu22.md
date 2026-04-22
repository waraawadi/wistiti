## Déploiement production — VPS Ubuntu 22.04 (Docker)

### 0) Pré-requis
- Un VPS Ubuntu 22.04
- Un domaine (ex: `example.com`) pointant vers l’IP du VPS (A record)

### 1) Installation Docker + Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### 2) Cloner le projet

```bash
git clone <TON_REPO_GIT> photoevent
cd photoevent
```

### 3) Créer `.env` production

```bash
cp .env.example .env
nano .env
```

Variables minimales à renseigner:
- `SECRET_KEY`
- `ALLOWED_HOSTS=example.com`
- `CORS_ALLOWED_ORIGINS=https://example.com`
- `PUBLIC_FRONTEND_BASE_URL=https://example.com`
- `PUBLIC_BACKEND_BASE_URL=https://example.com`
- `DATABASE_URL=postgres://photoevent:photoevent@postgres:5432/photoevent` (ou avec tes secrets)
- `REDIS_URL=redis://redis:6379/0`
- `NEXT_PUBLIC_API_URL=https://example.com`
- `NEXT_PUBLIC_WS_URL=wss://example.com`
- Stockage: `STORAGE_BACKEND=local|s3|r2` (+ variables)

### 4) Préparer Nginx SSL

Édite `nginx.prod.conf` et remplace `example.com` (cert paths) par ton domaine.

### 5) Premier lancement (HTTP) + obtention certificat Let's Encrypt

```bash
docker compose -f docker-compose.prod.yml up -d postgres redis django_wsgi django_asgi nginx
```

Commande one-shot pour générer le certificat (webroot):

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot \
  -d example.com --email toi@example.com --agree-tos --no-eff-email
```

Puis redémarre nginx:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### 6) Déploiement complet

```bash
chmod +x scripts/deploy.sh scripts/backup.sh
./scripts/deploy.sh
```

### 7) Backup quotidien (cron 2h)

Installe AWS CLI:

```bash
sudo apt install -y awscli
```

Crontab:

```bash
crontab -e
```

Ajoute:

```cron
0 2 * * * cd /home/<user>/photoevent && /usr/bin/env bash ./scripts/backup.sh >> /home/<user>/photoevent/backup.log 2>&1
```

### 8) Vérification prod

```bash
export BASE_URL=https://example.com
export WS_URL=wss://example.com
export REDIS_URL=redis://127.0.0.1:6379/0
python3 check_prod.py
```

