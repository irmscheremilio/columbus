import { Queue } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null
})

export const visibilityScanQueue = new Queue('visibility-scans', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 50,
    },
  },
})

export interface VisibilityScanJobData {
  organizationId: string
  productId?: string
  promptIds?: string[]
}

export async function queueVisibilityScan(data: VisibilityScanJobData) {
  return await visibilityScanQueue.add('scan', data, {
    priority: 1,
  })
}
