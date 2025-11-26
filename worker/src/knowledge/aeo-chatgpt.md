# ChatGPT/SearchGPT Optimization

This document contains specific optimization strategies for ChatGPT and SearchGPT (OpenAI platforms).

## ChatGPT Statistics
- 700 million weekly active users (September 2025)
- >5 billion monthly visits (June 2025)
- 160% YoY growth
- Captured 1% of global search market (85 million daily searches)

## How ChatGPT Selects Sources

### Citation Patterns
- **Wikipedia dominates** at 7.8% of total citations (47.9% within top 10 sources)
- Reddit dropped from 60% to 10% in September 2024 (anti-bias adjustment)
- Average 5 domains cited per response
- 67% of ChatGPT's top 1,000 citations off-limits to marketers (Wikipedia, educational, homepages)

### Strongest Recency Bias
- 76.4% of cited pages updated in last 30 days (strongest among all platforms)
- Configuration reveals `use_freshness_scoring_profile: true` always enabled
- Uses reranker model "ret-rr-skysight-v3" with temporal scoring
- Reference URLs 393-458 days newer than Google organic results

### Key Selection Factors
1. **Recency bias** (strongest factor) - content freshness scoring always active
2. **Content type preferences:**
   - Wikipedia: 43%
   - Blogs: 21%
   - News: 27%
   - Comparison portals: 17%
   - Vendor blogs: <3% (rarely cited)
3. **Domain authority** - .com domains 80%+, .org 11.29%

### Technical Behavior
- Does NOT execute JavaScript (only fetches JS files)
- Query intent detection enabled
- Vocabulary search for better understanding

## ChatGPT-Specific Crawlers

### GPTBot
- **Purpose:** Training data collection (NOT ChatGPT search/browsing)
- **User-Agent:** `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)`
- Respects robots.txt directives
- Filters paywalls, PII, policy-violating content
- Does NOT execute JavaScript

### ChatGPT-User
- **Purpose:** On-demand web browsing triggered by user requests
- **User-Agent:** `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0`
- Generally ignores robots.txt (user-initiated requests)
- Unpredictable traffic patterns driven by user queries

### OAI-SearchBot
- **Purpose:** Powers SearchGPT and ChatGPT search functionality
- **User-Agent:** `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0`
- Respects robots.txt
- Real-time information retrieval

## Optimization Strategies for ChatGPT

### Content Strategy
1. **Update content frequently** - ChatGPT has the strongest recency bias (76.4% from last 30 days)
2. **Target Wikipedia-style authority** - well-structured, factual, comprehensive
3. **Avoid overtly promotional content** - vendor blogs cited <3%
4. **Focus on comparison and informational content** - higher citation rates

### Technical Requirements
1. **Server-side rendering is CRITICAL** - ChatGPT cannot execute JavaScript
2. **Ensure content is in initial HTML response**
3. **Allow OAI-SearchBot in robots.txt** for search visibility
4. **Implement FAQ schema** - explicitly signals Q&A format

### High-Priority Actions
1. Add "Last Updated" timestamps with recent dates
2. Include references to current years ("In 2025...")
3. Update statistics and data points regularly
4. Create comprehensive, Wikipedia-style content
5. Structure content with clear Q&A format
6. Implement schema markup (FAQPage, Article, Organization)

### What ChatGPT Ignores
- JavaScript-rendered content (CSR apps are invisible)
- Paywalled content
- Content behind login walls
- Sites blocked via robots.txt GPTBot directive

## SearchGPT January 2025 Changes
- "Explosion of interest" in AEO due to prominently displayed clickable links
- Maps and traditional search elements now displayed
- "Dramatic increase" in referral traffic reported
- Stronger emphasis on real-time, fresh content
