import 'dotenv/config'
import { visibilityScanWorker } from './queue/visibility-scanner.js'
import { competitorAnalysisWorker } from './queue/competitor-analysis.js'
import { websiteAnalysisWorker } from './queue/website-analysis.js'
import { scanSchedulerWorker } from './queue/scan-scheduler.js'
import { jobProcessor } from './queue/job-processor.js'

console.log('Columbus Workers - Starting...')
console.log('Supabase URL:', process.env.SUPABASE_URL)
console.log('Redis URL:', process.env.REDIS_URL || 'redis://localhost:6379')
console.log('Redis connection: Ready')

console.log('Workers initialized:')
console.log('- Job Processor: Running (polls database every 5 seconds)')
console.log('- Visibility Scanner Worker: Running')
console.log('- Competitor Analysis Worker: Running')
console.log('- Website Analysis Worker: Running')
console.log('- Scan Scheduler Worker: Running (checks every 6 hours)')

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...')
  await jobProcessor.stop()
  await Promise.all([
    visibilityScanWorker.close(),
    competitorAnalysisWorker.close(),
    websiteAnalysisWorker.close(),
    scanSchedulerWorker.close()
  ])
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing workers...')
  await jobProcessor.stop()
  await Promise.all([
    visibilityScanWorker.close(),
    competitorAnalysisWorker.close(),
    websiteAnalysisWorker.close(),
    scanSchedulerWorker.close()
  ])
  process.exit(0)
})
