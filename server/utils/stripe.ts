import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true
})

// Subscription plans
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '5 prompts per month',
      '1 competitor tracking',
      'Basic visibility scans',
      'Email reports'
    ],
    limits: {
      promptsPerMonth: 5,
      competitors: 1,
      scansPerMonth: 2,
      websiteAnalyses: 1
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      'Unlimited prompts',
      'Up to 10 competitors',
      'Daily visibility scans',
      'Priority email support',
      'Competitor gap analysis',
      'Weekly automated scans',
      'Custom recommendations',
      'PDF reports'
    ],
    limits: {
      promptsPerMonth: -1, // unlimited
      competitors: 10,
      scansPerMonth: -1, // unlimited
      websiteAnalyses: -1 // unlimited
    }
  }
} as const

export type PlanId = keyof typeof PLANS

/**
 * Get plan details by ID
 */
export function getPlan(planId: PlanId) {
  return PLANS[planId]
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(params: {
  userId: string
  userEmail: string
  planId: PlanId
  successUrl: string
  cancelUrl: string
}) {
  const plan = getPlan(params.planId)

  if (!plan.priceId) {
    throw new Error('Cannot create checkout for free plan')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    metadata: {
      userId: params.userId,
      planId: params.planId
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        planId: params.planId
      }
    }
  })

  return session
}

/**
 * Create Stripe billing portal session
 */
export async function createBillingPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl
  })

  return session
}

/**
 * Get subscription by customer ID
 */
export async function getSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  })

  return subscriptions.data[0] || null
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}
