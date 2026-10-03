import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: 'https://vbild.ai', lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: 'https://vbild.ai/demo', lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://vbild.ai/new-world', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://vbild.ai/start', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
