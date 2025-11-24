import Redis from 'ioredis'

/**
 * Create Redis connection from REDIS_URL or fallback to host/port
 */
export function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL

  if (redisUrl) {
    // Use full Redis URL (Railway, Heroku, etc.)
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    })
  }

  // Fallback to host/port for local development
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  })
}
