'use client'
import { useState } from 'react'
import type { RevenueEntry, RevenueKind } from '@/lib/team/revenue'

export type AutoLine = { label: string; amount: number; sub?: string }
const fmt$ = (n: number) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const KIND_LABEL: Record<RevenueKind, string> = { setup: 'Setup fee', monthly: 'Monthly', rev_share: 'Rev share', other: 'Other' }

export default function RevenuePanel({ projectId, initial, auto, canEdit }: { projectId: string; initial: RevenueEntry[]; auto: AutoLine[]; canEdit: boolean }) {
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ kind: 'monthly' as RevenueKind, amount: '', receivedOn: new Date().toISOString().slice(0, 10), method: 'mercury', note: '', approx: false })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const manual = Math.round(items.reduce((a, i) => a + i.amount, 0) * 100) / 100
  const autoTotal = Math.round(auto.reduce((a, l) => a + l.amount, 0) * 100) / 100
  const total = Math.round((manual + autoTotal) * 100) / 100

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const r = await fetch('/api/admin/revenue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'add', projectId, ...f, amount: Number(f.amount) }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'failed')
      setItems((x) => [j.entry, ...x]); setF({ ...f, amount: '', note: '' }); setOpen(false)
    } catch (x) { setErr(x instanceof Error ? x.message : 'failed') } finally { setBusy(false) }
  }
  async function remove(id: string) {
    if (!confirm('Remove this revenue entry?')) return
    setItems((x) => x.filter((i) => i.id !== id))
    await fetch('/api/admin/revenue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
  }

  return (
    <div className="panel rev-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <h3>Vbild revenue from this project</h3>
        {canEdit && <button className="chip on" onClick={() => setOpen((o) => !o)}>{open ? 'Close' : '+ Log a payment'}</button>}
      </div>
      <div className="rev-total"><span>{fmt$(total)}</span><small>made so far · {fmt$(manual)} fees logged + {fmt$(autoTotal)} rev share</small></div>
      {open && (
        <form onSubmit={add} className="rev-form">
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as RevenueKind })}>{(Object.keys(KIND_LABEL) as RevenueKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          <input type="number" step="0.01" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
          <input type="date" value={f.receivedOn} onChange={(e) => setF({ ...f, receivedOn: e.target.value })} required />
          <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}><option value="mercury">Mercury</option><option value="stripe">Stripe</option><option value="zelle">Zelle</option><option value="check">Check</option><option value="cash">Cash</option><option value="other">Other</option></select>
          <input placeholder="Note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <label style={{ fontSize: '0.75rem', color: 'var(--a-muted)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}><input type="checkbox" checked={f.approx} onChange={(e) => setF({ ...f, approx: e.target.checked })} />date approx.</label>
          <button className="chip on" disabled={busy || !f.amount}>Save</button>
        </form>
      )}
      {err && <div className="login-err">{err}</div>}
      <div className="rev-list">
        {auto.map((l) => (
          <div key={l.label} className="rev-row auto">
            <span className="tag">auto</span>
            <div><div className="work-title">{l.label}</div>{l.sub && <div className="work-meta">{l.sub}</div>}</div>
            <b>{fmt$(l.amount)}</b>
          </div>
        ))}
        {items.map((i) => (
          <div key={i.id} className="rev-row">
            <span className="tag">{KIND_LABEL[i.kind]}</span>
            <div><div className="work-title">{i.note || KIND_LABEL[i.kind]}</div><div className="work-meta">{i.receivedOn}{i.approx ? ' (approx.)' : ''}{i.method ? ` · ${i.method}` : ''}{i.createdBy ? ` · ${i.createdBy.split('@')[0]}` : ''}</div></div>
            <b>{fmt$(i.amount)}</b>
            {canEdit && <button className="chip" onClick={() => remove(i.id)} title="Remove">×</button>}
          </div>
        ))}
        {items.length === 0 && auto.length === 0 && <p style={{ color: 'var(--a-muted)' }}>Nothing logged yet.</p>}
      </div>
    </div>
  )
}
