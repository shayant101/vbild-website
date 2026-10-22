import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { createInvite, removeMember, removePasskey } from '@/lib/team/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.action === 'invite') {
    if (s.role !== 'admin') return NextResponse.json({ error: 'Only admins can invite.' }, { status: 403 })
    const { email, name, role } = body
    if (typeof email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(email) || typeof name !== 'string' || name.trim().length < 2) return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400 })
    const token = await createInvite(email, name.trim(), role === 'admin' ? 'admin' : 'member', s.email, 7)
    const origin = req.headers.get('origin') || `https://${req.headers.get('host')}`
    return NextResponse.json({ url: `${origin}/admin/invite/${token}` })
  }
  if (body.action === 'revoke-passkey') {
    const memberId = s.role === 'admin' && typeof body.memberId === 'string' ? body.memberId : s.id
    await removePasskey(String(body.id || ''), memberId)
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'remove-member') {
    if (s.role !== 'admin') return NextResponse.json({ error: 'Only admins can remove members.' }, { status: 403 })
    if (body.id === s.id) return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 })
    await removeMember(String(body.id || ''))
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
