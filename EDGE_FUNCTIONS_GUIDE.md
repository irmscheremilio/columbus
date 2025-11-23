# Supabase Edge Functions Deployment Guide

## Overview

All server-side business logic has been moved to Supabase Edge Functions. This eliminates the need for a Node.js server and allows for true serverless deployment.

## Edge Functions

### 1. **waitlist** - Handle Waitlist Submissions
**Location:** `supabase/functions/waitlist/index.ts`

**Purpose:** Process waitlist submissions and send welcome emails

**Environment Variables Needed:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (for email notifications)

**Frontend Usage:**
```typescript
const supabase = useSupabaseClient()
await supabase.functions.invoke('waitlist', {
  body: {
    email: 'user@example.com',
    companyName: 'Acme Inc',
    website: 'https://acme.com'
  }
})
```

---

### 2. **setup-user** - Post-Signup User Setup
**Location:** `supabase/functions/setup-user/index.ts`

**Purpose:** Create organization, brand, and default prompts after user signs up

**Environment Variables Needed:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Frontend Usage:**
```typescript
const supabase = useSupabaseClient()
await supabase.functions.invoke('setup-user', {
  body: {
    organizationName: 'Acme Inc',
    brandName: 'Acme',
    website: 'https://acme.com'
  }
})
```

**Note:** This function requires an authenticated user (passes auth token)

---

### 3. **trigger-scan** - Queue Visibility Scan
**Location:** `supabase/functions/trigger-scan/index.ts`

**Purpose:** Authenticate user and call worker API to queue a visibility scan

**Environment Variables Needed:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `WORKER_API_URL` (e.g., `https://columbus-worker.railway.app`)
- `WORKER_API_SECRET`

**Frontend Usage:**
```typescript
const supabase = useSupabaseClient()
const result = await supabase.functions.invoke('trigger-scan', {
  body: {
    promptIds: ['uuid-1', 'uuid-2'] // Optional
  }
})
// Returns: { jobId, status: 'queued' }
```

**Note:** This function requires an authenticated user

---

### 4. **stripe-webhook** - Handle Stripe Events
**Location:** `supabase/functions/stripe-webhook/index.ts`

**Purpose:** Process Stripe webhook events for subscription management

**Environment Variables Needed:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Webhook URL:** `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`

**Handled Events:**
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Downgrade to free
- `invoice.payment_succeeded` - Log successful payment
- `invoice.payment_failed` - Mark account as past_due

---

## Deployment Steps

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Set Environment Variables

For each edge function, set the required secrets:

```bash
# Supabase credentials
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email service
supabase secrets set RESEND_API_KEY=your-resend-key

# Worker API
supabase secrets set WORKER_API_URL=http://localhost:3001  # or Railway URL
supabase secrets set WORKER_API_SECRET=your-worker-secret

# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy waitlist
supabase functions deploy setup-user
supabase functions deploy trigger-scan
supabase functions deploy stripe-webhook
```

Or deploy individually:
```bash
supabase functions deploy waitlist
```

### 6. Test Functions Locally (Optional)

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve waitlist

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/waitlist' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","companyName":"Test Co"}'
```

---

## Frontend Integration

### Update Environment Variables

Update `frontend/.env`:

```env
# Supabase will automatically use these for edge functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Worker API (for direct calls if needed)
WORKER_API_URL=https://columbus-worker.railway.app
```

### Edge Functions Are Already Integrated

The frontend has been updated to use edge functions:

1. **Waitlist Form** (`pages/index.vue`) - Calls `waitlist` function
2. **Signup Flow** (`pages/auth/signup.vue`) - Calls `setup-user` function
3. **Composable** (`composables/useEdgeFunctions.ts`) - Helper functions

---

## Stripe Webhook Configuration

### 1. Get Your Webhook URL

```
https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
```

### 2. Configure in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Set it in Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Monitoring & Debugging

### View Function Logs

```bash
# View logs for a specific function
supabase functions logs waitlist

# Stream logs in real-time
supabase functions logs waitlist --tail
```

### Common Issues

**1. CORS Errors**
- Edge functions include CORS headers by default
- Make sure to handle OPTIONS requests (already implemented)

**2. Authentication Errors**
- `setup-user` and `trigger-scan` require authenticated requests
- Frontend automatically passes auth token via Supabase client

**3. Environment Variables Not Set**
- Run `supabase secrets list` to check which secrets are set
- Use `supabase secrets set KEY=value` to add missing ones

**4. Worker API Connection Issues**
- Ensure `WORKER_API_URL` is set correctly in edge function secrets
- Verify `WORKER_API_SECRET` matches between edge function and worker

---

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│   (Nuxt SPA)    │
└────────┬────────┘
         │
         │ supabase.functions.invoke()
         │
┌────────▼────────────────────────┐
│   Supabase Edge Functions       │
│   ┌──────────────────────────┐  │
│   │ waitlist                 │  │
│   │ setup-user               │  │
│   │ trigger-scan ────────────┼──┼──► Worker API (Railway)
│   │ stripe-webhook           │  │
│   └──────────────────────────┘  │
│                                  │
│   Supabase Database              │
│   (PostgreSQL + RLS)             │
└──────────────────────────────────┘
```

---

## Benefits of Edge Functions

✅ **No Server Management** - Fully serverless, auto-scaling
✅ **Built-in Authentication** - Seamless integration with Supabase Auth
✅ **Global CDN** - Low latency worldwide
✅ **Type-Safe** - TypeScript/Deno runtime
✅ **Cost-Effective** - Pay per invocation
✅ **Secure** - Environment secrets managed by Supabase

---

## Next Steps

1. Deploy edge functions to Supabase
2. Set all required environment secrets
3. Configure Stripe webhook endpoint
4. Test each function in production
5. Monitor logs for any errors

For more information, see the [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions).
