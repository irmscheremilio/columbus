/**
 * Favicon utility functions
 * Uses Google's favicon service for reliable favicon fetching
 */

/**
 * Get favicon URL for a domain using Google's favicon service
 * @param domain - The domain (e.g., 'example.com' or 'https://example.com')
 * @param size - Icon size (default 32)
 */
export function getFaviconUrl(domain: string | null | undefined, size: number = 32): string | null {
  if (!domain) return null

  // Extract domain from URL if needed
  let cleanDomain = domain
  try {
    if (domain.includes('://')) {
      cleanDomain = new URL(domain).hostname
    }
    // Remove www prefix
    cleanDomain = cleanDomain.replace(/^www\./, '')
  } catch {
    // If URL parsing fails, use as-is
    cleanDomain = domain.replace(/^www\./, '')
  }

  if (!cleanDomain) return null

  // Use Google's favicon service - reliable and fast
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=${size}`
}

/**
 * Get high-quality favicon URL (larger size, with fallback)
 */
export function getFaviconUrlHQ(domain: string | null | undefined): string | null {
  return getFaviconUrl(domain, 64)
}

/**
 * Composable for favicon functionality
 */
export function useFavicon() {
  return {
    getFaviconUrl,
    getFaviconUrlHQ
  }
}
