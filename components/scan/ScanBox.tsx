'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['Finding your Google profile', 'Reading your website', 'Checking mobile speed', 'Reading recent reviews', 'Matching to apps we\'ve built', 'Writing your report']

export default function ScanBox({ size = 'hero', placeholder }: { size?: 'hero' | 'compact'; placeholder?: string }) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  async function go(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || busy) return
    setBusy(true); setErr(null); setStep(0)
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3800)
    try {
      const r = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(d.error || 'Scan failed. Try the website URL instead.'); setBusy(false); clearInterval(tick); return }
      try { if (d.scan) sessionStorage.setItem(`vbild-scan-${d.id}`, JSON.stringify(d.scan)) } catch {}
      router.push(`/scan/${d.id}`)
    } catch { setErr('Network error. Try again.'); setBusy(false); clearInterval(tick) }
  }

  return (
    <form className={`sb sb-${size}`} onSubmit={go}>
      <div className="sb-row">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} placeholder={placeholder || 'Paste your Google Maps link, website, or business name'} aria-label="Business link or name" />
        <button type="submit" disabled={busy || !input.trim()}>{busy ? 'Scanning…' : 'Scan my business'}</button>
      </div>
      {busy && (
        <div className="sb-progress">
          <div className="sb-bar"><div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          <span><i className="sb-spin" />{STEPS[step]}…</span>
        </div>
      )}
      {err && <div className="sb-err">{err}</div>}
      {!busy && !err && <div className="sb-hint">Free · 30 seconds · no sign-up. Try: <button type="button" className="sb-try" onClick={() => setInput('https://www.ocsmokeshack.com')}>a smoke shop</button> or <button type="button" className="sb-try" onClick={() => setInput('Reyes Plumbing Las Vegas')}>a plumber</button></div>}
    </form>
  )
}
