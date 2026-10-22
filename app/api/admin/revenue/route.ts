import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { addRevenue, deleteRevenue, REVENUE_KINDS } from '@/lib/team/revenue'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (s.role !== 'admin') return NextResponse.json({ error: 'Only admins can edit revenue.' }, { status: 403 })
  const b = await req.json().catch(() => ({}))
  try {
    if (b.action === 'add') {
      const amount = Number(b.amount)
      if (typeof b.projectId !== 'string' || !Number.isFinite(amount) || amount === 0) return NextResponse.json({ error: 'projectId and a non-zero amount are required' }, { status: 400 })
      if (typeof b.receivedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.receivedOn)) return NextResponse.json({ error: 'receivedOn (YYYY-MM-DD) required' }, { status: 400 })
      const entry = await addRevenue({
        projectId: b.projectId, kind: REVENUE_KINDS.includes(b.kind) ? b.kind : 'other', amount: Math.round(amount * 100) / 100,
        receivedOn: b.receivedOn, method: b.method ? String(b.method).slice(0, 40) : undefined, note: b.note ? String(b.note).slice(0, 500) : undefined,
        approx: Boolean(b.approx), createdBy: s.email,
      })
      return NextResponse.json({ entry })
    }
    if (b.action === 'delete' && typeof b.id === 'string') { await deleteRevenue(b.id); return NextResponse.json({ ok: true }) }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 }) }
}
