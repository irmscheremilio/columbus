import { Queue } from 'bullmq'
import { redisConnection } from '../lib/redis.js'

export interface WelcomeEmailJob {
  userEmail: string
  userName: string
}

export interface ScanCompleteEmailJob {
  userEmail: string
  userName: string
  scanResults: {
    brandName: string
    overallScore: number
    totalMentions: number
    recommendations: number
  }
}

export interface WeeklyReportEmailJob {
  userEmail: string
  userName: string
  reportData: {
    brandName: string
    currentScore: number
    previousScore: number | null
    scansThisWeek: number
    topRecommendations: Array<{
      title: string
      impact: string
      status: string
    }>
  }
}

export interface CriticalAlertEmailJob {
  userEmail: string
  userName: string
  alertData: {
    brandName: string
    previousScore: number
    currentScore: number
    dropPercentage: number
  }
}

export const emailQueue = new Queue('email-notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failures for 7 days
    },
  },
})
