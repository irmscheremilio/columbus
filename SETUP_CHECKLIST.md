# Columbus Setup Checklist

Use this checklist to ensure you have everything configured correctly before launching Columbus.

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/command line access

## ✅ External Services Setup

### Supabase (Required)
- [ ] Created Supabase account at [supabase.com](https://supabase.com)
- [ ] Created new project
- [ ] Saved Project URL
- [ ] Saved anon public key
- [ ] Saved service_role key (keep secret!)
- [ ] Ran database migrations
- [ ] Configured auth redirect URLs
- [ ] Tested database connection

### OpenAI (Required for core functionality)
- [ ] Created OpenAI account at [platform.openai.com](https://platform.openai.com)
- [ ] Generated API key
- [ ] Added billing information
- [ ] Set spending limit ($50 recommended for testing)
- [ ] Tested API key works

### Redis (Required)
Choose ONE option:
- [ ] **Option A**: Local Redis installed and running
- [ ] **Option B**: Upstash account created and Redis database set up
- [ ] **Option C**: Railway Redis provisioned
- [ ] Saved Redis connection URL
- [ ] Tested connection with `redis-cli ping`

### Anthropic (Optional - for Claude)
- [ ] Created Anthropic account at [console.anthropic.com](https://console.anthropic.com)
- [ ] Generated API key
- [ ] Added billing information
- [ ] Tested API key

### Google AI (Optional - for Gemini)
- [ ] Created Google Cloud account
- [ ] Enabled Generative AI API
- [ ] Generated API key at [ai.google.dev](https://ai.google.dev)
- [ ] Tested API key

### Perplexity (Optional)
- [ ] Requested API access at [perplexity.ai](https://www.perplexity.ai/hub/developers)
- [ ] Received API key
- [ ] Tested API key

### Stripe (Optional - for payments)
- [ ] Created Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] Completed account setup
- [ ] Copied publishable key (test mode)
- [ ] Copied secret key (test mode)
- [ ] Created Pro product ($79/month)
- [ ] Created Agency product ($199/month)
- [ ] Saved price IDs
- [ ] Configured webhook endpoint
- [ ] Saved webhook secret
- [ ] Tested test payment

### Resend (Optional - for emails)
- [ ] Created Resend account at [resend.com](https://resend.com)
- [ ] Generated API key
- [ ] Added domain (for production)
- [ ] Verified domain DNS records
- [ ] Tested sending email

## ✅ Local Setup

### Repository Setup
- [ ] Cloned/created repository
- [ ] Navigated to project directory
- [ ] Reviewed file structure

### Frontend Setup
- [ ] Navigated to `frontend/` directory
- [ ] Ran `npm install`
- [ ] Copied `.env.example` to `.env`
- [ ] Filled in all required environment variables:
  - [ ] `NUXT_PUBLIC_SITE_URL`
  - [ ] `NUXT_PUBLIC_SUPABASE_URL`
  - [ ] `NUXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `REDIS_URL`
  - [ ] `WORKER_API_URL`
  - [ ] `WORKER_API_SECRET`
- [ ] Filled in optional environment variables (if available)
- [ ] Started dev server with `npm run dev`
- [ ] Opened http://localhost:3000
- [ ] Confirmed landing page loads

### Worker Setup
- [ ] Navigated to `worker/` directory
- [ ] Ran `npm install`
- [ ] Copied `.env.example` to `.env`
- [ ] Filled in all required environment variables:
  - [ ] `PORT`
  - [ ] `NODE_ENV`
  - [ ] `API_SECRET` (same as frontend)
  - [ ] `REDIS_URL`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `OPENAI_API_KEY`
- [ ] Filled in optional AI API keys
- [ ] Started worker with `npm run dev`
- [ ] Confirmed worker starts without errors
- [ ] Tested health endpoint: http://localhost:3001/health

### Database Setup
- [ ] Navigated to `supabase/` directory
- [ ] Installed Supabase CLI: `npm install -g supabase`
- [ ] Linked project: `supabase link --project-ref YOUR_REF`
- [ ] Ran migrations: `supabase db push`
- [ ] Verified all tables created in Supabase dashboard
- [ ] Checked Row Level Security is enabled

## ✅ Testing

### Authentication Flow
- [ ] Visited landing page
- [ ] Clicked "Start Free Audit" or "Sign Up"
- [ ] Created account with email/password
- [ ] Received confirmation (check Supabase auth logs if not)
- [ ] Successfully logged in
- [ ] Redirected to dashboard
- [ ] Confirmed organization created
- [ ] Tested logout
- [ ] Tested login again

### Dashboard
- [ ] Dashboard loads correctly
- [ ] Navigation works
- [ ] Can view settings
- [ ] Can add competitors
- [ ] Can view recommendations (may be empty initially)

### Visibility Scan (if AI APIs configured)
- [ ] Clicked "Run New Visibility Scan"
- [ ] Monitored worker logs for progress
- [ ] Scan completes without errors
- [ ] Results appear in dashboard
- [ ] Scores calculated correctly
- [ ] Recommendations generated

## ✅ Stripe Integration (if using)

### Product Setup
- [ ] Created Pro product in Stripe
- [ ] Created Agency product in Stripe
- [ ] Updated `frontend/types/index.ts` with price IDs
- [ ] Tested checkout flow (test mode)
- [ ] Verified subscription created in database
- [ ] Tested webhook delivery

## ✅ Production Preparation

### Code Quality
- [ ] Removed console.logs from production code
- [ ] Removed test data
- [ ] Updated placeholder text
- [ ] Added actual logo/favicon
- [ ] Tested all major user flows
- [ ] Fixed any TypeScript errors
- [ ] Tested on mobile devices

### Environment Variables
- [ ] Created production environment variables
- [ ] Used production API keys (not test keys)
- [ ] Set production URLs
- [ ] Secured all secrets
- [ ] Enabled Stripe live mode keys

### Domain & DNS
- [ ] Purchased domain name
- [ ] Configured DNS for Vercel
- [ ] Configured DNS for Resend (if using)
- [ ] SSL certificate configured (automatic with Vercel)

### Monitoring
- [ ] Set up error tracking (Sentry optional)
- [ ] Configured logging
- [ ] Set up usage alerts for AI APIs
- [ ] Set up cost alerts for all services
- [ ] Configured uptime monitoring

## ✅ Deployment

### Frontend (Vercel)
- [ ] Pushed code to GitHub
- [ ] Connected repository to Vercel
- [ ] Configured build settings
- [ ] Added all environment variables
- [ ] Deployed successfully
- [ ] Tested production URL
- [ ] Custom domain configured (if applicable)

### Worker (Railway)
- [ ] Connected repository to Railway
- [ ] Configured build settings
- [ ] Added all environment variables
- [ ] Created Redis instance
- [ ] Deployed successfully
- [ ] Updated frontend `WORKER_API_URL`
- [ ] Tested worker health endpoint

### Database
- [ ] Confirmed migrations ran
- [ ] Verified RLS policies active
- [ ] Set up database backups (Supabase Pro)
- [ ] Configured connection pooling if needed

### Post-Deployment
- [ ] Updated Supabase auth URLs to production
- [ ] Updated Stripe webhook to production URL
- [ ] Tested full user flow on production
- [ ] Monitored logs for errors
- [ ] Tested payment flow with real card (then refund)
- [ ] Sent test emails from production

## ✅ Launch

### Marketing Prep
- [ ] Prepared Product Hunt launch
- [ ] Created social media posts
- [ ] Drafted launch email
- [ ] Set up analytics (Google Analytics/Plausible)
- [ ] Created help documentation

### Support Setup
- [ ] Set up support email
- [ ] Created FAQ page
- [ ] Prepared onboarding emails
- [ ] Created troubleshooting guide

### Legal
- [ ] Added Privacy Policy
- [ ] Added Terms of Service
- [ ] Configured cookie consent (if needed)
- [ ] Reviewed data handling practices

## ✅ Post-Launch

### Week 1
- [ ] Monitor error logs daily
- [ ] Track signup conversions
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] Monitor API costs

### Week 2-4
- [ ] Review analytics
- [ ] Optimize based on user behavior
- [ ] Improve onboarding based on drop-off
- [ ] Add requested features
- [ ] Optimize costs

### Month 2+
- [ ] Plan feature roadmap
- [ ] Scale infrastructure as needed
- [ ] Optimize database queries
- [ ] Improve AI prompt efficiency
- [ ] Build community

## 🎯 Success Metrics

Track these from day 1:

- [ ] Daily signups
- [ ] Activation rate (ran first scan)
- [ ] Free to paid conversion
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Churn rate
- [ ] Average scans per user
- [ ] Customer satisfaction score

## 🆘 Troubleshooting

If something doesn't work:

1. **Check logs first**
   - Vercel deployment logs
   - Railway worker logs
   - Supabase database logs
   - Browser console errors

2. **Verify environment variables**
   - All required variables set
   - No typos in variable names
   - Correct values for each environment

3. **Test connections**
   - Database connection
   - Redis connection
   - AI API keys
   - Stripe keys

4. **Review documentation**
   - README.md for full setup
   - QUICK_START.md for common issues
   - DEPLOYMENT.md for deployment issues

## 📚 Resources

- **Documentation**: All `.md` files in repo
- **Supabase Docs**: https://supabase.com/docs
- **Nuxt Docs**: https://nuxt.com
- **Stripe Docs**: https://stripe.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs

---

**Ready to Launch?** Once all items are checked, you're ready to go live!

**Need Help?** Review the README.md and documentation files.

**Good Luck!** 🚀
