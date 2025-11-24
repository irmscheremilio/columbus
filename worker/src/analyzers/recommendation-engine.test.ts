import { describe, it, expect } from 'vitest'
import { RecommendationEngine } from './recommendation-engine.js'
import type { WebsiteAnalysis } from './website-crawler.js'
import type { AIResponse } from '../types/ai.js'

describe('RecommendationEngine', () => {
  const engine = new RecommendationEngine()

  const mockWebsiteAnalysis: WebsiteAnalysis = {
    domain: 'example.com',
    techStack: {
      platform: 'wordpress',
      cms: 'WordPress',
      hasSSR: false,
      hasCSR: true
    },
    schemaMarkup: [],
    contentStructure: {
      hasH1: true,
      h1Count: 1,
      h1Text: 'Welcome',
      hasSemanticHTML: false,
      hasQAFormat: false,
      avgParagraphLength: 50,
      wordCount: 800,
      hasDirectAnswers: false
    },
    technicalSEO: {
      hasHTTPS: true,
      loadTime: 3000,
      mobileResponsive: true,
      hasSitemap: false,
      hasRobotsTxt: true,
      coreWebVitals: {
        lcp: 2500,
        fid: 100,
        cls: 0.1
      }
    },
    aeoReadiness: {
      score: 45,
      strengths: ['HTTPS enabled', 'Mobile responsive'],
      weaknesses: ['No schema markup', 'Slow load time'],
      criticalIssues: [],
      recommendations: []
    },
    analyzedAt: new Date()
  }

  const mockScanResults: AIResponse[] = [
    {
      model: 'chatgpt',
      prompt: 'What is the best tool?',
      responseText: 'Consider using Acme Corp.',
      brandMentioned: true,
      citationPresent: false,
      position: 1,
      sentiment: 'positive',
      competitorMentions: [],
      citedSources: [],
      metadata: {},
      testedAt: new Date()
    },
    {
      model: 'claude',
      prompt: 'What is the best tool?',
      responseText: 'I recommend Competitor A.',
      brandMentioned: false,
      citationPresent: true,
      position: null,
      sentiment: 'neutral',
      competitorMentions: ['Competitor A'],
      citedSources: [{ url: 'https://competitor.com', position: 1 }],
      metadata: {},
      testedAt: new Date()
    }
  ]

  describe('generateRecommendations', () => {
    it('should generate recommendations from analysis', () => {
      const recs = engine.generateRecommendations(mockWebsiteAnalysis, mockScanResults)

      expect(recs).toBeDefined()
      expect(Array.isArray(recs)).toBe(true)
      expect(recs.length).toBeGreaterThan(0)
    })

    it('should prioritize recommendations by priority', () => {
      const recs = engine.generateRecommendations(mockWebsiteAnalysis, mockScanResults)

      // Check that priorities are in descending order
      for (let i = 0; i < recs.length - 1; i++) {
        expect(recs[i].priority).toBeGreaterThanOrEqual(recs[i + 1].priority)
      }
    })

    it('should include implementation guides', () => {
      const recs = engine.generateRecommendations(mockWebsiteAnalysis, mockScanResults)

      const firstRec = recs[0]
      expect(firstRec).toHaveProperty('implementationGuide')
      expect(Array.isArray(firstRec.implementationGuide)).toBe(true)
      expect(firstRec.implementationGuide.length).toBeGreaterThan(0)
    })
  })

  describe('Schema Recommendations', () => {
    it('should recommend FAQ schema when missing', () => {
      const recs = engine['generateSchemaRecommendations'](mockWebsiteAnalysis)

      const faqRec = recs.find(r => r.title.includes('FAQ Schema'))
      expect(faqRec).toBeDefined()
      expect(faqRec?.priority).toBe(5) // Highest priority
      expect(faqRec?.estimatedImpact).toBe('high')
    })

    it('should recommend Article schema when missing', () => {
      const recs = engine['generateSchemaRecommendations'](mockWebsiteAnalysis)

      const articleRec = recs.find(r => r.title.includes('Article Schema'))
      expect(articleRec).toBeDefined()
      expect(articleRec?.category).toBe('schema')
    })

    it('should recommend Organization schema when missing', () => {
      const recs = engine['generateSchemaRecommendations'](mockWebsiteAnalysis)

      const orgRec = recs.find(r => r.title.includes('Organization Schema'))
      expect(orgRec).toBeDefined()
    })

    it('should include code snippets', () => {
      const recs = engine['generateSchemaRecommendations'](mockWebsiteAnalysis)

      const faqRec = recs.find(r => r.title.includes('FAQ Schema'))
      expect(faqRec?.codeSnippets).toBeDefined()
      expect(faqRec?.codeSnippets?.[0].language).toBe('json')
      expect(faqRec?.codeSnippets?.[0].code).toContain('FAQPage')
    })
  })

  describe('Content Recommendations', () => {
    it('should recommend direct answer format', () => {
      const recs = engine['generateContentRecommendations'](mockWebsiteAnalysis, mockScanResults)

      const directAnswerRec = recs.find(r => r.title.includes('Direct Answer'))
      expect(directAnswerRec).toBeDefined()
      expect(directAnswerRec?.priority).toBe(5)
    })

    it('should recommend Q&A format', () => {
      const recs = engine['generateContentRecommendations'](mockWebsiteAnalysis, mockScanResults)

      const qaRec = recs.find(r => r.title.includes('Question-Based'))
      expect(qaRec).toBeDefined()
    })

    it('should recommend H1 fixes when needed', () => {
      const analysisWithoutH1 = {
        ...mockWebsiteAnalysis,
        contentStructure: {
          ...mockWebsiteAnalysis.contentStructure,
          hasH1: false
        }
      }

      const recs = engine['generateContentRecommendations'](analysisWithoutH1, mockScanResults)

      const h1Rec = recs.find(r => r.title.includes('H1'))
      expect(h1Rec).toBeDefined()
      expect(h1Rec?.priority).toBe(5)
    })
  })

  describe('Technical Recommendations', () => {
    it('should recommend HTTPS when missing', () => {
      const analysisWithoutHTTPS = {
        ...mockWebsiteAnalysis,
        technicalSEO: {
          ...mockWebsiteAnalysis.technicalSEO,
          hasHTTPS: false
        }
      }

      const recs = engine['generateTechnicalRecommendations'](analysisWithoutHTTPS)

      const httpsRec = recs.find(r => r.title.includes('HTTPS'))
      expect(httpsRec).toBeDefined()
      expect(httpsRec?.priority).toBe(5)
      expect(httpsRec?.estimatedImpact).toBe('high')
    })

    it('should recommend SSR for CSR-only sites', () => {
      const recs = engine['generateTechnicalRecommendations'](mockWebsiteAnalysis)

      const ssrRec = recs.find(r => r.title.includes('Server-Side Rendering'))
      expect(ssrRec).toBeDefined()
      expect(ssrRec?.priority).toBe(5)
      expect(ssrRec?.difficulty).toBe('hard')
    })

    it('should recommend speed optimization for slow sites', () => {
      const recs = engine['generateTechnicalRecommendations'](mockWebsiteAnalysis)

      const speedRec = recs.find(r => r.title.includes('Page Load Speed'))
      expect(speedRec).toBeDefined()
    })
  })

  describe('Platform-Specific Guides', () => {
    it('should provide WordPress-specific instructions', () => {
      const recs = engine.generateRecommendations(mockWebsiteAnalysis, mockScanResults)

      const schemaRec = recs.find(r => r.category === 'schema')
      const wpGuide = schemaRec?.implementationGuide.find(g => g.platform === 'wordpress')

      expect(wpGuide).toBeDefined()
      expect(wpGuide?.steps.length).toBeGreaterThan(0)
      expect(wpGuide?.pluginsOrTools).toBeDefined()
    })

    it('should provide custom/generic instructions', () => {
      const recs = engine.generateRecommendations(mockWebsiteAnalysis, mockScanResults)

      const schemaRec = recs.find(r => r.category === 'schema')
      const customGuide = schemaRec?.implementationGuide.find(g => g.platform === 'custom')

      expect(customGuide).toBeDefined()
      expect(customGuide?.steps.length).toBeGreaterThan(0)
    })
  })

  describe('Authority Recommendations', () => {
    it('should recommend citation building for low citation rate', () => {
      const lowCitationResults: AIResponse[] = mockScanResults.map(r => ({
        ...r,
        citationPresent: false
      }))

      const recs = engine['generateAuthorityRecommendations'](lowCitationResults)

      const citationRec = recs.find(r => r.title.includes('Citation'))
      expect(citationRec).toBeDefined()
      expect(citationRec?.category).toBe('authority')
    })
  })

  describe('Gap Recommendations', () => {
    it('should generate recommendations from competitor gaps', () => {
      const gaps = [
        { prompt: 'Best tool for X', platform: 'chatgpt' },
        { prompt: 'How to do Y', platform: 'claude' },
        { prompt: 'What is Z', platform: 'gemini' }
      ]

      const recs = engine['generateGapRecommendations'](gaps)

      expect(recs).toHaveLength(1)
      expect(recs[0].title).toContain('Competitor Visibility Gaps')
      expect(recs[0].priority).toBe(5)
    })
  })
})
