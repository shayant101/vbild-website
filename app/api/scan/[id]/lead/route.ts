import { NextRequest, NextResponse } from 'next/server'
import { getScan, newId, saveLead } from '@/lib/scan/db'
import { notifyLead } from '@/lib/scan/notify'
import { publicView } from '@/lib/scan/public'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  let s = await getScan(id)
  let stateless = false
  if (!s && body.scan && body.scan.id === id && body.scan.report) {
    // No database on this deployment: trust the client's copy of the public report just enough to notify + unlock.
    s = { id, input: body.scan.business?.name || id, inputKind: 'name', status: 'done', mode: body.scan.mode || 'scripted', facts: body.scan.facts || [], report: body.scan.report, score: body.scan.score, createdAt: body.scan.createdAt || new Date().toISOString() }
    stateless = true
  }
  if (!s || s.status !== 'done') return NextResponse.json({ error: 'scan not ready' }, { status: 404 })
  const { name, phone, email, note } = body
  if (typeof name !== 'string' || name.trim().length < 2) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const ph = typeof phone === 'string' ? phone.replace(/[^\d+]/g, '') : ''
  const em = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (ph.length < 10 && !/^[^@]+@[^@]+\.[^@]+$/.test(em)) return NextResponse.json({ error: 'A phone number or email is required' }, { status: 400 })
  const lead = { id: newId('lead'), scanId: id, name: name.trim().slice(0, 80), phone: ph || undefined, email: em || undefined, note: typeof note === 'string' ? note.slice(0, 500) : undefined, status: 'new', createdAt: new Date().toISOString() }
  if (!stateless) await saveLead(lead)
  const origin = req.headers.get('origin') || `https://${req.headers.get('host')}`
  notifyLead(lead, s, origin).catch(() => {})
  const full = { ...s, unlocked: true }
  return NextResponse.json({ ok: true, scan: stateless ? publicView(full) : undefined })
}
