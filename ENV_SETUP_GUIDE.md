# Environment Variables Setup Guide

Quick reference for where to put environment variables.

## 📁 File Structure

```
columbus/
├── .env                    # Docker Compose (root level)
├── .env.docker            # Template for Docker setup
├── frontend/
│   ├── .env               # Frontend environment variables
│   └── .env.example       # Frontend template
└── worker/
    ├── .env               # Worker (local dev only)
    └── .env.example       # Worker template
```

## 🤔 Which .env File Do I Need?

### Option A: Using Docker Compose (Recommended)

**You need:**
- ✅ `columbus/.env` (root level)
- ✅ `columbus/frontend/.env`
- ❌ `columbus/worker/.env` (NOT needed - Docker Compose handles it)

**Setup:**
```bash
# Root level (for Docker Compose)
cp .env.docker .env
# Edit with your API keys

# Frontend
cd frontend
cp .env.example .env
# Edit with your API keys
```

### Option B: Running Locally (No Docker)

**You need:**
- ❌ `columbus/.env` (NOT needed)
- ✅ `columbus/frontend/.env`
- ✅ `columbus/worker/.env`

**Setup:**
```bash
# Frontend
cd frontend
cp .env.example .env
# Edit with your API keys

# Worker
cd worker
cp .env.example .env
# Edit with your API keys
```

## 📝 Environment Variables Reference

### Root .env (Docker Compose Only)

Used by `docker-compose.yml` to configure the worker container:

```env
# Worker API
WORKER_API_SECRET=your_secret_key

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...

# Email
RESEND_API_KEY=re_...

# Note: REDIS_URL is auto-set in docker-compose.yml
```

### frontend/.env

Always needed (both Docker and local):

```env
# Site
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NUXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# AI APIs (for server-side calls)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...

# Redis & Worker
REDIS_URL=redis://localhost:6379
WORKER_API_URL=http://localhost:3001
WORKER_API_SECRET=your_secret_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
RESEND_API_KEY=re_...
```

### worker/.env (Local Dev Only)

Only needed if running worker locally (not using Docker):

```env
PORT=3001
NODE_ENV=development
API_SECRET=your_secret_key

# Redis
REDIS_URL=redis://localhost:6379

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...

# Email
RESEND_API_KEY=re_...
```

## 🔄 Quick Setup Commands

### Docker Setup
```bash
# 1. Root level
cp .env.docker .env
# Edit: Add your API keys

# 2. Frontend
cd frontend
cp .env.example .env
# Edit: Add your API keys

# 3. Start
cd ..
docker-compose up -d
cd frontend && npm run dev
```

### Local Setup
```bash
# 1. Frontend
cd frontend
cp .env.example .env
# Edit: Add your API keys

# 2. Worker
cd ../worker
cp .env.example .env
# Edit: Add your API keys

# 3. Start Redis
brew services start redis  # or docker-compose up -d redis

# 4. Start Worker
npm run dev

# 5. Start Frontend (new terminal)
cd ../frontend && npm run dev
```

## 🎯 Summary

| Setup | Root .env | frontend/.env | worker/.env |
|-------|-----------|---------------|-------------|
| **Docker** | ✅ Required | ✅ Required | ❌ Not needed |
| **Local** | ❌ Not needed | ✅ Required | ✅ Required |

## 💡 Pro Tips

### Avoid Duplication

If you're switching between Docker and Local, you can:

**Option 1: Use worker/.env for both**

Update `docker-compose.yml`:
```yaml
services:
  worker:
    env_file:
      - ./worker/.env  # Read from worker directory
```

Then you only need:
- ✅ `frontend/.env`
- ✅ `worker/.env`

**Option 2: Use root .env for everything**

Create symlinks:
```bash
# Link worker/.env to root .env
cd worker
ln -s ../.env .env
```

### Keep Values in Sync

Some values need to match:
- `WORKER_API_SECRET` (frontend) = `API_SECRET` (worker)
- `SUPABASE_URL` (both)
- `SUPABASE_SERVICE_KEY` (both)
- All API keys (both)

### Use Different Keys for Dev/Prod

**Development:**
- Stripe: Use test keys (`sk_test_...`)
- OpenAI: Use separate key with lower limits
- Supabase: Use separate project

**Production:**
- Stripe: Use live keys (`sk_live_...`)
- OpenAI: Use production key
- Supabase: Use production project

## 🚨 Security

### Never Commit These Files

Already in `.gitignore`:
```
.env
.env.local
.env.*.local
```

But NOT ignored (safe to commit):
```
.env.example
.env.docker (template only, no secrets)
```

### Rotate Keys Regularly

- Change API secrets every 90 days
- Use different keys per environment
- Revoke old keys when rotating

### Use Strong Secrets

Generate strong API secrets:
```bash
# Generate 32-byte random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ❓ FAQ

### Q: Can I use one .env for everything?

**A:** Yes, but not recommended. Different services need different variables. Better to keep them separate.

### Q: Docker Compose isn't reading my .env file

**A:** Make sure:
1. File is named `.env` (not `.env.docker`)
2. File is in root directory (same as `docker-compose.yml`)
3. No syntax errors in the file
4. Restart: `docker-compose down && docker-compose up -d`

### Q: Worker can't find environment variables in Docker

**A:** Check:
```bash
# View container env vars
docker-compose exec worker env

# Check docker-compose.yml has correct variable names
# They should match what your code expects
```

### Q: Should I use .env or environment: in docker-compose.yml?

**A:**
- Use `.env` file (cleaner, same as production)
- Avoid hardcoding in `docker-compose.yml`
- But you can do both (file + explicit vars)

## 🔍 Troubleshooting

### "Missing required environment variable"

**Docker:**
```bash
# Check .env file exists
ls -la .env

# Check it's being read
docker-compose config

# Restart containers
docker-compose down && docker-compose up -d
```

**Local:**
```bash
# Check worker/.env exists
ls -la worker/.env

# Check frontend/.env exists
ls -la frontend/.env
```

### "Redis connection failed"

**Docker:** Should be `redis://redis:6379` (service name)
**Local:** Should be `redis://localhost:6379` (localhost)

### "Supabase connection failed"

- Verify URL starts with `https://`
- Check keys are complete (no truncation)
- Confirm service_role key (not anon key) for worker

---

**Need help?** Check `QUICK_START.md` for setup instructions or `README.md` for full documentation.
