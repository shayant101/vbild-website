import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { refreshPayoutRequests, requestPayout } from '@/lib/odyssey/payouts'

export const dynamic = 'force-dynamic'

/**
 * POST { action: 'request', week: 'YYYY-MM-DD' }  → create a Mercury approval request (admins only)
 * POST { action: 'refresh' }                      → pull request statuses from Mercury
 * Nothing here moves money: every request still needs Shayan's approval inside Mercury.
 */
export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.action === 'refresh') { await refreshPayoutRequests(); return NextResponse.json({ ok: true }) }
  if (body.action === 'request') {
    if (s.role !== 'admin') return NextResponse.json({ error: 'Only admins can request payouts.' }, { status: 403 })
    if (typeof body.week !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.week)) return NextResponse.json({ error: 'week required' }, { status: 400 })
    const r = await requestPayout(body.week, s.email)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ ok: true, amount: r.week.due, memo: r.week.memo, mercuryRequestId: r.mercuryRequestId })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
