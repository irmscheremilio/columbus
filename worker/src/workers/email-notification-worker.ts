import { Worker, Job } from 'bullmq'
import { redisConnection } from '../lib/redis.js'
import { emailService } from '../lib/email.js'
import type {
  WelcomeEmailJob,
  ScanCompleteEmailJob,
  WeeklyReportEmailJob,
  CriticalAlertEmailJob,
} from '../queues/email-notifications.js'

type EmailJob = WelcomeEmailJob | ScanCompleteEmailJob | WeeklyReportEmailJob | CriticalAlertEmailJob

async function processEmailJob(job: Job<EmailJob & { type: string }>) {
  const { type, ...data } = job.data

  console.log(`Processing ${type} email for ${data.userEmail}`)

  try {
    switch (type) {
      case 'welcome':
        await emailService.sendWelcomeEmail(
          (data as WelcomeEmailJob).userEmail,
          (data as WelcomeEmailJob).userName
        )
        break

      case 'scan-complete':
        await emailService.sendScanCompleteEmail(
          (data as ScanCompleteEmailJob).userEmail,
          (data as ScanCompleteEmailJob).userName,
          (data as ScanCompleteEmailJob).scanResults
        )
        break

      case 'weekly-report':
        await emailService.sendWeeklyReport(
          (data as WeeklyReportEmailJob).userEmail,
          (data as WeeklyReportEmailJob).userName,
          (data as WeeklyReportEmailJob).reportData
        )
        break

      case 'critical-alert':
        await emailService.sendCriticalAlert(
          (data as CriticalAlertEmailJob).userEmail,
          (data as CriticalAlertEmailJob).userName,
          (data as CriticalAlertEmailJob).alertData
        )
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    console.log(`✓ ${type} email sent to ${data.userEmail}`)
  } catch (error) {
    console.error(`✗ Failed to send ${type} email:`, error)
    throw error // Re-throw to trigger retry
  }
}

export const emailWorker = new Worker('email-notifications', processEmailJob, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 emails concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second (to respect email provider rate limits)
  },
})

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`)
})

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message)
})

emailWorker.on('error', (err) => {
  console.error('Email worker error:', err)
})

console.log('📧 Email Notification Worker started')
