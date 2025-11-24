import type { WebsiteAnalysis } from './website-crawler.js'
import type { AIResponse } from '../types/ai.js'

export interface Recommendation {
  title: string
  description: string
  category: 'schema' | 'content' | 'technical' | 'authority'
  priority: number // 1-5 (5 = highest)
  estimatedImpact: 'low' | 'medium' | 'high'
  implementationGuide: PlatformGuide[]
  codeSnippets?: CodeSnippet[]
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface PlatformGuide {
  platform: string // 'wordpress', 'shopify', 'webflow', 'custom'
  steps: string[]
  pluginsOrTools?: string[]
  videoUrl?: string
}

export interface CodeSnippet {
  language: string
  code: string
  description: string
  filename?: string
}

/**
 * Generate actionable recommendations based on website analysis and scan results
 */
export class RecommendationEngine {
  /**
   * Generate recommendations from website analysis and visibility scan results
   */
  generateRecommendations(
    websiteAnalysis: WebsiteAnalysis,
    scanResults: AIResponse[],
    competitorGaps?: any[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Schema markup recommendations
    recommendations.push(...this.generateSchemaRecommendations(websiteAnalysis))

    // Content structure recommendations
    recommendations.push(...this.generateContentRecommendations(websiteAnalysis, scanResults))

    // Technical SEO recommendations
    recommendations.push(...this.generateTechnicalRecommendations(websiteAnalysis))

    // Authority & citation recommendations
    recommendations.push(...this.generateAuthorityRecommendations(scanResults))

    // Competitor gap recommendations
    if (competitorGaps && competitorGaps.length > 0) {
      recommendations.push(...this.generateGapRecommendations(competitorGaps))
    }

    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Generate schema markup recommendations
   */
  private generateSchemaRecommendations(analysis: WebsiteAnalysis): Recommendation[] {
    const recs: Recommendation[] = []
    const { schemaMarkup, techStack } = analysis

    const hasFAQSchema = schemaMarkup.some(s => s.type === 'FAQPage')
    const hasArticleSchema = schemaMarkup.some(s => s.type === 'Article' || s.type === 'BlogPosting')
    const hasOrgSchema = schemaMarkup.some(s => s.type === 'Organization')

    // FAQ Schema recommendation
    if (!hasFAQSchema) {
      recs.push({
        title: 'Add FAQ Schema Markup',
        description: 'FAQ schema is the #1 most effective AEO optimization. AI models explicitly look for structured Q&A content. Research shows 40-60% improvement in visibility after implementation.',
        category: 'schema',
        priority: 5,
        estimatedImpact: 'high',
        estimatedTime: '15-30 minutes',
        difficulty: 'easy',
        implementationGuide: this.getFAQSchemaGuides(techStack.platform),
        codeSnippets: [this.getFAQSchemaSnippet()]
      })
    }

    // Article Schema recommendation
    if (!hasArticleSchema) {
      recs.push({
        title: 'Add Article Schema to Content Pages',
        description: 'Article schema establishes content authority with headline, author, publish date, and description. This helps AI models understand content context and trustworthiness.',
        category: 'schema',
        priority: 4,
        estimatedImpact: 'medium',
        estimatedTime: '10-20 minutes',
        difficulty: 'easy',
        implementationGuide: this.getArticleSchemaGuides(techStack.platform),
        codeSnippets: [this.getArticleSchemaSnippet()]
      })
    }

    // Organization Schema recommendation
    if (!hasOrgSchema) {
      recs.push({
        title: 'Add Organization Schema',
        description: 'Organization schema anchors your brand identity across AI platforms. Include logo, social profiles, and contact information to establish brand recognition.',
        category: 'schema',
        priority: 3,
        estimatedImpact: 'medium',
        estimatedTime: '10 minutes',
        difficulty: 'easy',
        implementationGuide: this.getOrganizationSchemaGuides(techStack.platform),
        codeSnippets: [this.getOrganizationSchemaSnippet()]
      })
    }

    return recs
  }

  /**
   * Generate content structure recommendations
   */
  private generateContentRecommendations(analysis: WebsiteAnalysis, scanResults: AIResponse[]): Recommendation[] {
    const recs: Recommendation[] = []
    const { contentStructure } = analysis

    // Direct answer format
    if (!contentStructure.hasDirectAnswers) {
      recs.push({
        title: 'Add Direct Answer Format (40-60 Words)',
        description: 'AI models prioritize concise, direct answers. Place 40-60 word summaries immediately after question headings. This dramatically increases citation rate.',
        category: 'content',
        priority: 5,
        estimatedImpact: 'high',
        estimatedTime: '2-3 hours',
        difficulty: 'medium',
        implementationGuide: [{
          platform: 'all',
          steps: [
            'Identify your top 10 pages with question-based content',
            'For each question heading, add a concise summary paragraph',
            'Keep summaries between 40-60 words',
            'Start with the direct answer, then elaborate below',
            'Use plain, factual language without promotional tone',
            'Include specific data points and numbers where possible'
          ]
        }]
      })
    }

    // Q&A Format
    if (!contentStructure.hasQAFormat) {
      recs.push({
        title: 'Restructure Content with Question-Based Headings',
        description: 'Convert topic-based headings to question format (What, How, Why). Research shows 3.2× higher citation rate for Q&A formatted content.',
        category: 'content',
        priority: 4,
        estimatedImpact: 'high',
        estimatedTime: '3-4 hours',
        difficulty: 'medium',
        implementationGuide: [{
          platform: 'all',
          steps: [
            'Audit your existing H2/H3 headings',
            'Convert statements to questions: "Benefits of X" → "What are the benefits of X?"',
            'Focus on user intent keywords',
            'Ensure each question has a direct answer below',
            'Prioritize "how to" and "what is" formats',
            'Update at least 5-10 pages to start'
          ]
        }]
      })
    }

    // H1 issues
    if (!contentStructure.hasH1) {
      recs.push({
        title: 'Add H1 Tag to Every Page',
        description: 'CRITICAL: H1 tags are essential for AI content parsing. Every page must have exactly one H1 that clearly states the page topic.',
        category: 'content',
        priority: 5,
        estimatedImpact: 'high',
        estimatedTime: '1-2 hours',
        difficulty: 'easy',
        implementationGuide: this.getH1FixGuides(analysis.techStack.platform)
      })
    } else if (contentStructure.h1Count > 1) {
      recs.push({
        title: 'Fix Multiple H1 Tags',
        description: `Your pages have ${contentStructure.h1Count} H1 tags. Use only ONE H1 per page for proper content hierarchy.`,
        category: 'content',
        priority: 4,
        estimatedImpact: 'medium',
        estimatedTime: '1 hour',
        difficulty: 'easy',
        implementationGuide: this.getH1FixGuides(analysis.techStack.platform)
      })
    }

    // Semantic HTML
    if (!contentStructure.hasSemanticHTML) {
      recs.push({
        title: 'Use Semantic HTML5 Elements',
        description: 'AI crawlers use <article>, <section>, <header> tags to understand content purpose. Replace generic <div> tags with semantic elements.',
        category: 'technical',
        priority: 3,
        estimatedImpact: 'medium',
        estimatedTime: '2-3 hours',
        difficulty: 'medium',
        implementationGuide: [{
          platform: 'custom',
          steps: [
            'Wrap main content in <article> tag',
            'Use <section> for major content divisions',
            'Wrap page header in <header> tag',
            'Use <aside> for sidebars and supplementary content',
            'Wrap navigation in <nav> tag',
            'Use <footer> for page footer'
          ]
        }]
      })
    }

    return recs
  }

  /**
   * Generate technical SEO recommendations
   */
  private generateTechnicalRecommendations(analysis: WebsiteAnalysis): Recommendation[] {
    const recs: Recommendation[] = []
    const { techStack, technicalSEO } = analysis

    // HTTPS
    if (!technicalSEO.hasHTTPS) {
      recs.push({
        title: 'Enable HTTPS Immediately',
        description: 'CRITICAL: HTTPS is required for AI trust signals. Non-secure sites are deprioritized or excluded from AI responses.',
        category: 'technical',
        priority: 5,
        estimatedImpact: 'high',
        estimatedTime: '1-2 hours',
        difficulty: 'easy',
        implementationGuide: [{
          platform: 'all',
          steps: [
            'Get free SSL certificate from Let\'s Encrypt or Cloudflare',
            'Install certificate on your hosting provider',
            'Update site URL in CMS settings',
            'Add 301 redirects from HTTP to HTTPS',
            'Update internal links to use HTTPS',
            'Verify with SSL checker tools'
          ]
        }]
      })
    }

    // CSR without SSR
    if (techStack.hasCSR && !techStack.hasSSR) {
      recs.push({
        title: 'Implement Server-Side Rendering (SSR)',
        description: 'CRITICAL: Your site uses client-side rendering only. Most AI crawlers CANNOT execute JavaScript. Your content is invisible to 3 out of 4 AI platforms (only Gemini can see it).',
        category: 'technical',
        priority: 5,
        estimatedImpact: 'high',
        estimatedTime: '1-2 weeks',
        difficulty: 'hard',
        implementationGuide: this.getSSRGuides(techStack.jsFramework || 'React')
      })
    }

    // Page speed
    if (technicalSEO.loadTime > 2500) {
      recs.push({
        title: 'Optimize Page Load Speed',
        description: `Your load time is ${Math.round(technicalSEO.loadTime / 1000)}s. Research shows 47% higher AI citation rate for pages under 2.5s. Fast sites have 91% user retention vs slow sites.`,
        category: 'technical',
        priority: 4,
        estimatedImpact: 'high',
        estimatedTime: '1-2 days',
        difficulty: 'medium',
        implementationGuide: [{
          platform: 'all',
          steps: [
            'Compress images with tools like TinyPNG',
            'Enable browser caching',
            'Minify CSS and JavaScript',
            'Use a CDN for static assets',
            'Lazy load images below the fold',
            'Remove unused CSS/JS',
            'Consider using a performance plugin (WordPress) or optimization service'
          ]
        }]
      })
    }

    // Sitemap
    if (!technicalSEO.hasSitemap) {
      recs.push({
        title: 'Add Sitemap.xml',
        description: 'Sitemaps help AI crawlers discover all your pages. Essential for comprehensive visibility coverage.',
        category: 'technical',
        priority: 3,
        estimatedImpact: 'medium',
        estimatedTime: '15 minutes',
        difficulty: 'easy',
        implementationGuide: this.getSitemapGuides(techStack.platform)
      })
    }

    return recs
  }

  /**
   * Generate authority and citation recommendations
   */
  private generateAuthorityRecommendations(scanResults: AIResponse[]): Recommendation[] {
    const recs: Recommendation[] = []

    // Check if brand is being cited
    const citationRate = scanResults.filter(r => r.citationPresent).length / scanResults.length
    const mentionRate = scanResults.filter(r => r.brandMentioned).length / scanResults.length

    if (citationRate < 0.3) {
      recs.push({
        title: 'Get Listed on High-Authority Citation Sources',
        description: 'Your citation rate is low. Focus on getting mentioned on Wikipedia, industry directories (G2, Capterra), and authoritative review sites. These are primary sources for AI models.',
        category: 'authority',
        priority: 4,
        estimatedImpact: 'high',
        estimatedTime: 'Ongoing',
        difficulty: 'hard',
        implementationGuide: [{
          platform: 'all',
          steps: [
            'Complete profiles on G2, Capterra, Trustpilot',
            'Encourage customers to leave detailed reviews',
            'Create Wikipedia page (if criteria met)',
            'Get mentioned in industry publications',
            'Contribute expert quotes to journalists (HARO)',
            'Build relationships with industry bloggers',
            'Publish original research and data'
          ]
        }]
      })
    }

    return recs
  }

  /**
   * Generate gap recommendations based on competitor analysis
   */
  private generateGapRecommendations(gaps: any[]): Recommendation[] {
    const recs: Recommendation[] = []

    if (gaps.length > 0) {
      const topGaps = gaps.slice(0, 3) // Focus on top 3 gaps

      recs.push({
        title: `Fix ${gaps.length} Competitor Visibility Gaps`,
        description: `Competitors appear in ${gaps.length} prompts where you don't. Focus on these queries to capture market share.`,
        category: 'content',
        priority: 5,
        estimatedImpact: 'high',
        estimatedTime: '1-2 weeks',
        difficulty: 'medium',
        implementationGuide: [{
          platform: 'all',
          steps: [
            'Review the specific prompts where competitors appear',
            'Create dedicated content pages for these topics',
            'Include FAQ schema on these pages',
            'Use question-based headings',
            'Add 40-60 word direct answers',
            'Include comparison tables if relevant',
            'Link to authoritative sources',
            'Update content every 48-72 hours for freshness'
          ]
        }]
      })
    }

    return recs
  }

  // Platform-specific implementation guides

  private getFAQSchemaGuides(platform: string): PlatformGuide[] {
    const guides: PlatformGuide[] = []

    if (platform === 'wordpress') {
      guides.push({
        platform: 'wordpress',
        steps: [
          'Install "Schema Pro" or "Rank Math" plugin',
          'Navigate to page editor',
          'Add FAQ block or schema markup',
          'Enter your questions and answers',
          'Publish and validate with Google Rich Results Test',
          'Alternatively, add code manually to theme footer'
        ],
        pluginsOrTools: ['Schema Pro', 'Rank Math', 'Yoast SEO']
      })
    }

    if (platform === 'shopify') {
      guides.push({
        platform: 'shopify',
        steps: [
          'Install "JSON-LD for SEO" or similar app',
          'Or manually add schema to theme.liquid file',
          'Paste FAQ schema code before closing </head> tag',
          'Test with Google Rich Results Test',
          'Verify schema appears in page source'
        ],
        pluginsOrTools: ['JSON-LD for SEO', 'SEO Manager']
      })
    }

    // Custom/Generic guide
    guides.push({
      platform: 'custom',
      steps: [
        'Copy the FAQ schema code below',
        'Paste in <head> section or before closing </body> tag',
        'Replace example questions with your actual Q&A content',
        'Ensure JSON is valid (no trailing commas)',
        'Test with Google Rich Results Test',
        'Validate with schema.org validator'
      ]
    })

    return guides
  }

  private getArticleSchemaGuides(platform: string): PlatformGuide[] {
    // Similar structure to FAQ guides
    return [{
      platform: 'custom',
      steps: [
        'Add Article schema to blog posts and content pages',
        'Include headline, author, datePublished, dateModified',
        'Add author bio with credentials',
        'Include featured image',
        'Test with Google Rich Results Test'
      ]
    }]
  }

  private getOrganizationSchemaGuides(platform: string): PlatformGuide[] {
    return [{
      platform: 'custom',
      steps: [
        'Add Organization schema site-wide (header or footer)',
        'Include official brand name',
        'Add logo URL (1200x1200px recommended)',
        'Include social media profile URLs',
        'Add contact information',
        'Test with Google Rich Results Test'
      ]
    }]
  }

  private getH1FixGuides(platform: string): PlatformGuide[] {
    return [{
      platform: 'custom',
      steps: [
        'Audit all pages to find H1 issues',
        'Ensure each page has exactly ONE H1 tag',
        'H1 should clearly state the page topic',
        'Use H2-H6 for sub-headings',
        'Make H1 descriptive and keyword-rich',
        'Keep H1 under 70 characters when possible'
      ]
    }]
  }

  private getSSRGuides(framework: string): PlatformGuide[] {
    if (framework === 'React') {
      return [{
        platform: 'React',
        steps: [
          'Migrate to Next.js framework',
          'Convert pages to use getServerSideProps or getStaticProps',
          'Or implement React Server Components',
          'Alternative: Use prerendering service like Prerender.io',
          'Test that content appears in HTML source (View Page Source)',
          'Verify AI crawlers can see content'
        ],
        pluginsOrTools: ['Next.js', 'Prerender.io']
      }]
    }

    if (framework === 'Vue') {
      return [{
        platform: 'Vue',
        steps: [
          'Migrate to Nuxt.js framework',
          'Use SSR or SSG mode',
          'Alternative: Use prerendering service',
          'Test with View Page Source to verify content visibility'
        ],
        pluginsOrTools: ['Nuxt.js', 'Prerender.io']
      }]
    }

    return [{
      platform: 'custom',
      steps: [
        'Consider framework with built-in SSR (Next.js, Nuxt, SvelteKit)',
        'Or use prerendering service for existing app',
        'Critical: AI crawlers cannot execute JavaScript'
      ]
    }]
  }

  private getSitemapGuides(platform: string): PlatformGuide[] {
    if (platform === 'wordpress') {
      return [{
        platform: 'wordpress',
        steps: [
          'Install Yoast SEO or Rank Math plugin',
          'Sitemap automatically generated at /sitemap.xml',
          'Verify sitemap is accessible',
          'Submit to Google Search Console'
        ],
        pluginsOrTools: ['Yoast SEO', 'Rank Math']
      }]
    }

    return [{
      platform: 'custom',
      steps: [
        'Generate sitemap.xml file',
        'List all important pages',
        'Place in root directory (/sitemap.xml)',
        'Submit to Google Search Console',
        'Add reference in robots.txt'
      ]
    }]
  }

  // Code snippets

  private getFAQSchemaSnippet(): CodeSnippet {
    return {
      language: 'json',
      description: 'FAQ Page Schema Markup (JSON-LD)',
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is Answer Engine Optimization (AEO)?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Answer Engine Optimization (AEO) is the practice of optimizing your content to appear in AI-generated responses from platforms like ChatGPT, Claude, Gemini, and Perplexity. It focuses on structured data, direct answers, and content freshness."
    }
  }, {
    "@type": "Question",
    "name": "Why is AEO important in 2025?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "25% of organic search traffic is shifting to AI chatbots by 2026 according to Gartner. AEO ensures your brand remains visible as users increasingly rely on AI for research and recommendations."
    }
  }]
}
</script>`
    }
  }

  private getArticleSchemaSnippet(): CodeSnippet {
    return {
      language: 'json',
      description: 'Article Schema Markup (JSON-LD)',
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title Here",
  "description": "A brief summary of your article content",
  "image": "https://yourdomain.com/image.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://yourdomain.com/author"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Your Company",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yourdomain.com/logo.png"
    }
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-20"
}
</script>`
    }
  }

  private getOrganizationSchemaSnippet(): CodeSnippet {
    return {
      language: 'json',
      description: 'Organization Schema Markup (JSON-LD)',
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourcompany.com",
  "logo": "https://yourcompany.com/logo.png",
  "description": "Brief company description",
  "sameAs": [
    "https://twitter.com/yourcompany",
    "https://linkedin.com/company/yourcompany",
    "https://facebook.com/yourcompany"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service"
  }
}
</script>`
    }
  }
}
