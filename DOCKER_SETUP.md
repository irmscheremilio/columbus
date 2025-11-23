# Columbus Docker Setup Guide

This guide covers running Columbus worker with Docker, both locally and on Railway.

## 🐳 Local Development with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- Docker Compose (included with Docker Desktop)

### Quick Start

1. **Copy environment file**:
```bash
cp .env.docker .env
```

2. **Edit `.env` file** with your API keys

3. **Start everything**:
```bash
docker-compose up -d
```

4. **Check status**:
```bash
docker-compose ps
docker-compose logs -f worker
```

5. **Stop everything**:
```bash
docker-compose down
```

### What Gets Started

- **Redis** on `localhost:6379`
- **Worker** on `localhost:3001`

### Useful Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f worker
docker-compose logs -f redis

# Restart worker only
docker-compose restart worker

# Rebuild after code changes
docker-compose up -d --build worker

# Stop services
docker-compose down

# Stop and remove volumes (clears Redis data)
docker-compose down -v

# Check health
curl http://localhost:3001/health
docker-compose ps
```

### Development Workflow

**Option A: Docker for Everything** (Consistent with production)
```bash
# 1. Make code changes in worker/src/

# 2. Rebuild and restart
docker-compose up -d --build worker

# 3. Check logs
docker-compose logs -f worker
```

**Option B: Mixed (Docker Redis + Local Worker)** (Faster iteration)
```bash
# 1. Start only Redis
docker-compose up -d redis

# 2. Run worker locally
cd worker
npm run dev

# 3. Update REDIS_URL in worker/.env
# REDIS_URL=redis://localhost:6379
```

## 🚂 Railway Deployment

Railway provides **managed Redis** as a separate service. This is the recommended approach.

### Option 1: Managed Redis (Recommended)

#### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your Columbus repository

#### Step 2: Add Redis Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. Redis will be provisioned automatically

#### Step 3: Configure Worker Service

1. Click on your worker service
2. Go to **Settings** → **Variables**
3. Add environment variables:

```bash
# Railway automatically provides these:
# - REDIS_URL (from Redis service)
# - RAILWAY_ENVIRONMENT

# You need to add these:
PORT=3001
NODE_ENV=production
API_SECRET=your_secret

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
PERPLEXITY_API_KEY=...
RESEND_API_KEY=re_...
```

4. Railway will automatically connect Redis via `REDIS_URL`

#### Step 4: Configure Build Settings

In **Settings**:

- **Root Directory**: `worker`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Dockerfile Path**: Leave empty (Railway will use default)

Or create `railway.toml`:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

#### Step 5: Deploy

1. Railway will automatically deploy
2. Check logs for any errors
3. Get the public URL from **Settings** → **Networking**
4. Update `WORKER_API_URL` in Vercel (frontend)

### Option 2: Docker with External Redis

If you prefer using Docker on Railway with an external Redis:

1. **Push Docker image to Railway**:

Railway will automatically detect the Dockerfile in `worker/` directory.

2. **Use external Redis**:

Add Redis from [Upstash](https://upstash.com/) or another provider:

```bash
# Set in Railway environment variables
REDIS_URL=rediss://default:password@your-redis-url:6379
```

## 🔍 Monitoring

### Health Checks

**Local**:
```bash
curl http://localhost:3001/health
```

**Railway**:
```bash
curl https://your-worker-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-11-23T..."}
```

### Logs

**Docker Compose**:
```bash
docker-compose logs -f worker
```

**Railway**:
1. Go to your worker service
2. Click **"Logs"** tab
3. Filter by level (error, warn, info)

### Redis Monitoring

**Docker Compose**:
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check keys
KEYS *

# Monitor commands
MONITOR

# Get stats
INFO stats
```

**Railway Redis**:
1. Click on Redis service
2. View **"Metrics"** tab
3. Check memory usage, connections

## 🐛 Troubleshooting

### Worker can't connect to Redis

**Docker Compose**:
```bash
# Check Redis is running
docker-compose ps redis

# Check Redis health
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check worker logs
docker-compose logs worker
```

**Railway**:
- Verify Redis service is active
- Check `REDIS_URL` environment variable is set
- Look for connection errors in logs

### Worker exits immediately

**Check logs**:
```bash
docker-compose logs worker
```

Common causes:
- Missing environment variables
- Invalid API keys
- Can't connect to Supabase
- Can't connect to Redis

### Docker build fails

```bash
# Clear cache and rebuild
docker-compose build --no-cache worker
docker-compose up -d worker
```

### Port already in use

```bash
# Stop existing containers
docker-compose down

# Or change ports in docker-compose.yml:
ports:
  - "3002:3001"  # Change 3001 to 3002
```

## 📊 Resource Limits

### Docker Compose (Local)

By default, Docker Desktop allocates:
- CPU: 2 cores
- Memory: 2GB
- Swap: 1GB

Adjust in Docker Desktop → Settings → Resources

### Railway

Default limits:
- **Hobby Plan**: $5 credit/month, ~500MB RAM
- **Pro Plan**: $20/month base, usage-based after

Set limits in Railway:
1. Go to service settings
2. Under **Resources**
3. Set Memory limit (e.g., 512MB)

## 🚀 Performance Tips

### Docker

1. **Use multi-stage builds** (already configured)
2. **Minimize layers** in Dockerfile
3. **Use .dockerignore** to exclude unnecessary files
4. **Mount volumes** for development:

```yaml
# docker-compose.yml (development override)
services:
  worker:
    volumes:
      - ./worker/src:/app/src
    command: npm run dev
```

### Railway

1. **Use managed Redis** (better performance)
2. **Enable auto-scaling** (Pro plan)
3. **Monitor resource usage** in dashboard
4. **Set appropriate memory limits**

## 🔄 CI/CD with Docker

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Worker

on:
  push:
    branches: [main]
    paths:
      - 'worker/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          cd worker
          docker build -t columbus-worker .

      - name: Deploy to Railway
        run: |
          # Railway CLI deployment
          railway up
```

## 📝 Environment Variables Reference

### Required for Worker

```bash
PORT=3001
NODE_ENV=production
API_SECRET=your_secret_key

# Redis
REDIS_URL=redis://redis:6379  # Docker Compose
# or
REDIS_URL=rediss://...         # Railway/Upstash (SSL)

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# AI APIs (at least OpenAI required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
PERPLEXITY_API_KEY=pplx-...

# Email
RESEND_API_KEY=re_...
```

## 🎯 Best Practices

### Security

1. **Never commit `.env` files**
2. **Use Railway's secret variables**
3. **Rotate API keys regularly**
4. **Use separate keys for dev/prod**

### Reliability

1. **Enable health checks**
2. **Set restart policies**
3. **Monitor error logs**
4. **Set up alerting** (Railway Pro)

### Cost Optimization

1. **Use managed Redis** (cheaper than self-hosted)
2. **Set memory limits** to avoid overages
3. **Monitor usage** regularly
4. **Cache AI responses** where possible
5. **Implement rate limiting**

---

## 🎉 Quick Reference

### Local Development
```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f worker

# Stop
docker-compose down
```

### Railway Deployment
```bash
# 1. Create project
# 2. Add Redis database
# 3. Configure environment variables
# 4. Deploy worker service
# 5. Connect Redis automatically via REDIS_URL
```

### Health Check
```bash
curl http://localhost:3001/health
curl https://your-worker.railway.app/health
```

---

**Recommended Setup**:
- **Local**: Docker Compose (worker + Redis)
- **Production**: Railway (worker service + managed Redis)

This gives you the best of both worlds: consistent local development and managed, scalable production infrastructure.
