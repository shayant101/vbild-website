'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function PayoutButton({ week, amount, memo, enabled, canRequest }: { week: string; amount: number; memo: string; enabled: boolean; canRequest: boolean }) {
  const [stage, setStage] = useState<'idle' | 'confirm' | 'busy' | 'done'>('idle')
  const [err, setErr] = useState('')
  const router = useRouter()
  if (!canRequest) return <span className="tag">admin only</span>
  if (!enabled) return <span className="tag" title="Set MERCURY_PAYOUT_TOKEN on vbild.ai in Vercel">needs Mercury token</span>
  async function go() {
    setStage('busy'); setErr('')
    const r = await fetch('/api/admin/odyssey/payout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'request', week }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setErr(j.error || 'Failed'); setStage('idle'); return }
    setStage('done'); router.refresh()
  }
  if (stage === 'done') return <span className="status live">sent to Mercury</span>
  if (stage === 'confirm' || stage === 'busy') return (
    <span className="payout-confirm">
      <span>Request <b>{fmt$(amount)}</b> for {memo}? You still approve it in Mercury.</span>
      <button className="chip on" disabled={stage === 'busy'} onClick={go}>{stage === 'busy' ? 'Sending…' : 'Yes, request'}</button>
      <button className="chip" disabled={stage === 'busy'} onClick={() => setStage('idle')}>Cancel</button>
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button className="chip on" onClick={() => setStage('confirm')}>Request payout</button>
      {err && <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{err}</span>}
    </span>
  )
}

export function RefreshStatuses() {
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  return (
    <button className="chip" disabled={busy} onClick={async () => { setBusy(true); await fetch('/api/admin/odyssey/payout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) }); setBusy(false); router.refresh() }}>
      {busy ? 'Checking…' : '↻ Check Mercury'}
    </button>
  )
}
