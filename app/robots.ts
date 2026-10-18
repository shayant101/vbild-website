import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/scan/'] },
    sitemap: 'https://vbild.ai/sitemap.xml',
  }
}
