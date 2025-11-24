import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, trackCost, getCostSummary } from './rate-limiter.js'
import type { AIModel } from '../types/ai.js'

// Mock Redis
vi.mock('ioredis', () => {
  const data = new Map<string, any>()
  const sorted = new Map<string, Array<[string, number]>>()

  return {
    default: class Redis {
      async zremrangebyscore(key: string, min: number, max: number) {
        const items = sorted.get(key) || []
        const filtered = items.filter(([, score]) => score < min || score > max)
        sorted.set(key, filtered)
        return filtered.length
      }

      async zcard(key: string) {
        return (sorted.get(key) || []).length
      }

      async zadd(key: string, score: number, member: string) {
        const items = sorted.get(key) || []
        items.push([member, score])
        sorted.set(key, items)
        return 1
      }

      async zrange(key: string, start: number, stop: number, withScores?: string) {
        const items = sorted.get(key) || []
        const slice = items.slice(start, stop + 1)
        if (withScores === 'WITHSCORES') {
          return slice.flatMap(([member, score]) => [member, score.toString()])
        }
        return slice.map(([member]) => member)
      }

      async expire(key: string, seconds: number) {
        return 1
      }

      async hincrby(key: string, field: string, increment: number) {
        const hash = data.get(key) || {}
        hash[field] = (hash[field] || 0) + increment
        data.set(key, hash)
        return hash[field]
      }

      async hincrbyfloat(key: string, field: string, increment: number) {
        const hash = data.get(key) || {}
        hash[field] = (hash[field] || 0) + increment
        data.set(key, hash)
        return hash[field]
      }

      async hgetall(key: string) {
        return data.get(key) || {}
      }
    }
  }
})

describe('Rate Limiter', () => {
  const orgId = 'test-org-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const model: AIModel = 'chatgpt'
      const result = await checkRateLimit(orgId, model)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('should track multiple requests', async () => {
      const model: AIModel = 'chatgpt'

      const result1 = await checkRateLimit(orgId, model)
      const result2 = await checkRateLimit(orgId, model)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBeLessThan(result1.remaining)
    })

    it('should respect different limits per model', async () => {
      const chatgpt = await checkRateLimit(orgId, 'chatgpt')
      const perplexity = await checkRateLimit(orgId, 'perplexity')

      // ChatGPT: 100 requests, Perplexity: 50 requests
      expect(chatgpt.remaining).toBeGreaterThan(perplexity.remaining)
    })
  })

  describe('trackCost', () => {
    it('should track API costs', async () => {
      const model: AIModel = 'chatgpt'

      await trackCost(orgId, model)
      await trackCost(orgId, model)

      const summary = await getCostSummary(orgId)

      expect(summary.byModel.chatgpt.requests).toBe(2)
      expect(summary.byModel.chatgpt.cost).toBeGreaterThan(0)
    })

    it('should calculate total cost across models', async () => {
      await trackCost(orgId, 'chatgpt')
      await trackCost(orgId, 'claude')
      await trackCost(orgId, 'gemini')

      const summary = await getCostSummary(orgId)

      expect(summary.total).toBeGreaterThan(0)
      expect(summary.byModel.chatgpt.requests).toBe(1)
      expect(summary.byModel.claude.requests).toBe(1)
      expect(summary.byModel.gemini.requests).toBe(1)
    })
  })

  describe('getCostSummary', () => {
    it('should return zero costs for new organization', async () => {
      const summary = await getCostSummary('new-org-456')

      expect(summary.total).toBe(0)
      expect(summary.byModel.chatgpt.requests).toBe(0)
      expect(summary.byModel.chatgpt.cost).toBe(0)
    })

    it('should aggregate costs correctly', async () => {
      const testOrg = 'cost-test-org'

      // Track some costs
      await trackCost(testOrg, 'chatgpt') // $0.03
      await trackCost(testOrg, 'chatgpt') // $0.03
      await trackCost(testOrg, 'claude')  // $0.04

      const summary = await getCostSummary(testOrg)

      expect(summary.byModel.chatgpt.requests).toBe(2)
      expect(summary.byModel.chatgpt.cost).toBeCloseTo(0.06, 2)
      expect(summary.byModel.claude.requests).toBe(1)
      expect(summary.byModel.claude.cost).toBeCloseTo(0.04, 2)
      expect(summary.total).toBeCloseTo(0.10, 2)
    })
  })
})
