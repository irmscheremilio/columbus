# Columbus Workers

Background workers for Columbus AEO platform using BullMQ, Redis, and Playwright.

## Architecture

The workers handle heavy processing tasks that shouldn't run in the frontend or Supabase Edge Functions:

- **Visibility Scanning**: Test prompts across multiple AI platforms (ChatGPT, Claude, Gemini, Perplexity)
- **Web Scraping**: Use Playwright to automate browser interactions with AI platforms
- **Score Calculation**: Analyze results and calculate visibility scores
- **Database Updates**: Store results in Supabase

## Setup

### Prerequisites

- Node.js 20+
- Redis (local or hosted)
- Supabase project

### Installation

```bash
cd workers
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI APIs (for future use when switching from scraping to APIs)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
PERPLEXITY_API_KEY=
```

### Development

```bash
npm run dev
```

This starts the worker in watch mode using `tsx`.

### Production

```bash
npm run build
npm start
```

## How It Works

### 1. Frontend triggers scan

User clicks "Run New Visibility Scan" → Frontend calls Supabase Edge Function `trigger-visibility-scan`

### 2. Edge Function queues job

Edge function creates a job in the `jobs` table and adds it to the Redis queue `visibility-scans`

### 3. Worker processes job

The visibility scanner worker:
- Fetches prompts from database
- Initializes AI clients (ChatGPT, Claude, Gemini, Perplexity)
- Tests each prompt with each AI platform using Playwright
- Extracts brand mentions, citations, sentiment
- Stores results in `prompt_results` table
- Calculates overall visibility score
- Updates `visibility_scores` table

### 4. Frontend displays results

User refreshes dashboard → sees updated scores and results

## AI Clients

### ChatGPT Client

**Status**: ✅ Implemented (basic)

Uses Playwright to:
1. Navigate to chatgpt.com
2. Enter prompt
3. Wait for response
4. Extract response text and citations

**Insights from research**:
- Extreme recency bias (76.4% of citations from last 30 days)
- Wikipedia dominates (7.8% of citations)
- Does NOT execute JavaScript
- Average 5 domains cited per response

### Claude Client

**Status**: ⏳ Placeholder

Will use similar Playwright approach as ChatGPT.

### Gemini Client

**Status**: ⏳ Placeholder

**Unique advantage**: Only AI with full JavaScript rendering support.

### Perplexity Client

**Status**: ⏳ Placeholder

**Note**: Most transparent citation model - always shows sources.

## Rate Limiting

Configured in `types/ai.ts`:

```typescript
{
  chatgpt: { requests: 100, window: '1h', costPerRequest: 0.03 },
  claude: { requests: 100, window: '1h', costPerRequest: 0.04 },
  gemini: { requests: 100, window: '1h', costPerRequest: 0.02 },
  perplexity: { requests: 50, window: '1h', costPerRequest: 0.05 }
}
```

## Visibility Score Calculation

Score is 0-100 based on:

- **Brand mentioned**: +50 points
- **Positive sentiment**: +20 points (neutral: +10, negative: 0)
- **Early position** (1-3): +30 to +20 points
- **Citation present**: +20 points

Averaged across all test results.

## Deployment

### Railway (Recommended)

1. Create new Railway project
2. Add Redis service
3. Add Node.js service for workers
4. Set environment variables
5. Deploy from GitHub

### Alternative: Any Node.js host + Upstash Redis

Works on Render, Fly.io, DigitalOcean, etc.

## Future Improvements

1. **API Integration**: Switch from web scraping to official APIs where available
2. **Retry Logic**: Implement exponential backoff for failed requests
3. **Caching**: Cache AI responses to reduce API costs
4. **Parallel Processing**: Run multiple workers for faster scans
5. **Real-time Updates**: Use Supabase Realtime to push updates to frontend
6. **Cost Tracking**: Implement per-organization API cost tracking
7. **Proxy Rotation**: Avoid rate limiting with rotating proxies
