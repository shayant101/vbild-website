'use client'
import { useState } from 'react'
const OPTS = ['new', 'contacted', 'call_booked', 'proposal', 'won', 'lost']
export default function LeadStatus({ id, status }: { id: string; status: string }) {
  const [s, setS] = useState(status)
  return (
    <select className="chip" value={s} onChange={async (e) => { setS(e.target.value); await fetch('/api/admin/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status: e.target.value }) }) }} style={{ background: 'var(--a-panel)', color: 'var(--a-text)' }}>
      {OPTS.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
    </select>
  )
}
