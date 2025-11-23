import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { supabase } from '../lib/supabase.js'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null
})

export function startRecommendationWorker() {
  const worker = new Worker(
    'recommendation-generation',
    async (job) => {
      const { organizationId } = job.data

      console.log(`Generating recommendations for organization: ${organizationId}`)

      try {
        // Get latest scan results
        const { data: results } = await supabase
          .from('prompt_results')
          .select('*')
          .eq('organization_id', organizationId)
          .order('tested_at', { ascending: false })
          .limit(100)

        if (!results || results.length === 0) {
          console.log('No scan results found')
          return { success: true, recommendations: [] }
        }

        // Analyze results and generate recommendations
        const recommendations = []

        // Check for missing brand mentions
        const missingMentions = results.filter(r => !r.brand_mentioned)
        if (missingMentions.length > results.length * 0.5) {
          recommendations.push({
            title: 'Add comprehensive FAQs to your website',
            description: 'Over 50% of AI responses don\'t mention your brand. Adding a detailed FAQ page can help AI models understand and recommend your product.',
            category: 'content',
            priority: 5,
            estimated_impact: 'high',
            implementation_guide: {
              wordpress: {
                steps: [
                  'Create a new page called "FAQ" or "Frequently Asked Questions"',
                  'Add common questions about your product/service',
                  'Include detailed answers with specific features and benefits',
                  'Add FAQ schema markup (code provided below)'
                ],
                difficulty: 'easy',
                estimatedTime: '1-2 hours'
              },
              custom: {
                steps: [
                  'Create an FAQ section on your website',
                  'Structure content with question-answer pairs',
                  'Implement FAQ schema markup',
                  'Ensure content is accessible to crawlers'
                ],
                difficulty: 'medium',
                estimatedTime: '2-3 hours'
              }
            }
          })
        }

        // Check for missing citations
        const missingCitations = results.filter(r => r.brand_mentioned && !r.citation_present)
        if (missingCitations.length > results.length * 0.3) {
          recommendations.push({
            title: 'Add Schema.org structured data markup',
            description: 'Your brand is mentioned but AI engines don\'t cite your website. Adding schema markup helps AI models link mentions to your site.',
            category: 'schema',
            priority: 5,
            estimated_impact: 'high',
            implementation_guide: {
              wordpress: {
                steps: [
                  'Install "Schema Pro" or "Rank Math" plugin',
                  'Enable Organization schema',
                  'Add Product/Service schema to key pages',
                  'Validate with Google\'s Rich Results Test'
                ],
                difficulty: 'easy',
                estimatedTime: '30 minutes'
              },
              shopify: {
                steps: [
                  'Use "JSON-LD for SEO" app',
                  'Configure Organization and Product schemas',
                  'Add to theme.liquid file',
                  'Test with Schema Validator'
                ],
                difficulty: 'medium',
                estimatedTime: '1 hour'
              }
            }
          })
        }

        // Check sentiment
        const negativeMentions = results.filter(r => r.sentiment === 'negative')
        if (negativeMentions.length > 0) {
          recommendations.push({
            title: 'Address negative perception in AI responses',
            description: 'Some AI responses show negative sentiment. Consider improving your online reputation and customer reviews.',
            category: 'authority',
            priority: 4,
            estimated_impact: 'medium',
            implementation_guide: {
              general: {
                steps: [
                  'Request reviews from satisfied customers',
                  'Respond to negative reviews professionally',
                  'Publish case studies and success stories',
                  'Improve product documentation'
                ],
                difficulty: 'medium',
                estimatedTime: 'Ongoing'
              }
            }
          })
        }

        // Store recommendations in database
        for (const rec of recommendations) {
          await supabase.from('fix_recommendations').insert({
            organization_id: organizationId,
            ...rec
          })
        }

        console.log(`Generated ${recommendations.length} recommendations`)
        return { success: true, recommendations }
      } catch (error: any) {
        console.error('Recommendation generation error:', error)
        throw error
      }
    },
    {
      connection,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    console.log(`Recommendation job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Recommendation job ${job?.id} failed:`, err)
  })

  return worker
}
