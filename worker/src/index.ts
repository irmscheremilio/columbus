import 'dotenv/config'
import express from 'express'

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
      visibilityScanner: workersInitialized ? 'running' : 'initializing',
      competitorAnalysis: workersInitialized ? 'running' : 'initializing',
      websiteAnalysis: workersInitialized ? 'running' : 'initializing',
      scanScheduler: workersInitialized ? 'running' : 'initializing'
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
    const { visibilityScanWorker } = await import('./queue/visibility-scanner.js')
    const { competitorAnalysisWorker } = await import('./queue/competitor-analysis.js')
    const { websiteAnalysisWorker } = await import('./queue/website-analysis.js')
    const { scanSchedulerWorker } = await import('./queue/scan-scheduler.js')
    const { jobProcessor } = await import('./queue/job-processor.js')

    workersInitialized = true
    console.log('Workers initialized:')
    console.log('- Job Processor: Running (polls database every 5 seconds)')
    console.log('- Visibility Scanner Worker: Running')
    console.log('- Competitor Analysis Worker: Running')
    console.log('- Website Analysis Worker: Running')
    console.log('- Scan Scheduler Worker: Running (checks every 6 hours)')

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down workers...')
      await jobProcessor.stop()
      await Promise.all([
        visibilityScanWorker.close(),
        competitorAnalysisWorker.close(),
        websiteAnalysisWorker.close(),
        scanSchedulerWorker.close()
      ])
      process.exit(0)
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  } catch (error) {
    console.error('Error initializing workers:', error)
    console.error('Server will continue running for health checks, but workers are not operational')
  }
})
