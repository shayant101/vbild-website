import { NextRequest, NextResponse } from 'next/server'
import { getScan } from '@/lib/scan/db'

export const dynamic = 'force-dynamic'

/** Public: report with the gated parts removed unless a lead exists for this scan. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getScan(id)
  if (!s) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const r = s.report
  const pub = r && !s.unlocked ? { ...r, opportunities: r.opportunities.slice(0, 1), insights: r.insights.slice(0, 1), locked: true } : r ? { ...r, locked: false } : undefined
  return NextResponse.json({ id: s.id, status: s.status, mode: s.mode, score: s.score, error: s.error, createdAt: s.createdAt, unlocked: Boolean(s.unlocked), report: pub, facts: s.facts.filter((f) => s.unlocked || f.severity === 'good' || f.area === 'presence').slice(0, s.unlocked ? 40 : 4), business: s.business ? { name: s.business.name, rating: s.business.rating, reviewCount: s.business.reviewCount, address: s.business.address, website: s.business.website, mapsUrl: s.business.mapsUrl } : undefined })
}
