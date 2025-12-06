/**
 * Reusable SEO composable for page-level meta tags
 * Handles Open Graph, Twitter Cards, and canonical URLs
 */

interface PageSeoOptions {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  canonicalPath?: string
}

export const usePageSeo = (options: PageSeoOptions) => {
  const config = useRuntimeConfig()
  const route = useRoute()

  const baseUrl = 'https://columbus-aeo.com'
  const defaultImage = `${baseUrl}/og-image.png`

  const canonicalUrl = options.canonicalPath
    ? `${baseUrl}${options.canonicalPath}`
    : `${baseUrl}${route.path}`

  const image = options.image || defaultImage

  const setupSeo = () => {
    useHead({
      title: options.title,
      meta: [
        { name: 'description', content: options.description },
        // Robots
        ...(options.noIndex
          ? [{ name: 'robots', content: 'noindex, nofollow' }]
          : []
        ),
        // Open Graph
        { property: 'og:title', content: options.title },
        { property: 'og:description', content: options.description },
        { property: 'og:image', content: image },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: options.type || 'website' },
        // Twitter Card
        { name: 'twitter:title', content: options.title },
        { name: 'twitter:description', content: options.description },
        { name: 'twitter:image', content: image },
      ],
      link: [
        { rel: 'canonical', href: canonicalUrl },
      ],
    })
  }

  return {
    setupSeo,
    canonicalUrl,
    baseUrl,
  }
}
