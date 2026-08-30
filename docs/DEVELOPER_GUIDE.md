# 🛠️ JobShield AI — Developer Setup & Monorepo Architecture Guide

Welcome to the JobShield AI developer documentation. This document provides setup instructions for local development, monorepo package workspace management, and coding standards.

---

## 📁 1. Monorepo Directory Structure

```text
job-scam-detector/
├── apps/
│   ├── web/               # React + Vite + TypeScript Frontend SPA
│   ├── server/            # FastAPI Python 3.11 + Async SQLAlchemy REST API
│   └── extension/         # Manifest V3 Chrome Extension Package
├── packages/
│   ├── shared/            # Shared TypeScript DTOs & Interfaces (@jobshield/shared)
│   ├── config/            # Shared ESLint, Prettier & TS Configs (@jobshield/config)
│   └── ml/                # Machine Learning & Hybrid AI Engine (@verijob/ml)
├── docker-compose.yml      # Multi-Container Orchestration (PostgreSQL, Redis, Server, Web)
├── package.json           # Root npm Workspace Configuration
└── README.md
```

---

## ⚡ 2. Quickstart Development Setup

### Prerequisites
- Node.js `>=20.0.0`
- npm `>=10.0.0`
- Python `3.11+`
- Docker & Docker Compose (Optional for containerized run)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Shared Packages
```bash
npm run build --workspace=packages/shared
npm run build --workspace=packages/ml
```

### Step 3: Run Development Servers
```bash
# Run Web Application (Vite Dev Server on Port 3000)
npm run dev --workspace=apps/web

# Run FastAPI Server (Uvicorn Dev Server on Port 8000)
cd apps/server
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 3. Running Automated Tests

```bash
# Run Backend Pytest Suite
cd apps/server && pytest

# Run Frontend Typecheck & Lint Audit
npm run typecheck
npm run lint
```
