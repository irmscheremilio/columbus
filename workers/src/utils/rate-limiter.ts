import { Redis } from 'ioredis'
import type { AIModel } from '../types/ai.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

/**
 * Rate limit configuration per AI model
 */
const RATE_LIMITS: Record<AIModel, { requests: number; window: number; costPerRequest: number }> = {
  chatgpt: { requests: 100, window: 3600, costPerRequest: 0.03 },
  claude: { requests: 100, window: 3600, costPerRequest: 0.04 },
  gemini: { requests: 100, window: 3600, costPerRequest: 0.02 },
  perplexity: { requests: 50, window: 3600, costPerRequest: 0.05 }
}

/**
 * Check if request is within rate limit
 * Uses sliding window algorithm with Redis
 */
export async function checkRateLimit(organizationId: string, model: AIModel): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
}> {
  const config = RATE_LIMITS[model]
  const key = `ratelimit:${organizationId}:${model}`
  const now = Date.now()
  const windowStart = now - (config.window * 1000)

  // Remove old requests outside the window
  await redis.zremrangebyscore(key, 0, windowStart)

  // Count requests in current window
  const requestCount = await redis.zcard(key)

  if (requestCount >= config.requests) {
    // Get the oldest request to calculate reset time
    const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const resetAt = parseInt(oldestRequest[1]) + (config.window * 1000)

    return {
      allowed: false,
      remaining: 0,
      resetAt
    }
  }

  // Add current request
  await redis.zadd(key, now, `${now}-${Math.random()}`)

  // Set expiration on the key
  await redis.expire(key, config.window)

  return {
    allowed: true,
    remaining: config.requests - requestCount - 1,
    resetAt: now + (config.window * 1000)
  }
}

/**
 * Track API cost for an organization
 */
export async function trackCost(organizationId: string, model: AIModel): Promise<void> {
  const config = RATE_LIMITS[model]
  const key = `cost:${organizationId}:${model}`
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Increment request count
  await redis.hincrby(`${key}:${monthKey}`, 'requests', 1)

  // Add cost
  await redis.hincrbyfloat(`${key}:${monthKey}`, 'cost', config.costPerRequest)

  // Set expiration (90 days)
  await redis.expire(`${key}:${monthKey}`, 90 * 24 * 60 * 60)
}

/**
 * Get cost summary for an organization
 */
export async function getCostSummary(organizationId: string): Promise<{
  total: number
  byModel: Record<AIModel, { requests: number; cost: number }>
}> {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const summary = {
    total: 0,
    byModel: {} as Record<AIModel, { requests: number; cost: number }>
  }

  for (const model of ['chatgpt', 'claude', 'gemini', 'perplexity'] as AIModel[]) {
    const key = `cost:${organizationId}:${model}:${monthKey}`
    const data = await redis.hgetall(key)

    const requests = parseInt(data.requests || '0')
    const cost = parseFloat(data.cost || '0')

    summary.byModel[model] = { requests, cost }
    summary.total += cost
  }

  return summary
}

/**
 * Wait with exponential backoff if rate limited
 */
export async function waitForRateLimit(organizationId: string, model: AIModel, attempt: number = 1): Promise<void> {
  const rateLimit = await checkRateLimit(organizationId, model)

  if (!rateLimit.allowed) {
    const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000) // Max 30 seconds
    console.log(`[Rate Limiter] ${model} rate limit hit for org ${organizationId}. Waiting ${waitTime}ms...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))

    // Retry
    return waitForRateLimit(organizationId, model, attempt + 1)
  }
}
