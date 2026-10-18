import type { Scan } from './types'

export function publicView(s: Scan) {
  const r = s.report
  const pub = r && !s.unlocked ? { ...r, opportunities: r.opportunities.slice(0, 1), insights: r.insights.slice(0, 1), locked: true } : r ? { ...r, locked: false } : undefined
  return { id: s.id, status: s.status, mode: s.mode, score: s.score, error: s.error, createdAt: s.createdAt, unlocked: Boolean(s.unlocked), report: pub,
    facts: s.facts.filter((f) => s.unlocked || f.severity === 'good' || f.area === 'presence').slice(0, s.unlocked ? 40 : 4),
    business: s.business ? { name: s.business.name, rating: s.business.rating, reviewCount: s.business.reviewCount, address: s.business.address, website: s.business.website, mapsUrl: s.business.mapsUrl } : undefined }
}
