import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { addWorkItem, deleteWorkItem, updateWorkItem, type WorkItem } from '@/lib/team/work'

export const dynamic = 'force-dynamic'
const KINDS: WorkItem['kind'][] = ['change', 'bug', 'idea', 'feature']
const STATUS: WorkItem['status'][] = ['todo', 'doing', 'done']

export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  try {
    if (b.action === 'add') {
      const title = String(b.title ?? '').trim()
      if (!title || typeof b.projectId !== 'string') return NextResponse.json({ error: 'title + projectId required' }, { status: 400 })
      const kind = KINDS.includes(b.kind) ? b.kind : 'change'
      const priority = [1, 2, 3].includes(Number(b.priority)) ? (Number(b.priority) as 1 | 2 | 3) : 2
      return NextResponse.json({ item: await addWorkItem(b.projectId, title.slice(0, 200), kind, priority, s.email, b.notes ? String(b.notes).slice(0, 2000) : undefined) })
    }
    if (b.action === 'update' && typeof b.id === 'string') {
      const patch: Parameters<typeof updateWorkItem>[1] = {}
      if (STATUS.includes(b.status)) patch.status = b.status
      if (KINDS.includes(b.kind)) patch.kind = b.kind
      if ([1, 2, 3].includes(Number(b.priority))) patch.priority = Number(b.priority) as 1 | 2 | 3
      if (typeof b.title === 'string' && b.title.trim()) patch.title = b.title.trim().slice(0, 200)
      if (typeof b.notes === 'string') patch.notes = b.notes.slice(0, 2000)
      await updateWorkItem(b.id, patch)
      return NextResponse.json({ ok: true })
    }
    if (b.action === 'delete' && typeof b.id === 'string') { await deleteWorkItem(b.id); return NextResponse.json({ ok: true }) }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 }) }
}
