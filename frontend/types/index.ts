export type PlanType = 'free' | 'pro' | 'agency' | 'enterprise'

// AIModel is now a string to support dynamic platforms from ai_platforms table
// Known platforms for type hints, but any string is valid
export type AIModel = string

export type Sentiment = 'positive' | 'neutral' | 'negative'

export type FixCategory = 'schema' | 'content' | 'technical' | 'authority'

export type EstimatedImpact = 'low' | 'medium' | 'high'

export type Platform = 'wordpress' | 'shopify' | 'webflow' | 'custom' | 'nextjs' | 'nuxt'

export interface PlatformGuide {
  platform: Platform
  steps: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
  codeSnippets?: CodeSnippet[]
}

export interface CodeSnippet {
  language: string
  code: string
  filename?: string
  description?: string
}

export interface VisibilityGap {
  prompt: string
  competitorsMentioned: string[]
  youMentioned: boolean
  missingElements: string[]
  estimatedImpact: EstimatedImpact
}

export interface AIResponse {
  model: AIModel
  responseText: string
  brandMentioned: boolean
  citationPresent: boolean
  position: number | null
  sentiment: Sentiment | null
  competitorMentions: string[]
  metadata?: Record<string, any>
}

export interface VisibilityScore {
  overall: number
  byModel: Record<string, number>  // Dynamic platform IDs from ai_platforms table
  trend: 'up' | 'down' | 'stable'
  percentChange: number
}

export interface Competitor {
  id: string
  name: string
  domain: string | null
  visibilityScore?: number
  isActive: boolean
}

export interface Organization {
  id: string
  name: string
  domain: string
  industry: string | null
  techStack: {
    platform?: Platform
    cms?: string
    frameworks?: string[]
    hasSchema?: boolean
  } | null
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  organizationId: string | null
  email: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

export interface Subscription {
  id: string
  organizationId: string
  planType: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: string | null
  stripeSubscriptionId: string | null
}

export const PLANS: Record<PlanType, {
  name: string
  price: number
  priceId: string | null
  features: string[]
  limits: {
    prompts: number
    competitors: number
    scansPerMonth: number
  }
}> = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'One-time AEO audit',
      'Basic visibility score',
      'Top 3 fix recommendations',
      'Basic reporting'
    ],
    limits: {
      prompts: 10,
      competitors: 0,
      scansPerMonth: 1
    }
  },
  pro: {
    name: 'Pro',
    price: 79,
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    features: [
      'Weekly automated monitoring',
      'All 4 AI engines',
      'Unlimited fix recommendations',
      'Implementation guides',
      'Track up to 10 competitors',
      'Email support',
      'Export reports'
    ],
    limits: {
      prompts: -1, // unlimited
      competitors: 10,
      scansPerMonth: 4
    }
  },
  agency: {
    name: 'Agency',
    price: 199,
    priceId: 'price_agency_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Pro',
      'Manage 5 client accounts',
      'White-label reports',
      'Priority support',
      'API access',
      'Custom prompts'
    ],
    limits: {
      prompts: -1,
      competitors: 50,
      scansPerMonth: 20
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 0, // Custom pricing
    priceId: null,
    features: [
      'Everything in Agency',
      'Unlimited client accounts',
      'Dedicated success manager',
      'Custom integrations',
      'SLA guarantee',
      'Custom AI model support'
    ],
    limits: {
      prompts: -1,
      competitors: -1,
      scansPerMonth: -1
    }
  }
}
