# JobShield AI — Production Deployment Guide
## Oracle Cloud Always Free VM & Docker Compose

This guide provides step-by-step instructions for deploying JobShield AI on an Oracle Cloud Always Free VM using Docker Compose at zero infrastructure cost.

---

## Target Architecture

```
Internet
   │
   ▼
[Nginx] (Port 80 / 443 Public Gateway)
   ├── React Web SPA (Static Build)
   └── /api/v1/* ──► [Flask REST API (Gunicorn WSGI :8000)] (Internal)
                          ├──► [Node.js Express ML Service :5000] (Internal)
                          └──► [PostgreSQL Database :5432] (Internal Volume)
```

---

## 1. Cloud VM Setup (Oracle Cloud Always Free)

1. Sign up for an **Oracle Cloud Free Tier** account.
2. Navigate to **Compute** -> **Instances** -> **Create Instance**.
3. Image: **Ubuntu 22.04 LTS** or **Debian 12**.
4. Shape: **VM.Standard.A1.Flex** (Ampere ARM, up to 4 oCPU / 24 GB RAM free) or **VM.Standard.E2.1.Micro** (x86, 1 oCPU / 1 GB RAM free).
5. Network / Security List (Ingress Firewall Rules):
   - **Allow**: Port `22` (SSH), Port `80` (HTTP), Port `443` (HTTPS).
   - **DO NOT EXPOSE**: Port `5000` (ML), `5432` (Postgres), `8000` (Backend API).

---

## 2. Server Environment Initialization

SSH into your VM:

```bash
ssh ubuntu@YOUR_SERVER_PUBLIC_IP
```

Install Docker and Docker Compose:

```bash
# Update system packages
sudo apt-get update && sudo apt-get install -y curl git docker.io docker-compose-v2

# Add ubuntu user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. Repository Deployment & Configuration

Clone the repository to the VM:

```bash
git clone https://github.com/your-org/job-scam-detector.git
cd job-scam-detector
```

Create production environment file:

```bash
cp .env.example .env
```

Generate secure 256-bit random keys for production:

```bash
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

Edit `.env` with production parameters:

```env
# Server Environment
FLASK_ENV=production
NODE_ENV=production

# Security Keys (Replace with your generated random keys!)
SECRET_KEY=e8f9a2c...your_generated_secret_key...
JWT_SECRET_KEY=b4d1e8f...your_generated_jwt_key...
JWT_EXPIRATION_MINUTES=60

# Database Configuration (Internal Docker Compose Postgres)
POSTGRES_USER=jobshield_user
POSTGRES_PASSWORD=jobshield_secure_prod_password
POSTGRES_DB=jobshield_db
DATABASE_URL=postgresql://jobshield_user:jobshield_secure_prod_password@postgres:5432/jobshield_db

# Microservice Networking
NODE_ML_URL=http://ml:5000/api/v1/analyze

# Gateway & CORS (Set your VM IP or Domain)
CORS_ORIGINS=http://YOUR_SERVER_PUBLIC_IP,https://yourdomain.com
VITE_API_URL=/api/v1
```

---

## 4. Build and Start Container Stack

Launch all containers in detached mode:

```bash
docker compose up -d --build
```

Verify container status:

```bash
docker compose ps
```

Expected output:
- `jobshield-web`: Running (healthy), port `80:80`
- `jobshield-backend`: Running (healthy), internal port `8000`
- `jobshield-ml`: Running (healthy), internal port `5000`
- `jobshield-postgres`: Running (healthy), internal port `5432`

---

## 5. PostgreSQL Schema Migration

Run Alembic migrations to create database tables on PostgreSQL:

```bash
docker compose exec backend flask db upgrade
```

---

## 6. End-to-End Functional Verification

Check container log streams:

```bash
# View backend logs
docker compose logs backend

# View ML classifier logs
docker compose logs ml

# View web gateway logs
docker compose logs web
```

Verification Checklist:
1. **Frontend**: Open `http://YOUR_SERVER_PUBLIC_IP` in browser -> Landing page loads.
2. **API Health**: Test `http://YOUR_SERVER_PUBLIC_IP/api/v1/health` -> Returns `{"status":"healthy","success":true}`.
3. **Authentication**: Register a new user account & log in -> JWT token issued.
4. **Job Analysis**: Paste job description -> Returns ML + Rule risk score.
5. **Scan History**: Navigate to `/history` -> Displays past scans.
6. **PDF/CSV Exports**: Export scan report -> Downloads valid `.pdf` and `.csv`.
7. **Extension Download**: Download extension ZIP from dashboard -> Obtains `jobshield-guard-extension.zip`.

---

## 7. Extension Production Build

When deploying for production users:

```bash
EXTENSION_API_URL=https://yourdomain.com/api/v1 npm run build:extension
```

The resulting `apps/web/public/jobshield-guard-extension.zip` will automatically target your production API URL without any hardcoded localhost references.

---

## 8. HTTPS Setup (Optional / Recommended)

Install Certbot for automated SSL/TLS certificates:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Nginx will automatically handle SSL termination on port 443 and proxy secure traffic to your backend.
