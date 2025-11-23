# Columbus - Quick Start Guide

Get Columbus running locally in 10 minutes!

## Prerequisites

Install these first:
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (recommended) OR [Redis](https://redis.io/download)

## Step 1: Get API Keys (5 minutes)

### Required:

1. **Supabase** (Free):
   - Go to [supabase.com](https://supabase.com)
   - Create account → New Project
   - Get: URL, anon key, service_role key

2. **OpenAI** (Paid):
   - Go to [platform.openai.com](https://platform.openai.com/api-keys)
   - Create API key
   - Add billing info (required)

### Optional (for full functionality):

3. **Anthropic** - [console.anthropic.com](https://console.anthropic.com/)
4. **Google AI** - [ai.google.dev](https://ai.google.dev/)
5. **Stripe** - [dashboard.stripe.com](https://dashboard.stripe.com/)
6. **Resend** - [resend.com](https://resend.com/)

## Step 2: Clone & Install (2 minutes)

```bash
# Clone the repository
cd columbus

# Install frontend dependencies
cd frontend
npm install

# Install worker dependencies
cd ../worker
npm install
```

## Step 3: Setup Database (3 minutes)

```bash
cd supabase

# Option A: Use Supabase CLI (recommended)
npx supabase db push

# Option B: Manual (if CLI doesn't work)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy content from migrations/001_initial_schema.sql
# 3. Paste and run
```

## Step 4: Configure Environment (2 minutes)

### Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env` - **Minimum required**:
```env
NUXT_PUBLIC_SUPABASE_URL=your_supabase_url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your-key
REDIS_URL=redis://localhost:6379
WORKER_API_URL=http://localhost:3001
WORKER_API_SECRET=any_random_string_here
```

### Worker

Choose **Option A** (Docker) or **Option B** (Local):

#### Option A: Docker (Recommended - Easiest!)

```bash
# Copy environment file
cp .env.docker .env

# Edit .env with your API keys
```

Edit `.env`:
```env
WORKER_API_SECRET=same_as_frontend
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=sk-your-key
# Redis URL is auto-configured in docker-compose.yml
```

#### Option B: Local Node.js

```bash
cd worker
cp .env.example .env
```

Edit `.env` - **Minimum required**:
```env
API_SECRET=same_as_frontend
REDIS_URL=redis://localhost:6379
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=sk-your-key
```

## Step 5: Start Redis & Worker

### Option A: Docker Compose (Recommended) ⭐

**One command starts everything!**

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f worker

# Both Redis and Worker are now running!
# Worker: http://localhost:3001
# Redis: localhost:6379
```

### Option B: Local Installation

#### Start Redis First

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo service redis-server start

# Windows (WSL required)
# Follow WSL setup, then:
sudo service redis-server start

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

#### Then Start Worker

```bash
cd worker
npm run dev

# Worker runs on http://localhost:3001
```

## Step 6: Start Frontend (1 minute)

```bash
# In a new terminal
cd frontend
npm run dev

# Frontend runs on http://localhost:3000
```

## Step 7: Test It Out! 🎉

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Start Free Audit"
3. Sign up with email/password
4. Fill in company details
5. You're in! 🎉

## What Works Now?

✅ Landing page with waitlist
✅ User authentication
✅ Dashboard with metrics
✅ Organization management
✅ Competitor tracking
✅ Fix recommendations
✅ Settings page

## What Needs API Keys?

⚠️ **Visibility Scanning** - Requires:
- OpenAI API key (minimum)
- Other AI APIs (optional but recommended)

⚠️ **Payments** - Requires:
- Stripe account and keys

⚠️ **Emails** - Requires:
- Resend API key

## Testing Visibility Scan

To test the scan feature:

1. Make sure worker is running:
   - Docker: `docker-compose ps` (should show worker as "Up")
   - Local: Check terminal running `npm run dev`

2. Test health endpoint:
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

3. Go to Dashboard → Click "Run New Visibility Scan"
4. Watch worker logs for progress:
   - Docker: `docker-compose logs -f worker`
   - Local: Check terminal window
5. Refresh dashboard to see results

## Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
cd frontend
rm -rf .nuxt node_modules
npm install
npm run dev
```

### Worker can't connect to Redis

**If using Docker:**
```bash
# Check Redis is running
docker-compose ps redis
# Should show "Up"

# Restart if needed
docker-compose restart redis
```

**If using local Redis:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it:
brew services start redis  # macOS
sudo service redis-server start  # Linux
```

### Docker issues

```bash
# View all logs
docker-compose logs -f

# Rebuild everything
docker-compose down
docker-compose up -d --build

# Clear everything and start fresh
docker-compose down -v  # WARNING: Deletes Redis data!
docker-compose up -d --build
```

### Database errors
- Verify Supabase credentials in `.env`
- Check migrations ran successfully
- Check Supabase dashboard logs

### "OpenAI API key invalid"
- Verify key is correct (starts with `sk-`)
- Check billing is enabled in OpenAI dashboard
- Try regenerating the key

### Worker exits immediately

**Docker:**
```bash
docker-compose logs worker
# Look for error messages
```

**Local:**
Check the terminal for error messages.

Common issues:
- Missing environment variables
- Invalid API keys
- Can't connect to Supabase
- Can't connect to Redis

## Next Steps

1. **Add more AI APIs** for better scanning
2. **Set up Stripe** for payments
3. **Configure Resend** for emails
4. **Customize branding** (logo, colors)
5. **Deploy to production** (see DEPLOYMENT.md)

## Quick Commands Reference

### Docker Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f worker
docker-compose logs -f redis

# Restart worker after code changes
docker-compose up -d --build worker

# Check status
docker-compose ps

# Stop and remove all data
docker-compose down -v
```

### Frontend Commands

```bash
cd frontend
npm run dev          # Start development
npm run build        # Build for production
npm run preview      # Preview production build
```

### Worker Commands (Local)

```bash
cd worker
npm run dev          # Start development
npm run build        # Build for production
npm start            # Run production
```

### Database Commands

```bash
cd supabase
npx supabase db push        # Run migrations
npx supabase db reset       # Reset database
npx supabase status         # Check status
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         http://localhost:3000           │
│           Frontend (Nuxt 4)             │
└────────────┬────────────────────────────┘
             │
             ├──────────────┐
             │              │
             ▼              ▼
    ┌────────────────┐  ┌────────────────┐
    │   Supabase     │  │    Worker      │
    │   Database     │  │ localhost:3001 │
    └────────────────┘  └───────┬────────┘
                                │
                                ▼
                        ┌────────────────┐
                        │     Redis      │
                        │ localhost:6379 │
                        └────────────────┘
```

## Development Tips

### Docker Development

💡 **Hot reload**: Not enabled by default. For hot reload:

```yaml
# Create docker-compose.override.yml
version: '3.8'
services:
  worker:
    volumes:
      - ./worker/src:/app/src
    command: npm run dev
```

Then restart: `docker-compose up -d`

### Local Development

💡 **Faster iteration**: Run frontend and worker locally, Docker for Redis only:

```bash
# Start only Redis
docker-compose up -d redis

# Run worker locally
cd worker && npm run dev

# Run frontend locally
cd frontend && npm run dev
```

### Switching Between Docker and Local

**To Docker:**
```bash
# Stop local worker
# Ctrl+C in worker terminal

# Update worker/.env
REDIS_URL=redis://redis:6379

# Start Docker
docker-compose up -d
```

**To Local:**
```bash
# Stop Docker worker
docker-compose stop worker

# Update worker/.env
REDIS_URL=redis://localhost:6379

# Start local worker
cd worker && npm run dev
```

## Getting Help

Check these files for more info:
- `README.md` - Full setup guide
- `DOCKER_SETUP.md` - Docker details
- `DEPLOYMENT.md` - Production deployment
- Frontend code - `frontend/` directory
- Worker code - `worker/` directory

## Pro Tips

💡 **Use Docker for consistency** - Same environment as production

💡 **Set test mode** Stripe keys during development

💡 **Set low rate limits** for AI APIs during testing

💡 **Monitor API usage** closely (can get expensive!)

💡 **Use Redis desktop client** to debug queues (e.g., [RedisInsight](https://redis.io/insight/))

💡 **Check Supabase logs** for auth issues

💡 **Use Docker logs** for debugging: `docker-compose logs -f`

## What's Different with Docker?

| Feature | Docker | Local |
|---------|--------|-------|
| **Setup** | One command | Multiple steps |
| **Redis** | Automatic | Manual install |
| **Consistency** | ✅ Same as production | May differ |
| **Isolation** | ✅ Containerized | Uses system |
| **Rebuild Speed** | Slower | Faster |
| **Hot Reload** | Manual setup | Built-in |

## Recommended Setup

🏆 **Best for beginners**: Docker Compose (everything in one command)

🏆 **Best for active development**: Local worker + Docker Redis (faster iteration)

🏆 **Best for production simulation**: Full Docker setup

---

**Ready to launch?** See `DEPLOYMENT.md` for production deployment guide.

**Questions?** Review the README.md for detailed documentation.

**Docker help?** See `DOCKER_SETUP.md` for complete Docker guide.
