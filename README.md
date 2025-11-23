# Columbus - AI Engine Optimization Platform

> The first AEO platform that doesn't just show problems—it tells you exactly how to fix them.

Columbus helps businesses optimize their visibility in AI chatbots like ChatGPT, Claude, Gemini, and Perplexity with actionable, platform-specific implementation guides.

## 🚀 Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TailwindCSS, Pinia
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Workers**: Node.js, BullMQ, Redis
- **AI APIs**: OpenAI, Anthropic, Google Gemini, Perplexity
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel (Frontend), Railway (Workers & Redis)

## 📁 Project Structure

```
columbus/
├── frontend/          # Nuxt 4 application
│   ├── pages/        # Vue pages and routes
│   ├── components/   # Vue components
│   ├── server/       # API routes
│   ├── types/        # TypeScript types
│   └── assets/       # CSS and static assets
├── worker/           # Background job processors
│   └── src/
│       ├── workers/  # BullMQ workers
│       ├── queues/   # Job queue definitions
│       └── lib/      # AI clients and utilities
└── supabase/         # Database migrations and config
    └── migrations/   # SQL migration files
```

## 🛠️ Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **npm** or **yarn** package manager
3. **Redis** instance - See [Redis Setup](#redis-setup)
4. **Supabase** account - [Create Account](https://supabase.com/)
5. **AI API Keys** (at least one):
   - OpenAI API key - [Get Key](https://platform.openai.com/api-keys)
   - Anthropic API key - [Get Key](https://console.anthropic.com/)
   - Google AI API key - [Get Key](https://ai.google.dev/)
   - Perplexity API key - [Get Key](https://www.perplexity.ai/hub/developers)
6. **Stripe** account - [Create Account](https://dashboard.stripe.com/register)
7. **Resend** account (for emails) - [Create Account](https://resend.com/signup)

## 📦 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd columbus

# Install frontend dependencies
cd frontend
npm install

# Install worker dependencies
cd ../worker
npm install
```

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Fill in:
   - **Name**: columbus-prod (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
4. Wait for project initialization (~2 minutes)

#### Get Supabase Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NUXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NUXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" first)

#### Run Database Migrations

```bash
cd supabase

# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

**Alternative**: Copy the contents of `supabase/migrations/001_initial_schema.sql` and paste it into the Supabase SQL Editor (go to **SQL Editor** in dashboard).

### 3. Redis Setup

#### Option A: Upstash (Recommended for production)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose a region close to your deployment
4. Copy the **Redis URL** (it starts with `rediss://`)
5. Use this as your `REDIS_URL`

#### Option B: Railway

1. Go to [Railway](https://railway.app/)
2. Create a new project
3. Click **"+ New"** → **"Database"** → **"Add Redis"**
4. Copy the connection string from **Connect** tab
5. Use this as your `REDIS_URL`

#### Option C: Local Development

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo service redis-server start

# Use: redis://localhost:6379
```

### 4. AI API Keys

#### OpenAI (ChatGPT)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Name it "Columbus Production"
4. Copy the key (starts with `sk-`)
5. **Add billing**: Go to **Settings** → **Billing** and add a payment method

#### Anthropic (Claude)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **API Keys**
3. Click **"Create Key"**
4. Copy the key (starts with `sk-ant-`)
5. **Add billing**: Add a payment method in settings

#### Google AI (Gemini)

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **"Get API key"**
3. Create or select a Google Cloud project
4. Copy the API key
5. Enable billing in Google Cloud Console

#### Perplexity (Optional)

1. Go to [Perplexity Hub](https://www.perplexity.ai/hub/developers)
2. Request API access (may require waitlist)
3. Once approved, get your API key

### 5. Stripe Setup

#### Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Complete account setup

#### Get API Keys

1. In dashboard, click **"Developers"** → **"API keys"**
2. Copy:
   - **Publishable key** → `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

#### Create Products and Prices

```bash
# In Stripe Dashboard: Products → Create Product

# Create these products:

1. Columbus Pro
   - Price: $79/month
   - Billing period: Monthly
   - Copy Price ID → Use in types/index.ts PLANS.pro.priceId

2. Columbus Agency
   - Price: $199/month
   - Billing period: Monthly
   - Copy Price ID → Use in types/index.ts PLANS.agency.priceId
```

#### Set up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 6. Resend (Email) Setup

1. Go to [Resend](https://resend.com/)
2. Create account and verify email
3. Go to **API Keys**
4. Create new API key
5. Copy the key → `RESEND_API_KEY`

#### Add Domain (for production emails)

1. Go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `columbus.com`)
4. Follow DNS setup instructions
5. Verify domain

### 7. Environment Variables

#### Frontend (.env)

```bash
cd frontend
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
# Site
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NUXT_PUBLIC_SUPABASE_URL=your_supabase_url
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
PERPLEXITY_API_KEY=...

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
RESEND_API_KEY=re_...

# Worker
WORKER_API_URL=http://localhost:3001
WORKER_API_SECRET=generate_a_random_secret_here
```

#### Worker (.env)

```bash
cd worker
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development
API_SECRET=same_secret_as_frontend

REDIS_URL=redis://localhost:6379

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
PERPLEXITY_API_KEY=...

RESEND_API_KEY=re_...
```

### 8. Update Stripe Price IDs

Edit `frontend/types/index.ts` and update the Stripe price IDs:

```typescript
export const PLANS: Record<PlanType, {...}> = {
  pro: {
    // ...
    priceId: 'price_1234567890', // Your actual Stripe price ID
  },
  agency: {
    // ...
    priceId: 'price_0987654321', // Your actual Stripe price ID
  },
}
```

## 🚀 Running Locally

### Start Redis (if running locally)

```bash
# macOS
brew services start redis

# Linux
sudo service redis-server start
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on **http://localhost:3000**

### Start Worker

```bash
cd worker
npm run dev
```

Worker will run on **http://localhost:3001**

### Test the Application

1. Open **http://localhost:3000**
2. Click **"Start Free Audit"**
3. Sign up with email and password
4. Complete onboarding
5. You should be redirected to the dashboard

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click **"Import Project"**
4. Select your GitHub repository
5. Configure:
   - **Framework Preset**: Nuxt.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output/public`
6. Add all environment variables from `.env`
7. Deploy!

### Worker (Railway)

1. Go to [Railway](https://railway.app/)
2. Create new project
3. Click **"+ New"** → **"GitHub Repo"**
4. Select your repository
5. Configure:
   - **Root Directory**: `worker`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Add all environment variables from worker `.env`
7. Deploy!

### Post-Deployment

1. Update `NUXT_PUBLIC_SITE_URL` in Vercel to your production domain
2. Update `WORKER_API_URL` in Vercel to your Railway worker URL
3. Update Stripe webhook endpoint to production URL
4. Update Supabase auth redirect URLs in Supabase dashboard

## 📊 Monitoring & Costs

### Expected Monthly Costs

- **Supabase**: Free tier (up to 500MB database, 2GB bandwidth)
- **Vercel**: Free tier or ~$20/month for Pro
- **Railway**: ~$5-20/month (worker + Redis)
- **Redis (Upstash)**: ~$0-10/month
- **AI APIs**: ~$50-200/month depending on usage
  - OpenAI: ~$0.03 per prompt
  - Anthropic: ~$0.04 per prompt
  - Google: ~$0.02 per prompt
  - Perplexity: ~$0.05 per prompt
- **Stripe**: 2.9% + $0.30 per transaction
- **Resend**: Free tier (100 emails/day)

**Total estimated**: $80-250/month for a small number of users

## 🐛 Troubleshooting

### Frontend won't start

- Check all environment variables are set
- Run `npm install` again
- Clear `.nuxt` folder: `rm -rf .nuxt`

### Worker won't connect to Redis

- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check `REDIS_URL` format
- For Upstash, make sure URL starts with `rediss://` (with 's')

### AI API errors

- Verify API keys are correct
- Check you have billing enabled for each service
- Check rate limits haven't been exceeded

### Database errors

- Verify Supabase credentials
- Check migrations have been run
- Verify Row Level Security policies are active

## 📚 Next Steps

1. **Customize the landing page** with your branding
2. **Add your logo** to `public/` folder
3. **Set up domain** and SSL certificates
4. **Configure email templates** in Resend
5. **Test the complete user flow**
6. **Set up analytics** (Plausible or PostHog)
7. **Monitor costs** closely in first weeks

## 🤝 Support

For issues or questions:

1. Check this README
2. Review error logs in Vercel and Railway
3. Check Supabase logs in dashboard
4. Review API usage in each service dashboard

## 📝 License

Private - All rights reserved

---

**Built with Nuxt 4, Supabase, and AI-powered insights**
