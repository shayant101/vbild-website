'use client'
import { useState } from 'react'
import type { WorkItem } from '@/lib/team/work'

const KIND_ICON: Record<WorkItem['kind'], string> = { change: '✎', bug: '🐞', idea: '💡', feature: '✦' }
const PRI: Record<number, string> = { 1: 'High', 2: 'Normal', 3: 'Low' }

export default function WorkItems({ projectId, initial, canEdit }: { projectId: string; initial: WorkItem[]; canEdit: boolean }) {
  const [items, setItems] = useState(initial)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<WorkItem['kind']>('change')
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function call(body: Record<string, unknown>) {
    const r = await fetch('/api/admin/work', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'Request failed')
    return j
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return
    setBusy(true); setErr('')
    try { const j = await call({ action: 'add', projectId, title, kind, priority }); setItems((x) => [j.item, ...x]); setTitle('') } catch (x) { setErr(x instanceof Error ? x.message : 'failed') } finally { setBusy(false) }
  }
  async function setStatus(id: string, status: WorkItem['status']) {
    setItems((x) => x.map((i) => (i.id === id ? { ...i, status } : i)))
    try { await call({ action: 'update', id, status }) } catch (x) { setErr(x instanceof Error ? x.message : 'failed') }
  }
  async function remove(id: string) {
    setItems((x) => x.filter((i) => i.id !== id))
    try { await call({ action: 'delete', id }) } catch (x) { setErr(x instanceof Error ? x.message : 'failed') }
  }

  const open = items.filter((i) => i.status !== 'done'), done = items.filter((i) => i.status === 'done')
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <h3>Changes to work on</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--a-muted2)' }}>{open.length} open · {done.length} done</span>
      </div>
      {canEdit && (
        <form onSubmit={add} className="work-add">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a change, bug or idea…" maxLength={200} />
          <select value={kind} onChange={(e) => setKind(e.target.value as WorkItem['kind'])}><option value="change">Change</option><option value="feature">Feature</option><option value="bug">Bug</option><option value="idea">Idea</option></select>
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)}><option value={1}>High</option><option value={2}>Normal</option><option value={3}>Low</option></select>
          <button className="chip on" disabled={busy || !title.trim()}>Add</button>
        </form>
      )}
      {err && <div className="login-err">{err}</div>}
      {items.length === 0 && <p style={{ color: 'var(--a-muted)', marginTop: '0.8rem' }}>Nothing queued. Add the next change above.</p>}
      <div className="work-list">
        {[...open, ...done].map((i) => (
          <div key={i.id} className={`work-row ${i.status}`}>
            <span className="work-kind" title={i.kind}>{KIND_ICON[i.kind]}</span>
            <div>
              <div className="work-title">{i.title}</div>
              <div className="work-meta">{PRI[i.priority]} · {i.kind} · {new Date(i.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{i.createdBy ? ` · ${i.createdBy.split('@')[0]}` : ''}{i.notes ? ` · ${i.notes}` : ''}</div>
            </div>
            {canEdit ? (
              <div className="work-actions">
                <select className="chip" value={i.status} onChange={(e) => setStatus(i.id, e.target.value as WorkItem['status'])} style={{ background: 'var(--a-panel)', color: 'var(--a-text)' }}>
                  <option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option>
                </select>
                <button className="chip" onClick={() => remove(i.id)} title="Remove">×</button>
              </div>
            ) : <span className={`status ${i.status === 'done' ? 'live' : i.status === 'doing' ? 'building' : 'concept'}`}>{i.status}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
