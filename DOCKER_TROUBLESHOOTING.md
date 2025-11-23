# Docker Build Troubleshooting

Common Docker build and runtime issues and their solutions.

## 🔴 "npm ci requires package-lock.json"

### Error Message
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

### Cause
The `package-lock.json` file is missing from the worker directory.

### Solution

**Option 1: Generate package-lock.json (Recommended)**
```bash
cd worker
npm install
# This creates package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"
```

**Option 2: Use npm install instead**
The Dockerfile now has a fallback:
```dockerfile
RUN npm ci || npm install
```

### Why package-lock.json?
- **Reproducible builds**: Same dependencies every time
- **Faster installs**: npm ci is faster than npm install
- **Security**: Locks exact versions
- **Best practice**: Should be committed to git

## 🔴 "Cannot find module './dist/index.js'"

### Error Message
```
Error: Cannot find module '/app/dist/index.js'
```

### Cause
TypeScript build failed or dist folder not copied.

### Solution

Check build logs:
```bash
docker-compose logs worker
```

Rebuild with no cache:
```bash
docker-compose build --no-cache worker
docker-compose up -d
```

Verify build locally:
```bash
cd worker
npm run build
ls -la dist/
```

## 🔴 "Worker exits immediately"

### Error Message
Container shows "Exited (1)" status

### Debug Steps

**1. Check logs:**
```bash
docker-compose logs worker
```

**2. Common causes:**

**Missing environment variables:**
```bash
# Verify .env file exists
ls -la .env

# Check it has required variables
cat .env
```

**Port already in use:**
```bash
# Check if port 3001 is taken
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Change port in docker-compose.yml:
ports:
  - "3002:3001"
```

**Invalid API keys:**
```bash
# Test API keys
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

**3. Test worker manually:**
```bash
# Run container interactively
docker run -it --entrypoint /bin/sh columbus-worker

# Inside container:
node dist/index.js
```

## 🔴 "Cannot connect to Redis"

### Error Message
```
Error: Redis connection failed
Error: ECONNREFUSED
```

### Solution

**Check Redis is running:**
```bash
docker-compose ps redis
# Should show "Up"
```

**Restart Redis:**
```bash
docker-compose restart redis
```

**Check Redis URL:**
In `.env`, should be:
```env
# NOT localhost when using Docker!
REDIS_URL=redis://redis:6379
```

Note: `redis://redis:6379` uses the Docker service name, not localhost!

**Test Redis connection:**
```bash
docker-compose exec redis redis-cli ping
# Should return "PONG"
```

## 🔴 "Cannot connect to Supabase"

### Error Message
```
Error: Invalid Supabase URL
Error: Authentication failed
```

### Solution

**Check environment variables:**
```bash
# View worker's env vars
docker-compose exec worker env | grep SUPABASE
```

**Verify in .env:**
```env
SUPABASE_URL=https://xxxxx.supabase.co  # Must start with https://
SUPABASE_SERVICE_KEY=eyJ...  # Must be complete (very long)
```

**Test connection:**
```bash
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: YOUR_SERVICE_KEY"
```

## 🔴 "Build is too slow"

### Cause
Installing dependencies takes too long.

### Solutions

**1. Use BuildKit (faster):**
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build
docker-compose build
```

**2. Cache dependencies:**
Already optimized in Dockerfile - dependencies are installed before copying source code.

**3. Reduce image size:**
```bash
# Check image size
docker images columbus-worker

# Should be ~200-300MB
```

**4. Use .dockerignore:**
Already configured - excludes node_modules, dist, etc.

## 🔴 "Permission denied" errors

### Error Message
```
Error: EACCES: permission denied
```

### Cause
Running as wrong user or volume permissions.

### Solution

Dockerfile already uses non-root user. If issues persist:

**Option 1: Run as root (not recommended):**
```dockerfile
# Comment out in Dockerfile:
# USER nodejs
```

**Option 2: Fix volume permissions:**
```bash
# If using volumes, fix permissions
docker-compose exec --user root worker chown -R nodejs:nodejs /app
```

## 🔴 "Memory limit exceeded"

### Error Message
```
Container killed (OOMKilled)
```

### Solution

**Increase Docker memory:**
- Docker Desktop → Settings → Resources
- Increase Memory to 4GB+

**Or set memory limit:**
```yaml
# docker-compose.yml
services:
  worker:
    mem_limit: 1g
    memswap_limit: 2g
```

**Monitor usage:**
```bash
docker stats columbus-worker
```

## 🔴 "Hot reload not working"

### Cause
Hot reload disabled by default in Docker.

### Solution

Create `docker-compose.override.yml`:
```yaml
version: '3.8'
services:
  worker:
    volumes:
      - ./worker/src:/app/src
      - ./worker/tsconfig.json:/app/tsconfig.json
    command: npm run dev
```

Restart:
```bash
docker-compose up -d
```

## 🔴 "Network issues between containers"

### Error Message
```
getaddrinfo ENOTFOUND redis
```

### Solution

**Check network:**
```bash
docker network ls
docker network inspect columbus_columbus-network
```

**Restart everything:**
```bash
docker-compose down
docker-compose up -d
```

**Use service names:**
- Redis: `redis://redis:6379` (NOT localhost)
- Worker: `http://worker:3001` (NOT localhost)

## 🔴 "Build context too large"

### Error Message
```
Sending build context to Docker daemon  500MB
```

### Cause
Too many files being sent to Docker.

### Solution

**Check .dockerignore:**
```bash
cat worker/.dockerignore
```

Should include:
```
node_modules
dist
.git
```

**Clean up:**
```bash
cd worker
rm -rf node_modules dist
```

**Build again:**
```bash
docker-compose build worker
```

## 🔴 "Health check failing"

### Error Message
Container shows "unhealthy" status

### Debug

**Check health endpoint:**
```bash
docker-compose exec worker wget -qO- http://localhost:3001/health
```

**View health check logs:**
```bash
docker inspect columbus-worker | grep -A 20 Health
```

**Test manually:**
```bash
curl http://localhost:3001/health
```

**Disable health check temporarily:**
```dockerfile
# Comment out in Dockerfile:
# HEALTHCHECK ...
```

## 🛠️ General Debugging Tips

### View detailed logs
```bash
# All logs
docker-compose logs -f

# Worker only
docker-compose logs -f worker

# Last 100 lines
docker-compose logs --tail=100 worker

# Follow new logs
docker-compose logs -f --tail=0 worker
```

### Inspect container
```bash
# Get shell inside container
docker-compose exec worker /bin/sh

# Or if container exited:
docker run -it --entrypoint /bin/sh columbus-worker

# Check files:
ls -la /app
cat /app/dist/index.js
```

### Check environment
```bash
# View all env vars
docker-compose exec worker env

# Check specific var
docker-compose exec worker env | grep REDIS_URL
```

### Restart services
```bash
# Restart worker
docker-compose restart worker

# Restart everything
docker-compose restart

# Stop and start (full restart)
docker-compose down
docker-compose up -d
```

### Clean rebuild
```bash
# Remove everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Check resources
```bash
# CPU and memory usage
docker stats

# Detailed info
docker inspect columbus-worker
```

## 📋 Pre-flight Checklist

Before building, verify:

- [ ] `package-lock.json` exists in worker/
- [ ] `.env` file exists and configured
- [ ] Docker Desktop is running
- [ ] No other services on port 3001
- [ ] At least 2GB RAM available
- [ ] Internet connection (for npm install)

## 🆘 Still Having Issues?

### Collect diagnostic info:
```bash
# Docker version
docker --version
docker-compose --version

# System info
docker info

# Container status
docker-compose ps

# Logs
docker-compose logs > docker-logs.txt
```

### Try minimal test:
```bash
# Test Redis only
docker-compose up -d redis
docker-compose logs redis

# Test worker with simple command
docker-compose run worker node --version
```

### Reset everything:
```bash
# Nuclear option - removes all containers, networks, volumes
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

**Need more help?**
- Check `DOCKER_SETUP.md` for setup guide
- Check `README.md` for full documentation
- Review Docker logs: `docker-compose logs -f`
