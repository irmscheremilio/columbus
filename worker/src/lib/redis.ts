import Redis from 'ioredis'

export const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redisConnection.on('connect', () => {
  console.log('✓ Redis connected')
})

redisConnection.on('error', (error) => {
  console.error('Redis connection error:', error)
})
