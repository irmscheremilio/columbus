/**
 * Injects JSON-LD Organization schema for enhanced SEO
 * Use on the homepage to establish brand identity
 */

export const useOrganizationSchema = () => {
  const baseUrl = 'https://columbus-aeo.com'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Columbus',
    legalName: 'Columbus AEO',
    url: baseUrl,
    logo: `${baseUrl}/columbus_text.png`,
    description: 'The only completely free AEO platform with 100% authentic data and full ToS compliance. Track your visibility in ChatGPT, Claude, Gemini, and Perplexity.',
    sameAs: [
      'https://twitter.com/EmilioBuildin',
      'https://reddit.com/u/ColumbusAEO',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${baseUrl}/contact`,
      availableLanguage: ['English'],
    },
  }

  const injectSchema = () => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(organizationSchema),
        },
      ],
    })
  }

  return {
    injectSchema,
    organizationSchema,
  }
}

/**
 * Injects JSON-LD FAQPage schema for AEO optimization
 * FAQ schema helps AI systems extract Q&A content
 */
export const useFaqSchema = (faqs: Array<{ question: string; answer: string }>) => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const injectSchema = () => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(faqSchema),
        },
      ],
    })
  }

  return {
    injectSchema,
    faqSchema,
  }
}

/**
 * Injects JSON-LD SoftwareApplication schema
 * Useful for product pages and pricing
 */
export const useSoftwareSchema = () => {
  const baseUrl = 'https://columbus-aeo.com'

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Columbus',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier with core visibility tracking features',
    },
    description: 'AI Engine Optimization platform for tracking brand visibility in ChatGPT, Claude, Gemini, and Perplexity.',
    url: baseUrl,
    screenshot: `${baseUrl}/images/dashboard-preview.png`,
  }

  const injectSchema = () => {
    useHead({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(softwareSchema),
        },
      ],
    })
  }

  return {
    injectSchema,
    softwareSchema,
  }
}
