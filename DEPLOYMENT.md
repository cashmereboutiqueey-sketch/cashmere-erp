# CASHMERE ERP - Docker Deployment Guide

## 🚀 Quick Start

### 1. Clone & Configure

```bash
cd CASHMERE-ERP
cp .env.example .env
# Edit .env with your production values
```

### 2. Build & Start

```bash
docker-compose up -d
```

### 3. Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin**: http://localhost:8000/admin

---

## 📋 Environment Variables

Edit `.env` file before deployment:

### Critical (Must Change):
```env
DJANGO_SECRET_KEY=your-random-50-character-string-here
POSTGRES_PASSWORD=your-secure-database-password
```

### Production URLs:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 🔧 Coolify Deployment

### Method 1: Docker Compose (Recommended)

1. **In Coolify Dashboard:**
   - Create new resource → Docker Compose
   - Connect your Git repository
   - Coolify will auto-detect `docker-compose.yml`

2. **Set Environment Variables:**
   - Go to Environment tab
   - Add all variables from `.env.example`
   - Generate secret key: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`

3. **Deploy:**
   - Click "Deploy"
   - Coolify handles build & deployment automatically

### Method 2: Individual Services

Deploy each service separately in Coolify:

1. **Database:**
   - Add PostgreSQL service
   - Note credentials

2. **Backend:**
   - Add Dockerfile service
   - Path: `./backend`
   - Port: 8000
   - Set environment variables

3. **Frontend:**
   - Add Dockerfile service
   - Path: `./frontend`
   - Port: 3000
   - Set `NEXT_PUBLIC_API_URL` to backend URL

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│   Next.js    │     │    Django    │     │   Database   │
│   Port 3000  │     │   Port 8000  │     │   Port 5432  │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 📦 Services

### PostgreSQL (db)
- **Image**: postgres:15-alpine
- **Volume**: `postgres_data` (persistent)
- **Health Check**: Built-in

### Django Backend (backend)
- **Build**: `./backend/Dockerfile`
- **Features**:
  - Auto migrations on startup
  - Static files collection
  - Gunicorn WSGI server (4 workers)
  - Health checks

### Next.js Frontend (frontend)
- **Build**: `./frontend/Dockerfile`
- **Features**:
  - Multi-stage production build
  - Optimized standalone output
  - Non-root user
  - Health checks

---

## 🛠️ Common Commands

### Start services:
```bash
docker-compose up -d
```

### View logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services:
```bash
docker-compose down
```

### Rebuild after code changes:
```bash
docker-compose up -d --build
```

### Create Django superuser:
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Run migrations:
```bash
docker-compose exec backend python manage.py migrate
```

### Access database:
```bash
docker-compose exec db psql -U cashmere cashmere_erp
```

---

## 🔒 Production Checklist

- [ ] Change `DJANGO_SECRET_KEY` to random string
- [ ] Change `POSTGRES_PASSWORD` to secure password
- [ ] Set `DEBUG=False`
- [ ] Update `ALLOWED_HOSTS` to your domain
- [ ] Update `CORS_ALLOWED_ORIGINS` to your frontend URL
- [ ] Configure SSL/TLS certificates (Coolify handles this)
- [ ] Set up backups for `postgres_data` volume
- [ ] Configure Shopify credentials (if using integration)
- [ ] Create Django superuser
- [ ] Test all critical flows

---

## 📊 Volumes

Persistent data stored in Docker volumes:

- `postgres_data` - Database data
- `static_volume` - Django static files
- `media_volume` - User uploads

**Backup:**
```bash
docker run --rm -v cashmere-erp_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## 🐛 Troubleshooting

### Backend won't start:
```bash
docker-compose logs backend
# Check for migration errors or missing dependencies
```

### Database connection errors:
```bash
# Ensure database is healthy:
docker-compose ps
# Check DATABASE_URL format
```

### Frontend can't connect to backend:
- Verify `NEXT_PUBLIC_API_URL` in .env
- Check CORS settings in Django
- Ensure backend is accessible

### Reset everything:
```bash
docker-compose down -v  # ⚠️ Deletes all data!
docker-compose up -d --build
```

---

## 📞 Need Help?

Check logs first:
```bash
docker-compose logs -f
```

For Coolify-specific issues, refer to Coolify documentation.
