'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Fact } from '@/lib/scan/types'

type Pub = { id: string; status: string; score?: number; report?: { businessName: string; categoryId: string; subVertical: string; prototype: { appName: string } }; facts: Fact[]; business?: { name: string; rating?: number; reviewCount?: number; address?: string; website?: string } }

const STAGES = [
  { id: 'locate', label: 'Locating the business', ms: 2600 },
  { id: 'profile', label: 'Reading the Google profile', ms: 2800 },
  { id: 'site', label: 'Crawling the website', ms: 3200 },
  { id: 'speed', label: 'Testing mobile speed', ms: 2600 },
  { id: 'reviews', label: 'Reading recent reviews', ms: 2800 },
  { id: 'checks', label: 'Running 30 checks', ms: 3400 },
  { id: 'match', label: 'Matching to apps we\'ve built', ms: 2400 },
  { id: 'write', label: 'Writing your report', ms: 2600 },
]
const TOTAL = STAGES.reduce((a, s) => a + s.ms, 0)

const CHECK_LABELS = ['Google profile', 'Website linked', 'HTTPS', 'Photos', 'Hours', 'Schema.org', 'Social links', 'Online booking', 'Online ordering', 'First-party vs marketplace', 'Reservations', 'Contact form', 'Chat widget', 'Booking vendor', 'Rating', 'Review volume', 'Recent negatives', 'Review themes', 'Owner replies', 'Analytics', 'Pixel', 'CRM / follow-up', 'Missed-call reply', 'Mobile speed', 'LCP', 'Site builder', 'Price level', 'Delivery attrs', 'Address match', 'Category fit']

export default function ScanTheater({ input, onDone, onError }: { input: string; onDone: (id: string, data: Pub) => void; onError: (msg: string) => void }) {
  const [elapsed, setElapsed] = useState(0)
  const [data, setData] = useState<Pub | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [failed, setFailed] = useState<string | null>(null)
  const startRef = useRef(Date.now())
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const total = reduced ? 3000 : TOTAL

  // kick off the real scan immediately
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const r = await fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input }) })
        const d = await r.json().catch(() => ({}))
        if (dead) return
        if (!r.ok) { setFailed(d.error || 'Scan failed. Try the website URL instead.'); return }
        setData({ id: d.id, ...(d.scan || {}) })
      } catch { if (!dead) setFailed('Network error. Try again.') }
    })()
    return () => { dead = true }
  }, [input])

  // clock
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 100)
    return () => clearInterval(t)
  }, [])

  // stage index from elapsed
  const stageIdx = useMemo(() => {
    if (reduced) return Math.min(STAGES.length - 1, Math.floor((elapsed / total) * STAGES.length))
    let acc = 0
    for (let i = 0; i < STAGES.length; i++) { acc += STAGES[i].ms; if (elapsed < acc) return i }
    return STAGES.length - 1
  }, [elapsed, reduced, total])

  // log lines appear as stages progress, using real data when it has arrived
  useEffect(() => {
    const name = data?.report?.businessName || data?.business?.name || input.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
    const facts = data?.facts || []
    const lines: Record<number, string[]> = {
      0: [`→ Query: "${input.slice(0, 60)}"`, `→ Resolved: ${name}`],
      1: [data?.business?.rating ? `✓ Google rating ${data.business.rating.toFixed(1)} · ${data.business.reviewCount} reviews` : '✓ Profile fields read', data?.business?.address ? `✓ ${data.business.address}` : '✓ Category, hours, attributes'],
      2: [data?.business?.website ? `→ GET ${data.business.website}` : '→ Fetching homepage', '✓ Detecting booking / ordering / payments vendors'],
      3: ['→ Lighthouse mobile run', '✓ Largest contentful paint measured'],
      4: ['→ Last 5 reviews parsed', '✓ Themes extracted: waits, booking, calls'],
      5: facts.slice(0, 4).map((f) => `${f.severity === 'good' ? '✓' : f.severity === 'high' ? '✗' : '!'} ${f.text}`),
      6: [`→ Category: ${data?.report?.categoryId ? data.report.categoryId.charAt(0).toUpperCase() + data.report.categoryId.slice(1) : '…'} · ${data?.report?.subVertical || ''}`, '✓ 2 comparable builds found'],
      7: [`→ Drafting ${data?.report?.prototype?.appName || 'your prototype'}`, data?.score !== undefined ? `✓ App-readiness: ${data.score}/100` : '✓ Scores computed'],
    }
    const want = Object.entries(lines).filter(([k]) => Number(k) <= stageIdx).flatMap(([, v]) => v).filter(Boolean)
    setLog(want)
  }, [stageIdx, data, input])

  // finish when both the clock and the data are ready
  useEffect(() => {
    if (failed) { onError(failed); return }
    if (data && elapsed >= total) onDone(data.id, data)
  }, [data, elapsed, total, failed, onDone, onError])

  const pct = Math.min(99, Math.round((elapsed / total) * 100))
  const checksLit = stageIdx < 5 ? 0 : stageIdx === 5 ? Math.min(30, Math.round(((elapsed - STAGES.slice(0, 5).reduce((a, s) => a + s.ms, 0)) / STAGES[5].ms) * 30)) : 30
  const sevFor = (i: number) => { const f = data?.facts?.[i % Math.max(1, data?.facts?.length || 1)]; return f ? f.severity : (i % 7 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'good') }

  return (
    <div className="th" role="status" aria-live="polite">
      <div className="th-card">
        <aside className="th-stages">
          <div className="th-brand">Vbild <span>Scan</span></div>
          {STAGES.map((s, i) => (
            <div key={s.id} className={`th-stage${i < stageIdx ? ' done' : i === stageIdx ? ' on' : ''}`}>
              <i>{i < stageIdx ? '✓' : i === stageIdx ? '' : ''}</i><span>{s.label}</span>
            </div>
          ))}
          <div className="th-elapsed">{(elapsed / 1000).toFixed(1)}s</div>
        </aside>

        <main className="th-stage-view">
          {stageIdx === 0 && <div className="th-vis th-radar"><div className="th-sweep" />{[0, 1, 2].map((i) => <i key={i} className="th-ring" style={{ animationDelay: `${i * 0.6}s` }} />)}<b className="th-pin" /></div>}
          {stageIdx === 1 && <div className="th-vis th-profile"><div className="th-pcard"><div className="th-pline w60" /><div className="th-stars">{[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * 0.25}s` }}>★</span>)}</div><div className="th-pline w90" /><div className="th-pline w40" /><div className="th-chips"><span>hours</span><span>phone</span><span>website</span><span>photos</span></div></div></div>}
          {stageIdx === 2 && <div className="th-vis th-crawl"><div className="th-term">{['GET / 200', 'GET /menu 200', 'GET /book 200', 'detect: Square', 'detect: Instagram', 'detect: Google Analytics', 'schema.org: none', 'forms: 1', 'chat: none'].map((l, i) => <div key={l} style={{ animationDelay: `${i * 0.3}s` }}>{l}</div>)}</div></div>}
          {stageIdx === 3 && <div className="th-vis th-gauge"><div className="th-dial"><div className="th-needle" /></div><div className="th-gauge-lbl">mobile · Lighthouse</div></div>}
          {stageIdx === 4 && <div className="th-vis th-reviews">{['"took forever to get a table"', '"nobody answered the phone"', '"best wings in town"', '"had to book over DM"', '"staff was great"'].map((t, i) => <div key={t} className="th-bubble" style={{ animationDelay: `${i * 0.5}s` }}>{t}</div>)}</div>}
          {stageIdx === 5 && <div className="th-vis th-checks">{CHECK_LABELS.map((c, i) => <div key={c} className={`th-check${i < checksLit ? ` lit ${sevFor(i)}` : ''}`} title={c}><i />{c}</div>)}</div>}
          {stageIdx === 6 && <div className="th-vis th-match">{['💨 ShopBoard', '🐄 SN Ranch', '🎮 Odyssey VR', '🎙️ Bildr', '🍔 Burger Barn', '🔧 JobLine'].map((t, i) => <div key={t} className="th-tile" style={{ animationDelay: `${i * 0.25}s` }}>{t}</div>)}</div>}
          {stageIdx === 7 && <div className="th-vis th-write"><div className="th-doc">{['Headline', 'Score · 5 areas', 'Opportunity 1', 'Opportunity 2', 'Opportunity 3', 'Insights', 'Prototype'].map((t, i) => <div key={t} className="th-docline" style={{ animationDelay: `${i * 0.3}s` }}><b>{t}</b><span /></div>)}</div><i className="th-caret" /></div>}
          <div className="th-caption">{STAGES[stageIdx].label}…</div>
        </main>

        <div className="th-log">
          {log.slice(-6).map((l, i) => <div key={`${l}-${i}`} className={l.startsWith('✗') ? 'bad' : l.startsWith('!') ? 'warn' : l.startsWith('✓') ? 'ok' : ''}>{l}</div>)}
        </div>
        <div className="th-progress"><div style={{ width: `${pct}%` }} /></div>
        <div className="th-foot"><span>{pct}%</span><span>{stageIdx >= 7 && data ? 'Finalising report' : 'Engine running'}</span></div>
      </div>
    </div>
  )
}
