# AEO General Best Practices

This document contains universal Answer Engine Optimization (AEO) best practices that apply across all AI platforms.

## How AI Models Select Sources

AI models generate different responses to identical prompts and cite completely different sources across platforms (only 11% overlap between ChatGPT and Perplexity). Key factors:

### Freshness (Strongest Factor)
- 65% of AI bot hits target content published within past year
- 79% from last 2 years; 89% from last 3 years
- Only 6% on content older than 6 years
- LLMs can shift publication rankings by up to 95 positions based on perceived freshness
- **Recommendation:** Update content every 48-72 hours with new data points, statistics, or expanded sections

### Content Depth
- 2,000+ words for comprehensive coverage
- AI platforms prioritize content with expert-level detail and proprietary data
- Focus on BOFU (Bottom-of-Funnel) content - traffic to top-of-funnel content has declined significantly
- Quality over arbitrary word count - answer should dictate length

### Domain Authority
- .com domains cited 80%+, .org 11.29%
- Correlation 0.37 between backlinks and AI visibility (weaker than traditional SEO's 0.65+)
- Citations (brand mentions) are more important than links for AEO

## Technical Factors

### Schema Markup (Critical Priority)
1. **FAQPage schema** - explicitly signals Q&A format for AI extraction
2. **HowTo schema** - trusted for step-by-step instructions
3. **Article/BlogPosting** - establishes content authority (headline, author, publish date)
4. **Product schema** - tags price, availability, reviews, pros/cons for e-commerce
5. **Organization schema** - anchors brand identity

**Implementation:** JSON-LD strongly preferred over Microdata/RDFa; place in `<head>` or before closing `</body>`

### Three-Layer Schema Model
1. **Sitewide Identity** - Organization schema with logo, sameAs, contactPoint
2. **Page Context** - WebPage declaration, breadcrumbs, mainEntity
3. **Content Type** - FAQPage, HowTo, Article specific markup

### HTML Structure
- Use semantic HTML5 tags: `<article>`, `<section>`, `<header>`, `<main>`, `<aside>`
- One H1 per page, H2s for major sections, H3s for subsections
- Question-based headings matching user queries
- Descriptive, unambiguous headings; self-contained sections

### JavaScript Rendering (Critical Limitation)
Most AI crawlers CANNOT execute JavaScript:
- ChatGPT's OAI-SearchBot: ❌ No JS execution
- ClaudeBot: ❌ No JS execution
- PerplexityBot: ❌ No JS execution
- Only Google/Gemini reliably renders JavaScript ✅

**Solutions:**
- Server-Side Rendering (SSR) - Next.js, Nuxt.js, Angular Universal
- Static Site Generation (SSG) - pre-rendered HTML at build time
- Prerendering services - Prerender.io generates static snapshots

### Core Web Vitals Impact
- LCP ≤2.5s: Sites 47% more likely to appear in AI results
- CLS ≤0.1: 29.8% more likely to be included in AI summaries
- INP ≤200ms: Significant conversion improvements
- TTFB <200ms: 22% increase in citation density

## Content Factors

### Natural Language vs Keywords
- AI prompts are far more conversational than traditional search
- Write for conversational queries ("What is the best word count?" NOT "word count articles required")
- Focus on clarity and relevance over keyword density
- Use conversational headers like "How do I..." or "What makes..."
- Favor plain, factual, non-promotional tone

### Q&A Format (Highly Effective)
- 40-60 word direct answers placed immediately after question headings
- Start answer with direct response first, then elaborate
- Use natural language Q&A format explicitly
- Each Q&A pair should be extractable as standalone content

### Content Format Preferences (Priority Order)
1. **Lists and Bullet Points** - highly effective for breaking complex details
2. **Tables** - excellent for comparisons and structured data
3. **Direct Q&A Sections** - can be lifted word-for-word by AI
4. **Summary Boxes/TL;DR** - place at beginning; condense key points
5. **Short Paragraphs** - 2-4 sentences maximum; single idea per paragraph

### Authoritative Citations
- Cite primary sources for all statistics
- Include proper attribution for data points
- Link to studies, research papers, authoritative sources
- Cross-reference facts across multiple sources
- Quote recognized experts with credentials clearly stated

## Authority Factors

### High-Authority Source Citations (Critical)
- AI systems operate on trust graphs, not link graphs
- Brand mentions 3.2× more frequent than citations in ChatGPT
- Mentions more stable and less volatile than links

### High-Citation Platform Priority
- **Wikipedia** - 5× boosted in LLM training data; 7.8% of total ChatGPT citations
- **Reddit** - Licensed for LLM training; 6.6% of Perplexity citations
- **Forbes, G2, Industry sites** - Trusted directories and review platforms
- **News outlets** - OpenAI partnerships increase value
- **Academic sources** - Higher trust for research-backed claims

### Third-Party Directories
- For subjective queries, directories peak at 46.3% citation rate
- Complete profiles on major platforms with accurate, up-to-date info
- Priority: G2, Capterra, Trustpilot, Google Business Profile, industry-specific sites

### E-E-A-T (Core Ranking Factor)
1. **Experience** - First-hand knowledge and real-world application
2. **Expertise** - Deep subject matter knowledge, critical for YMYL topics
3. **Authoritativeness** - Reputation and industry recognition
4. **Trustworthiness** - Factual accuracy and transparency

## Proven Effective Techniques

### High-Impact Results
- Semantic URLs (5-7 words): +11.4% more citations
- Logical heading hierarchies: 100% citation rate doubling
- Comprehensive topic coverage: +40-60% improvement within 3-6 months
- AEO-optimized content: 3× higher citation rates vs traditionally optimized
- Original data inclusion: +75% increase in AI-attributed lead generation
- FAQ schema implementation: +50% uptick in AI snippet features

### Time-to-Impact
- **Quick Wins (4-8 Weeks):** FAQ optimization with schema, direct answer formatting
- **Medium-Term (3-6 Months):** Consistent prominent placement, brand authority
- **Long-Term (6-12 Months):** Comprehensive authority building, category dominance

## AI Crawler Behavior

### Respects robots.txt
- GPTBot (training)
- OAI-SearchBot (search)
- ClaudeBot (training)
- PerplexityBot (indexing)

### Generally ignores robots.txt
- ChatGPT-User (user-initiated browsing)

### robots.txt Best Practice
```
# Allow search indexing
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

# Block training (optional)
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /
```
