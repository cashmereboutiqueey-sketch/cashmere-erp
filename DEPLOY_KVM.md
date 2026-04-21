# Cashmere ERP — KVM2 Deployment (cashmerebotique.tech)

## Target
- **Server:** Hostinger KVM2
- **Domain:** cashmerebotique.tech
- **Stack:** Nginx + Django (Gunicorn) + Next.js + PostgreSQL 15 — all in Docker

---

## Step 1 — Server bootstrap (run once as root)

```bash
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Docker Compose plugin
apt install -y docker-compose-plugin git curl ufw

# Firewall
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## Step 2 — Clone repo

```bash
git clone https://github.com/YOUR_REPO/cashmere-erp.git /opt/cashmere
cd /opt/cashmere
```

> If no GitHub repo yet: use `scp` or `rsync` to copy the project folder from your Windows machine:
> ```powershell
> # Run this on your Windows machine
> scp -r "C:\Users\abdel\Downloads\Cashmere-ERP-main (2)\Cashmere-ERP-main" root@SERVER_IP:/opt/cashmere
> ```

---

## Step 3 — SSL Certificate (Let's Encrypt)

DNS A record for `cashmerebotique.tech` must point to server IP first.

```bash
apt install -y certbot

certbot certonly --standalone \
  -d cashmerebotique.tech \
  -d www.cashmerebotique.tech \
  --agree-tos \
  --email cashmereboutique.ey@gmail.com \
  --non-interactive

mkdir -p /opt/cashmere/nginx/certs
cp /etc/letsencrypt/live/cashmerebotique.tech/fullchain.pem /opt/cashmere/nginx/certs/
cp /etc/letsencrypt/live/cashmerebotique.tech/privkey.pem   /opt/cashmere/nginx/certs/
chmod 600 /opt/cashmere/nginx/certs/*.pem
```

**Auto-renew (add to crontab):**
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/cashmerebotique.tech/fullchain.pem /opt/cashmere/nginx/certs/ && cp /etc/letsencrypt/live/cashmerebotique.tech/privkey.pem /opt/cashmere/nginx/certs/ && docker compose -f /opt/cashmere/docker-compose.prod.yml --env-file /opt/cashmere/.env.production restart nginx") | crontab -
```

---

## Step 4 — Deploy

```bash
cd /opt/cashmere

# Build & start (first time takes ~5 min)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Watch startup logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 5 — Create admin user

```bash
docker compose -f docker-compose.prod.yml exec backend \
  python manage.py createsuperuser
```

---

## Step 6 — Verify

| URL | Expected |
|-----|----------|
| https://cashmerebotique.tech | Cashmere ERP login page |
| https://cashmerebotique.tech/api/ | Django REST API |
| https://cashmerebotique.tech/admin/ | Django Admin |

---

## Daily operations

```bash
cd /opt/cashmere

# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart backend
docker compose -f docker-compose.prod.yml restart backend

# Database backup
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U cashmere cashmere_erp > backup_$(date +%Y%m%d_%H%M).sql

# Update code & redeploy
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Resource monitor
docker stats
```
