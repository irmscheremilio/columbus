# Railway Setup Guide for Columbus

Step-by-step guide to deploy Columbus worker on Railway with managed Redis.

## 🚂 Why Railway?

- **Managed Redis** included
- **Auto-scaling** ready
- **Simple deployment** from GitHub
- **Built-in monitoring**
- **Affordable** ($5-30/month)

## 📋 Prerequisites

- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Columbus repository on GitHub
- [ ] All API keys ready
- [ ] Worker tested locally

## 🚀 Step-by-Step Setup

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repos

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your Columbus repository
4. Railway will scan and detect the structure

### Step 3: Add Redis Database

1. In your project, click **"+ New"**
2. Select **"Database"**
3. Choose **"Add Redis"**
4. Wait for provisioning (~30 seconds)
5. Redis will be automatically available at `$REDIS_URL`

### Step 4: Configure Worker Service

#### 4.1: Set Root Directory

1. Click on the worker service
2. Go to **Settings** → **Service**
3. Set **Root Directory**: `worker`
4. Save changes

#### 4.2: Add Environment Variables

Go to **Variables** tab and add:

```bash
# Required
PORT=3001
NODE_ENV=production
API_SECRET=your_worker_api_secret

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI APIs (at least OpenAI required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...

# Email
RESEND_API_KEY=re_...
```

**Note**: `REDIS_URL` is automatically provided by Railway when you add the Redis database!

### Step 5: Deploy Worker

1. Railway will automatically deploy when you push to GitHub
2. Or click **"Deploy"** manually in the Railway dashboard
3. Watch the build logs
4. Wait for deployment (~2-3 minutes)

### Step 6: Get Public URL

1. Go to worker service → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `columbus-worker-production.railway.app`)
4. This is your `WORKER_API_URL`

### Step 7: Update Frontend (Vercel)

1. Go to your Vercel project
2. Settings → Environment Variables
3. Update `WORKER_API_URL`:
   ```
   WORKER_API_URL=https://your-worker.railway.app
   ```
4. Redeploy frontend

### Step 8: Test Deployment

```bash
# Test health endpoint
curl https://your-worker.railway.app/health

# Should return:
{"status":"ok","timestamp":"2024-11-23T..."}
```

## ✅ Verification Checklist

- [ ] Redis service is running (green status)
- [ ] Worker service is deployed (green status)
- [ ] All environment variables are set
- [ ] Health endpoint returns 200 OK
- [ ] No errors in worker logs
- [ ] Frontend can connect to worker
- [ ] Can trigger a visibility scan
- [ ] Scan completes successfully

## 🔍 Monitoring & Debugging

### View Logs

1. Click on worker service
2. Go to **"Logs"** tab
3. Filter by:
   - **Error**: Critical issues
   - **Warn**: Warnings
   - **Info**: General info
   - **All**: Everything

### Check Metrics

1. Click on worker service
2. Go to **"Metrics"** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Request rate
   - Response times

### Redis Monitoring

1. Click on Redis service
2. View **"Metrics"**:
   - Memory usage
   - Connected clients
   - Operations per second
   - Hit rate

### Common Issues

#### Worker keeps restarting

**Check logs for**:
- Missing environment variables
- Invalid API keys
- Can't connect to Redis
- Can't connect to Supabase

**Solution**:
```bash
# Verify all required env vars are set
# Check Railway dashboard → Service → Variables

# Test Redis connection
# In Railway logs, look for Redis connection success
```

#### Can't connect to Redis

**Check**:
- Redis service is running (should be green)
- `REDIS_URL` environment variable exists
- Worker and Redis are in the same project

**Solution**:
Railway automatically connects services in the same project. Just ensure both are running.

#### Out of memory

**Symptoms**:
- Service crashes
- Logs show memory errors

**Solution**:
1. Go to Settings → Resources
2. Increase memory limit:
   - Start with 512MB
   - Increase to 1GB if needed
3. Monitor usage in Metrics

#### High costs

**Check**:
- Memory usage (reduce if possible)
- Request volume (optimize caching)
- CPU usage (optimize AI calls)

**Solutions**:
1. Implement response caching
2. Reduce AI API calls
3. Optimize worker concurrency
4. Set memory limits

## 💰 Cost Management

### Railway Pricing

- **Hobby Plan**: $5 credit/month
  - Good for: Development, testing
  - ~500MB RAM
  - Limited resources

- **Pro Plan**: $20/month base + usage
  - Good for: Production
  - Pay for what you use
  - Better resources
  - Priority support

### Estimating Costs

**Worker**:
- Memory: 512MB = ~$2/month
- CPU: Light usage = ~$3/month
- **Estimated**: $5-10/month

**Redis**:
- Memory: 256MB = ~$2/month
- Persistent = ~$3/month
- **Estimated**: $5/month

**Total**: ~$10-15/month for both

### Cost Optimization

1. **Right-size resources**:
   - Start with 512MB RAM
   - Scale up only if needed

2. **Use caching**:
   - Cache AI responses
   - Reduce redundant API calls

3. **Monitor usage**:
   - Set up alerts
   - Review metrics weekly

4. **Optimize code**:
   - Reduce worker concurrency if not needed
   - Batch operations where possible

## 🔐 Security Best Practices

### Environment Variables

1. **Never commit secrets** to Git
2. **Use Railway's Variables** (encrypted)
3. **Rotate keys** regularly
4. **Separate dev/prod** keys

### API Secret

Generate a strong secret:
```bash
# Use this or generate your own
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set same value in:
- Railway worker: `API_SECRET`
- Vercel frontend: `WORKER_API_SECRET`

### Network Security

1. **Use HTTPS** for all connections (automatic)
2. **Verify webhook signatures** (Stripe)
3. **Rate limit** API endpoints
4. **Monitor** for unusual activity

## 🔄 Deployment Workflow

### Automatic Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update worker"
git push origin main
# Railway deploys automatically!
```

### Manual Deployment

In Railway dashboard:
1. Go to worker service
2. Click **"Deploy"**
3. Select **"Redeploy"**

### Rollback

If deployment fails:
1. Go to **Deployments** tab
2. Find previous working deployment
3. Click **"Redeploy"**

## 📊 Scaling

### Vertical Scaling (More Resources)

1. Go to Settings → Resources
2. Increase:
   - Memory (512MB → 1GB → 2GB)
   - CPU (auto-scaled)

### Horizontal Scaling (Multiple Instances)

**Pro Plan only**:
1. Go to Settings → Scaling
2. Enable **"Horizontal Scaling"**
3. Set:
   - Min replicas: 1
   - Max replicas: 3
4. Configure auto-scaling rules

### When to Scale

Scale up if:
- CPU consistently > 80%
- Memory consistently > 80%
- Queue depth > 50
- Processing time > 5 minutes

## 🚨 Alerts & Monitoring

### Set Up Alerts

1. Go to project Settings
2. Enable notifications:
   - Deployment failures
   - Service crashes
   - High resource usage

3. Add notification channels:
   - Email
   - Slack
   - Discord
   - Webhook

### Key Metrics to Track

1. **Availability**: Uptime %
2. **Performance**: Response time
3. **Errors**: Error rate
4. **Resources**: CPU/Memory usage
5. **Queue**: Job queue depth

## 🔧 Advanced Configuration

### Custom Domain

1. Go to Settings → Networking
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.columbus.com`)
4. Configure DNS:
   ```
   CNAME api your-worker.railway.app
   ```

### Health Checks

Already configured in `worker/railway.toml`:
```toml
healthcheckPath = "/health"
healthcheckTimeout = 100
```

Railway will check `/health` endpoint regularly.

### Restart Policies

Already configured:
```toml
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

Worker will restart automatically on failure.

## 📞 Support

### Railway Support

- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Railway Discord community
- **Twitter**: [@Railway](https://twitter.com/Railway)

### Common Issues

See **Monitoring & Debugging** section above.

---

## ✅ Final Checklist

Before going live:

- [ ] Redis is running
- [ ] Worker is deployed
- [ ] All env vars are set
- [ ] Health check passes
- [ ] Logs show no errors
- [ ] Frontend can connect
- [ ] Test visibility scan works
- [ ] Alerts are configured
- [ ] Costs are monitored
- [ ] Domain is configured (optional)

---

## 🎯 Quick Commands

```bash
# Check worker health
curl https://your-worker.railway.app/health

# Trigger deployment (after git push)
# Railway deploys automatically

# Check logs (in Railway dashboard)
# Service → Logs tab
```

---

**That's it!** Your worker is now running on Railway with managed Redis. 🎉
