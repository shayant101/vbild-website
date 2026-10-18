import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: 'https://vbild.ai', lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: 'https://vbild.ai/scan', lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: 'https://vbild.ai/for/places', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://vbild.ai/for/pros', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://vbild.ai/for/venues', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://vbild.ai/demo', lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://vbild.ai/new-world', lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://vbild.ai/start', lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
