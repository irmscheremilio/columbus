# Anthropic Claude Optimization

This document contains specific optimization strategies for Anthropic's Claude AI assistant.

## Claude Web Search (Launched March 2025)

Claude launched web search capabilities in March 2025, making it a player in the AEO landscape.

## How Claude Works

### Crawlers
Claude uses multiple bot types for different purposes:

#### ClaudeBot
- **Purpose:** Training data collection and indexing
- **User-Agent:** `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)`
- **Behavior:**
  - Aggressive crawling reported—multiple complaints of "hammering" websites
  - Respects robots.txt (officially) including non-standard Crawl-delay directive
  - Does NOT execute JavaScript

#### Claude-User
- **Purpose:** Real-time retrieval for user-initiated searches
- Similar to ChatGPT-User in behavior

#### Claude-SearchBot
- **Purpose:** Search functionality indexing

### Technical Limitations
- **Does NOT execute JavaScript** - like ChatGPT and Perplexity
- CSR (Client-Side Rendering) apps are invisible to Claude
- Content must be in initial HTML response

## Optimization Strategies for Claude

### Technical Requirements
1. **Server-side rendering (SSR) is essential** - Claude cannot execute JavaScript
2. **Ensure content is in initial HTML response**
3. **Allow ClaudeBot in robots.txt** if you want to be indexed
4. **Consider Crawl-delay directive** if experiencing heavy crawl load

### Content Strategy
Claude emphasizes:
1. **Factual accuracy** - Claude is trained to be helpful, harmless, and honest
2. **Well-structured content** - clear hierarchies and logical flow
3. **Primary sources** - cite authoritative sources
4. **Balanced perspective** - Claude values nuanced viewpoints

### Schema Markup
Like other AI platforms, Claude benefits from:
1. FAQPage schema for Q&A content
2. Article schema for editorial content
3. Organization schema for brand identity
4. HowTo schema for instructional content

### robots.txt Configuration
```
# Allow Claude crawlers
User-agent: ClaudeBot
Allow: /
Crawl-delay: 10  # Optional: Add delay if experiencing heavy crawling

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

# Or block training only
User-agent: ClaudeBot
Disallow: /
```

### High-Priority Actions
1. **Implement SSR/SSG** if using JavaScript frameworks
2. **Add comprehensive schema markup**
3. **Create well-structured Q&A content**
4. **Include authoritative citations**
5. **Update content regularly** for freshness signals
6. **Monitor server logs** for ClaudeBot activity

## Key Considerations

### Handling Aggressive Crawling
If ClaudeBot is hitting your site too hard:
1. Add `Crawl-delay: 10` (or higher) to robots.txt
2. Contact Anthropic at claudebot@anthropic.com
3. Consider rate limiting at server/CDN level

### Claude's Emphasis on Trust
Anthropic emphasizes safety and trustworthiness:
- Content should be accurate and verifiable
- Avoid sensationalism or misleading claims
- Include proper citations and references
- Demonstrate expertise through credentials

### Less Data Available
Claude is newer to web search (March 2025), so:
- Less is known about specific citation preferences
- Optimization strategies may evolve
- Monitor Claude's behavior and adjust accordingly
