# Columbus Deployment Guide

This guide covers deploying Columbus to production using Vercel (frontend) and Railway (worker).

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase database migrations run
- [ ] Stripe products created and price IDs updated
- [ ] Domain name purchased (optional but recommended)
- [ ] SSL certificate configured (automatic with Vercel)
- [ ] All API keys have billing enabled
- [ ] Email domain verified in Resend (for production)

## Frontend Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Nuxt.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.output/public` (default)
   - **Install Command**: `npm install` (default)

### 3. Environment Variables

Add all variables from `frontend/.env`:

```bash
NUXT_PUBLIC_SITE_URL=https://your-domain.com
NUXT_PUBLIC_SUPABASE_URL=...
NUXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...
PERPLEXITY_API_KEY=...
REDIS_URL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
RESEND_API_KEY=...
WORKER_API_URL=https://your-worker-url.railway.app
WORKER_API_SECRET=your_secret
```

**Important**: Use production keys, not test keys!

### 4. Deploy

Click **"Deploy"** and wait for build to complete (~2-3 minutes)

### 5. Custom Domain (Optional)

1. In Vercel project settings, go to **"Domains"**
2. Add your domain (e.g., `columbus.com`)
3. Follow DNS configuration instructions
4. Update `NUXT_PUBLIC_SITE_URL` to your domain

## Worker Deployment (Railway)

### 1. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/)
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your repository

### 2. Configure Service

1. Click on the deployed service
2. Go to **Settings**
3. Set:
   - **Root Directory**: `worker`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Healthcheck Path**: `/health`

### 3. Environment Variables

Add all variables from `worker/.env`:

```bash
PORT=3001
NODE_ENV=production
API_SECRET=your_secret_key

REDIS_URL=redis://default:password@redis.railway.internal:6379

SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...

OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...
PERPLEXITY_API_KEY=...

RESEND_API_KEY=...
```

### 4. Add Redis

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Redis"**
3. Once created, get connection URL from **"Connect"** tab
4. Update `REDIS_URL` in worker environment variables
   - Use internal URL: `redis://default:password@redis.railway.internal:6379`

### 5. Deploy

Railway will automatically deploy. Get the public URL from the deployment.

### 6. Update Frontend

In Vercel, update `WORKER_API_URL` to your Railway worker URL:
```
WORKER_API_URL=https://your-worker-production-url.railway.app
```

## Post-Deployment Configuration

### 1. Update Supabase Auth Settings

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**:
     - `https://your-domain.com/auth/callback`
     - `https://your-domain.com/**`

### 2. Update Stripe Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Update webhook endpoint to: `https://your-domain.com/api/webhooks/stripe`
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel if it changed

### 3. Verify Email Domain (Resend)

1. Go to Resend Dashboard → **Domains**
2. Add your domain
3. Add DNS records to your domain provider:
   - SPF record
   - DKIM record
   - Custom domain CNAME
4. Verify domain

### 4. Test Production

1. Visit your production URL
2. Sign up for a new account
3. Verify email flow works
4. Run a visibility scan
5. Check worker logs in Railway
6. Verify Stripe test payment works

## Monitoring

### Vercel Logs

```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs <your-project-url>
```

### Railway Logs

1. Go to Railway project
2. Click on worker service
3. View **"Logs"** tab
4. Filter by error/warning levels

### Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Logs**
3. Filter by:
   - API logs (requests/errors)
   - Database logs (queries)
   - Auth logs (signups/logins)

## Cost Monitoring

### Set Up Budgets

**Vercel**:
- Go to **Settings** → **Billing**
- Enable usage alerts

**Railway**:
- Set usage limits in project settings
- Configure budget alerts

**AI APIs**:
- Set usage limits in each provider's dashboard
- Enable spending alerts

**Stripe**:
- Monitor in Stripe Dashboard → **Revenue Recognition**

### Expected Costs (Monthly)

| Service | Free Tier | Expected Cost |
|---------|-----------|---------------|
| Vercel | Hobby (free) | $0-20 |
| Railway | $5 credit | $10-30 |
| Redis (Railway) | Included | $0 |
| Supabase | 500MB DB | $0-25 |
| OpenAI | None | $20-100 |
| Anthropic | None | $20-100 |
| Google AI | $0.50/1M chars | $5-20 |
| Perplexity | None | $10-50 |
| Stripe | 2.9% + $0.30 | % of revenue |
| Resend | 100/day free | $0-20 |
| **Total** | | **$90-365/month** |

## Scaling Considerations

### When to Scale

**Database** (Supabase):
- More than 500MB data
- More than 2GB bandwidth/month
- Solution: Upgrade to Pro ($25/month)

**Workers** (Railway):
- Queue depth consistently > 10
- Processing time > 5 minutes
- Solution: Add more worker instances

**Redis**:
- Memory > 1GB
- Solution: Upgrade Redis plan

### Auto-Scaling

**Vercel**:
- Automatically scales based on traffic
- No action needed

**Railway**:
- Add horizontal scaling:
  - Go to worker settings
  - Enable "Horizontal Scaling"
  - Set min/max instances

## Rollback Procedure

### Frontend (Vercel)

1. Go to **Deployments**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

### Worker (Railway)

1. Go to **Deployments**
2. Find previous working deployment
3. Click **"Redeploy"**

### Database (Supabase)

Database rollbacks are complex. Instead:
1. Keep regular backups (automatic with Supabase Pro)
2. Test migrations in staging first
3. Use migration rollback SQL scripts

## Troubleshooting

### Frontend Not Loading

1. Check Vercel deployment logs
2. Verify environment variables
3. Check Supabase connection
4. Verify build succeeded

### Worker Not Processing Jobs

1. Check Railway logs for errors
2. Verify Redis connection
3. Check AI API keys and limits
4. Verify queue is running: `GET /health`

### Database Errors

1. Check Supabase dashboard logs
2. Verify migrations ran successfully
3. Check RLS policies
4. Verify connection string

### API Rate Limits

1. Check usage in each AI provider dashboard
2. Implement exponential backoff
3. Add request caching
4. Consider upgrading API plans

## Security Checklist

- [ ] All API keys stored in environment variables
- [ ] Supabase RLS policies enabled
- [ ] Stripe webhook signature verification enabled
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Supabase client)
- [ ] XSS prevention (Vue escapes by default)

## Maintenance

### Weekly

- [ ] Check error logs in Vercel and Railway
- [ ] Monitor API usage and costs
- [ ] Review Stripe transactions
- [ ] Check database size and performance

### Monthly

- [ ] Review and optimize database queries
- [ ] Check for dependency updates
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Update documentation

### Quarterly

- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature planning based on usage
- [ ] Cost optimization review

---

## Support

For deployment issues:

1. Check logs in Vercel/Railway
2. Review environment variables
3. Test locally first
4. Check Supabase status page
5. Review AI provider status pages

