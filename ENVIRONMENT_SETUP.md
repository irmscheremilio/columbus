# Quick Environment Setup Guide

**TL;DR:** You need different `.env` files depending on how you run Columbus.

## 🚀 Quick Decision

### Using Docker? (Recommended)
```bash
# 1. Root level
cp .env.docker .env
# Edit with your API keys

# 2. Frontend only
cd frontend
cp .env.example .env
# Edit with your API keys

# You DON'T need worker/.env! ✅
```

### Running Locally?
```bash
# 1. Frontend
cd frontend
cp .env.example .env
# Edit with your API keys

# 2. Worker
cd worker
cp .env.example .env
# Edit with your API keys

# You DON'T need root .env! ✅
```

## 📁 Which Files You Need

| Setup Method | Root .env | frontend/.env | worker/.env |
|--------------|-----------|---------------|-------------|
| **Docker Compose** | ✅ YES | ✅ YES | ❌ NO |
| **Local (no Docker)** | ❌ NO | ✅ YES | ✅ YES |
| **Hybrid (Redis in Docker)** | ❌ NO | ✅ YES | ✅ YES |

## ✅ Why This Makes Sense

### Docker Setup
- `docker-compose.yml` reads from root `.env`
- Passes variables to worker container
- Worker doesn't need its own `.env` file
- Cleaner: one config file for Docker services

### Local Setup
- Worker reads from `worker/.env` directly
- Frontend reads from `frontend/.env` directly
- No Docker, no root `.env` needed
- Each service manages its own config

## 🔧 The Files Explained

### Root `.env` (Docker only)
```env
# This configures the worker CONTAINER
API_SECRET=...
SUPABASE_URL=...
OPENAI_API_KEY=...
# etc.
```

Used by: `docker-compose.yml` → worker container

### `frontend/.env` (Always needed)
```env
# Frontend always needs this
NUXT_PUBLIC_SUPABASE_URL=...
WORKER_API_URL=http://localhost:3001
# etc.
```

Used by: Nuxt frontend (both Docker and local)

### `worker/.env` (Local only)
```env
# Worker uses this when running locally
API_SECRET=...
REDIS_URL=redis://localhost:6379
# etc.
```

Used by: Worker when running `npm run dev`

## 🎯 Common Setups

### 1. Full Docker (Simplest)
```bash
.env                    # ✅ Configure this
frontend/.env           # ✅ Configure this
worker/.env             # ❌ Not needed

# Start:
docker-compose up -d
cd frontend && npm run dev
```

### 2. Full Local (Most flexible)
```bash
.env                    # ❌ Not needed
frontend/.env           # ✅ Configure this
worker/.env             # ✅ Configure this

# Start:
brew services start redis
cd worker && npm run dev
cd frontend && npm run dev
```

### 3. Hybrid (Best for development)
```bash
.env                    # ❌ Not needed
frontend/.env           # ✅ Configure this
worker/.env             # ✅ Configure this

# Start:
docker-compose up -d redis  # Only Redis
cd worker && npm run dev    # Worker local
cd frontend && npm run dev  # Frontend local
```

## 📝 Quick Setup Checklist

### Docker Setup ✅
- [ ] Copy `.env.docker` to `.env` (root)
- [ ] Edit root `.env` with API keys
- [ ] Copy `frontend/.env.example` to `frontend/.env`
- [ ] Edit `frontend/.env` with API keys
- [ ] Run `docker-compose up -d`
- [ ] Run `cd frontend && npm run dev`

### Local Setup ✅
- [ ] Copy `worker/.env.example` to `worker/.env`
- [ ] Edit `worker/.env` with API keys
- [ ] Copy `frontend/.env.example` to `frontend/.env`
- [ ] Edit `frontend/.env` with API keys
- [ ] Start Redis: `brew services start redis`
- [ ] Run `cd worker && npm run dev`
- [ ] Run `cd frontend && npm run dev`

## ⚠️ Important Notes

### Same Values, Different Files

These must match across files:
- API secret must be the same in frontend and worker
- Supabase URL and keys must be the same
- All AI API keys must be the same

### Docker vs Local Redis URLs

**Docker:** `REDIS_URL=redis://redis:6379` (service name)
**Local:** `REDIS_URL=redis://localhost:6379` (localhost)

The docker-compose.yml automatically sets this correctly!

### Don't Commit Secrets

These are in `.gitignore`:
- `.env`
- `frontend/.env`
- `worker/.env`

Safe to commit (templates only):
- `.env.docker`
- `frontend/.env.example`
- `worker/.env.example`

## 🤔 FAQ

**Q: Why not use one .env for everything?**
A: Different parts need different configs. Frontend and worker need different settings. Keeping them separate is cleaner.

**Q: Can I use worker/.env with Docker?**
A: Yes! Change docker-compose.yml to `env_file: ./worker/.env`. But then you need to manage REDIS_URL differently.

**Q: I want to switch between Docker and Local**
A: Keep both `.env` and `worker/.env` configured. Use `.env` for Docker, `worker/.env` for local. Just start the one you want.

**Q: Which is better: Docker or Local?**
A:
- **Docker**: Easier, consistent, same as production
- **Local**: Faster iteration, hot reload works better
- **Best**: Hybrid - Redis in Docker, worker local

---

**Still confused?**
- Read `QUICK_START.md` for step-by-step setup
- Read `ENV_SETUP_GUIDE.md` for detailed explanation
- Read `DOCKER_SETUP.md` for Docker-specific help
