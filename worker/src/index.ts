import 'dotenv/config'
import express from 'express'
import { initSentry, captureError, flushEvents } from './utils/sentry.js'

// Initialize Sentry as early as possible
initSentry()

const app = express()
const PORT = process.env.PORT || 8080

app.use(express.json())

let workersInitialized = false

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    workers: {
      initialized: workersInitialized,
      jobProcessor: workersInitialized ? 'running' : 'initializing',
      promptEvaluation: workersInitialized ? 'running' : 'initializing',
      // visibilityScanner: DEPRECATED - Now handled by browser extension
      // competitorAnalysis: DEPRECATED - Gap detection now in prompt-evaluation
      websiteAnalysis: workersInitialized ? 'running' : 'initializing',
      scanScheduler: workersInitialized ? 'running' : 'initializing',
      freshnessChecker: workersInitialized ? 'running' : 'initializing',
      reportGenerator: workersInitialized ? 'running' : 'initializing'
    }
  })
})

// Start HTTP server first
app.listen(PORT, async () => {
  console.log('Columbus Workers - Starting...')
  console.log(`Worker server running on port ${PORT}`)
  console.log('Supabase URL:', process.env.SUPABASE_URL)
  console.log('Redis URL:', process.env.REDIS_URL || 'redis://localhost:6379')

  // Initialize workers after HTTP server is up
  try {
    console.log('Initializing workers...')
    // NOTE: visibilityScanWorker is DEPRECATED - Now handled by browser extension
    // NOTE: competitorAnalysisWorker is DEPRECATED - Gap detection now in prompt-evaluation
    const { promptEvaluationWorker } = await import('./queue/prompt-evaluation.js')
    const { websiteAnalysisWorker } = await import('./queue/website-analysis.js')
    const { scanSchedulerWorker } = await import('./queue/scan-scheduler.js')
    const { freshnessCheckWorker, scheduleRecurringCheck } = await import('./queue/freshness-checker.js')
    const { reportGenerationWorker } = await import('./queue/report-generator.js')
    const { jobProcessor } = await import('./queue/job-processor.js')

    // Schedule recurring freshness checks
    await scheduleRecurringCheck()

    workersInitialized = true
    console.log('Workers initialized:')
    console.log('- Job Processor: Running (polls database every 5 seconds)')
    console.log('- Prompt Evaluation Worker: Running (evaluates AI responses & detects gaps)')
    console.log('- Visibility Scanner: DEPRECATED (now handled by browser extension)')
    console.log('- Competitor Analysis Worker: DEPRECATED (gap detection now in prompt-evaluation)')
    console.log('- Website Analysis Worker: Running')
    console.log('- Scan Scheduler Worker: Running (checks every 6 hours)')
    console.log('- Freshness Checker Worker: Running (checks every 6 hours)')
    console.log('- Report Generator Worker: Running')

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down workers...')
      await jobProcessor.stop()
      await Promise.all([
        promptEvaluationWorker.close(),
        websiteAnalysisWorker.close(),
        scanSchedulerWorker.close(),
        freshnessCheckWorker.close(),
        reportGenerationWorker.close()
      ])
      // Flush Sentry events before exit
      await flushEvents()
      process.exit(0)
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  } catch (error) {
    console.error('Error initializing workers:', error)
    captureError(error as Error, {
      tags: { context: 'worker-initialization' },
      level: 'fatal'
    })
    console.error('Server will continue running for health checks, but workers are not operational')
  }
})
