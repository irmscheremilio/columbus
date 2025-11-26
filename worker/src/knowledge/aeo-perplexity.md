# Perplexity AI Optimization

This document contains specific optimization strategies for Perplexity AI.

## Perplexity Statistics
- 15+ million monthly active users
- 27-34% quarterly user growth
- Transparent citation model - always shows source URLs
- Only 25% overlap with ChatGPT recommendations

## How Perplexity Selects Sources

### Citation Patterns
- **Reddit is #1 source** at 6.6% of citations (highest among all platforms)
- Average 5.28 citations per response
- 60% overlap with Google top 10 organic results (varies by industry):
  - Healthcare: 82% overlap
  - Restaurants: 27% overlap
- Transparent citations - URLs always visible to users

### Ranking System (L3 Reranking)
Perplexity uses an XGBoost reranker with:
1. **Quality gates** - filtering low-quality passages
2. **Manual authority lists** - preference to curated domains
3. **Time-decay and freshness** - exponential curve; pages "updated two hours ago" cited 38% more than month-old
4. **Topic multipliers** - `subscribed_topic_multiplier`, `top_topic_multiplier`
5. **Engagement window** - ~7 days (`discover_engagement_7d`)

### Technical Behavior
- **PerplexityBot user-agent** + Perplexity-User
- **Ignores robots.txt** for user-initiated requests
- Does NOT execute JavaScript
- IP addresses published: https://www.perplexity.ai/perplexitybot.json

### Controversy
Cloudflare investigation found:
- Undeclared crawlers with generic browser user-agents
- IP rotation to evade blocks
- Not always respecting robots.txt

## Optimization Strategies for Perplexity

### Leverage Reddit Preference
1. **Engage authentically on Reddit** in relevant subreddits
2. **Create content that gets discussed on Reddit**
3. **Monitor Reddit mentions** of your brand/industry
4. **Provide value in Reddit communities** (not just promotion)

### Content Strategy
1. **Focus on topics with lower Google overlap** (e.g., niche topics, local, specific use cases)
2. **Create comprehensive comparison content** - Perplexity users often compare options
3. **Include direct answers** that can be extracted as citations
4. **Update frequently** - 38% higher citation rate for content updated within 2 hours

### Technical Requirements
1. **Server-side rendering** - Perplexity cannot execute JavaScript
2. **Fast page load** - quality gates filter slow/problematic pages
3. **Clean HTML structure** - facilitates passage extraction
4. **Schema markup** - helps with content categorization

### High-Priority Actions
1. **Implement SSR/SSG** if using JavaScript frameworks
2. **Add FAQ schema** for Q&A content
3. **Create content that answers specific questions**
4. **Update content frequently** (even small updates help)
5. **Build Reddit presence** in relevant communities
6. **Monitor PerplexityBot in server logs**

### robots.txt Configuration
```
# Allow Perplexity crawlers
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Note: Perplexity-User may ignore robots.txt for user requests
```

## Perplexity-Specific Opportunities

### Transparent Citations Advantage
- Users SEE the source URLs in Perplexity responses
- Higher click-through potential than other AI platforms
- Brand visibility even without direct citation (visible in source list)

### 17-26% Referral Traffic Increase
Sites optimized for Perplexity have reported:
- 17-26% increase in referral traffic
- Higher quality traffic (intent-driven users)
- Better conversion rates than general search

### Industry-Specific Strategy
Since Google overlap varies dramatically:
- **Healthcare (82% overlap):** Focus on Google SEO, Perplexity will follow
- **Restaurants (27% overlap):** Different strategy needed; focus on freshness, Reddit, niche content

## Key Differences from Other AI Platforms

| Feature | Perplexity | ChatGPT | Gemini |
|---------|------------|---------|--------|
| Reddit Preference | ✅ Highest | ❌ Reduced | Moderate |
| Transparent Citations | ✅ Always | Sometimes | Sometimes |
| Google Overlap | 60% | Lower | High (same index) |
| JavaScript | ❌ No | ❌ No | ✅ Yes |
| Freshness Sensitivity | High (38% boost for 2hr updates) | Very High | Moderate |

## Content That Works on Perplexity

### Best Performing Content Types
1. **Comparison articles** - "X vs Y" format
2. **How-to guides** - step-by-step instructions
3. **FAQ pages** - Q&A format
4. **Research summaries** - data-backed content
5. **Expert opinions** - authoritative perspectives

### Content Structure
1. Start with direct answer (40-60 words)
2. Use clear question headings
3. Include bullet points and lists
4. Add data and statistics
5. Cite authoritative sources
6. Update frequently
