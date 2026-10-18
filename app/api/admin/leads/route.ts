import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { updateLeadStatus } from '@/lib/scan/db'

export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, status, ownerNotes } = await req.json().catch(() => ({}))
  if (typeof id !== 'string' || typeof status !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 })
  await updateLeadStatus(id, status, typeof ownerNotes === 'string' ? ownerNotes : undefined)
  return NextResponse.json({ ok: true })
}
