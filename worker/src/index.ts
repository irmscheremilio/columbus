import dotenv from 'dotenv'
import express from 'express'
import { startVisibilityScanWorker } from './workers/visibility-scanner.js'
import { startRecommendationWorker } from './workers/recommendation-generator.js'
import { emailWorker } from './workers/email-notification-worker.js'
import { queueVisibilityScan } from './queues/visibility-scan.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API endpoint to queue a visibility scan
app.post('/api/scan/queue', async (req, res) => {
  const { apiSecret, organizationId, promptIds } = req.body

  // Verify API secret
  if (apiSecret !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' })
  }

  try {
    const job = await queueVisibilityScan({
      organizationId,
      promptIds: promptIds || [],
    })

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued'
    })
  } catch (error: any) {
    console.error('Error queueing scan:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start workers
startVisibilityScanWorker()
startRecommendationWorker()

app.listen(PORT, () => {
  console.log(`Worker server running on port ${PORT}`)
  console.log('Workers started:')
  console.log('- Visibility Scanner')
  console.log('- Recommendation Generator')
  console.log('- Email Notification Worker')
})
