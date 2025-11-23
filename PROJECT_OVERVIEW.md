# Columbus - Project Overview

## What is Columbus?

Columbus is an **AI Engine Optimization (AEO) SaaS platform** that helps businesses improve their visibility in AI chatbot responses from ChatGPT, Claude, Gemini, and Perplexity.

### The Problem It Solves

- 60% of searches now happen in AI chatbots, not Google
- Businesses don't know if AI recommends them to users
- Existing tools only show problems, not solutions
- Marketers struggle to implement technical AEO fixes

### The Solution

Columbus provides:
1. **Visibility Scanning** - Test your brand across 4 AI engines
2. **Gap Analysis** - See where competitors appear but you don't
3. **Fix Recommendations** - Platform-specific implementation guides
4. **Progress Tracking** - Weekly automated scans and reports

## Business Model

### Target Market

- **Primary**: B2B SaaS companies ($500K-$10M ARR)
- **Secondary**: Marketing agencies managing multiple clients
- **Tertiary**: E-commerce brands, professional services

### Pricing

| Plan | Price | Target |
|------|-------|--------|
| Free | $0 | Lead generation |
| Pro | $79/mo | Individual businesses |
| Agency | $199/mo | Marketing agencies |
| Enterprise | Custom | Large enterprises |

### Revenue Projections

- **Year 1**: 100 paying customers = $8K MRR = $96K ARR
- **Year 2**: 500 paying customers = $40K MRR = $480K ARR
- **Year 3**: 2000 paying customers = $160K MRR = $1.92M ARR

## Technical Architecture

### Frontend
- **Framework**: Nuxt 4 (Vue 3)
- **Styling**: TailwindCSS
- **State**: Pinia
- **Deployment**: Vercel

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: Nuxt server routes
- **Real-time**: Supabase Realtime

### Worker System
- **Runtime**: Node.js
- **Queue**: BullMQ + Redis
- **Jobs**: Visibility scanning, recommendations
- **Deployment**: Railway

### AI Integrations
- **OpenAI** (ChatGPT) - GPT-4o mini
- **Anthropic** (Claude) - Claude 3.5 Haiku
- **Google** (Gemini) - Gemini 1.5 Flash
- **Perplexity** - Llama 3.1 Sonar

### Infrastructure
```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  Vercel     │─────▶│  Supabase    │
│  (Nuxt App) │      │  (Database)  │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  Railway    │─────▶│    Redis     │
│  (Workers)  │      │   (Queue)    │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────────────────────┐
│      AI API Services        │
│  OpenAI | Anthropic | etc.  │
└─────────────────────────────┘
```

## Core Features (MVP)

### Implemented ✅

1. **Landing Page**
   - Hero section with value proposition
   - Pricing table
   - Waitlist/lead capture
   - Feature showcase

2. **Authentication**
   - Email/password signup
   - Login/logout
   - Password reset (via Supabase)
   - Protected routes

3. **Onboarding**
   - Organization setup
   - Website configuration
   - Free tier setup

4. **Dashboard**
   - Visibility score overview
   - Score by AI model
   - Recent scans
   - Top recommendations

5. **Visibility Scanning**
   - Multi-AI testing (ChatGPT, Claude, Gemini, Perplexity)
   - Brand mention detection
   - Citation tracking
   - Competitor comparison
   - Sentiment analysis
   - Score calculation (0-100)

6. **Recommendations**
   - Auto-generated fix recommendations
   - Platform-specific guides (WordPress, Shopify, etc.)
   - Code snippets
   - Impact estimation
   - Status tracking

7. **Competitor Tracking**
   - Add/remove competitors
   - Track competitor visibility
   - Gap analysis
   - Benchmark comparison

8. **Settings**
   - Organization management
   - Subscription status
   - User profile

### To Be Implemented 🚧

1. **Stripe Integration**
   - Checkout flow
   - Subscription management
   - Billing portal
   - Usage limits enforcement

2. **Email Notifications**
   - Welcome emails
   - Scan completion
   - Weekly reports
   - Recommendation alerts

3. **Advanced Features**
   - Content optimizer
   - Schema markup generator
   - Custom prompts
   - Historical trends
   - White-label reports (Agency)
   - API access (Agency)

## Database Schema

### Core Tables

- `organizations` - Customer companies
- `users` - User accounts (linked to Supabase auth)
- `subscriptions` - Stripe subscription data
- `prompts` - Test prompts for scanning
- `prompt_results` - AI response data
- `visibility_scores` - Calculated scores
- `fix_recommendations` - Auto-generated fixes
- `competitors` - Tracked competitors
- `jobs` - Background job tracking

### Security

- Row-Level Security (RLS) policies on all tables
- Multi-tenant isolation
- Service role key for backend operations only

## Cost Structure

### Fixed Costs (Monthly)

| Service | Cost |
|---------|------|
| Vercel (Frontend) | $0-20 |
| Railway (Worker + Redis) | $10-30 |
| Supabase | $0-25 |
| **Total Fixed** | **$10-75** |

### Variable Costs (Per Customer/Month)

| Item | Cost |
|------|------|
| AI API calls (~40 prompts x 4 models) | $5-10 |
| Database storage | $0.50 |
| Email (50 emails/month) | $0 (free tier) |
| **Total per Customer** | **$5.50-10.50** |

### Margin Analysis

- **Pro Plan** ($79): $79 - $10 = $69 margin (87%)
- **Agency Plan** ($199): $199 - $50 = $149 margin (75%)

## Development Timeline

### MVP (Completed) ✅
- Week 1-2: Project setup, auth, landing page
- Week 3-4: Core scanning engine, AI integrations
- Week 5-6: Dashboard, recommendations, competitor tracking

### Phase 2 (Next 4-6 weeks)
- Stripe integration
- Email automation
- Advanced reporting
- Performance optimization
- Beta testing

### Phase 3 (Future)
- Chrome extension
- WordPress plugin
- White-label features
- API for integrations
- Advanced analytics

## Key Metrics to Track

### Product Metrics
- Daily/Monthly Active Users (DAU/MAU)
- Visibility scans per user
- Recommendation completion rate
- Time to first value

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate
- Conversion rate (Free → Pro)

### Technical Metrics
- API error rates
- Scan completion time
- Worker queue depth
- Database query performance
- Page load times

## Growth Strategy

### Phase 1: Early Adopters (Months 1-3)
- Launch on Product Hunt
- Content marketing (AEO guides)
- LinkedIn outreach to B2B marketers
- Free tier conversion optimization

### Phase 2: Scale (Months 4-12)
- SEO for "AEO tools" keywords
- Partnership with SEO tools
- Affiliate program for agencies
- Case studies and testimonials

### Phase 3: Market Leader (Year 2+)
- Thought leadership in AEO space
- Conference speaking
- Premium features for enterprise
- API marketplace

## Competitive Advantages

1. **Action-Oriented** - Only tool with implementation guides
2. **Platform-Specific** - Tailored to user's tech stack
3. **Affordable** - $79 vs $500+ for enterprise tools
4. **Multi-AI** - Tests all major AI engines
5. **Fast Iteration** - Modern tech stack, quick updates

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI API costs increase | High | Cache results, optimize prompts |
| AI APIs change | High | Multi-provider strategy |
| Competition | Medium | Fast feature development |
| Low conversion | High | Strong onboarding, value demo |
| Technical issues | Medium | Monitoring, error tracking |

## File Structure

```
columbus/
├── frontend/                 # Nuxt 4 app
│   ├── app.vue              # Root component
│   ├── nuxt.config.ts       # Nuxt configuration
│   ├── pages/               # Route pages
│   │   ├── index.vue        # Landing page
│   │   ├── auth/            # Auth pages
│   │   └── dashboard/       # Dashboard pages
│   ├── components/          # Vue components
│   ├── server/              # API routes
│   │   └── api/             # API endpoints
│   ├── types/               # TypeScript types
│   └── assets/              # Static assets
│
├── worker/                   # Background jobs
│   └── src/
│       ├── index.ts         # Worker server
│       ├── workers/         # Job processors
│       │   ├── visibility-scanner.ts
│       │   └── recommendation-generator.ts
│       ├── queues/          # Job queues
│       └── lib/             # Utilities
│           └── ai-clients/  # AI API clients
│
├── supabase/                # Database
│   ├── migrations/          # SQL migrations
│   └── config.toml          # Supabase config
│
├── README.md                # Full documentation
├── QUICK_START.md           # Quick setup guide
├── DEPLOYMENT.md            # Deployment guide
└── PROJECT_OVERVIEW.md      # This file
```

## Next Steps for Launch

1. ✅ MVP development complete
2. ⏳ Stripe integration
3. ⏳ Email automation
4. ⏳ Beta testing with 10 users
5. ⏳ Fix bugs and polish UX
6. ⏳ Prepare marketing materials
7. ⏳ Product Hunt launch
8. ⏳ Acquire first 100 users

---

**Status**: MVP Complete - Ready for Beta Testing
**Last Updated**: November 2024
**Estimated Launch**: December 2024
