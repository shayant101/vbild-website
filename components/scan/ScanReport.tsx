'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MiniApp } from '@/components/demo/MiniApps'
import { SCENARIOS, type ScenarioId } from '@/components/demo/scenarios'
import { CATEGORY_BY_ID, type CategoryId } from '@/lib/data/categories'
import { PROJECTS } from '@/lib/data/portfolio'
import type { Fact, Report } from '@/lib/scan/types'

type Pub = { id: string; status: string; mode: string; score?: number; error?: string; unlocked: boolean; report?: Report & { locked: boolean }; facts: Fact[]; business?: { name: string; rating?: number; reviewCount?: number; address?: string; website?: string; mapsUrl?: string } }

export default function ScanReport({ id }: { id: string }) {
  const [d, setD] = useState<Pub | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [screen, setScreen] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const load = useCallback(async () => { const r = await fetch(`/api/scan/${id}`, { cache: 'no-store' }); if (r.ok) setD(await r.json()) }, [id])
  useEffect(() => { load() }, [load])

  if (!d) return <div className="sr-loading"><i className="sb-spin" /> Loading your report…</div>
  if (d.status === 'error' || !d.report) return <div className="sr-loading">We couldn&apos;t complete this scan{d.error ? `: ${d.error}` : ''}. <Link href="/scan">Try another link →</Link></div>
  const r = d.report
  const cat = CATEGORY_BY_ID[r.categoryId as CategoryId]
  const scen = SCENARIOS[(r.prototype.scenario as ScenarioId) || 'restaurant']
  const spec = { ...scen.spec, appName: r.prototype.appName, tagline: r.prototype.tagline }
  const similar = PROJECTS.filter((p) => r.similarBuilds.includes(p.id))
  const S = r.scores
  const areas: [keyof typeof S, string][] = [['presence', 'Presence'], ['bookings', cat.id === 'places' ? 'Ordering' : 'Bookings'], ['reviews', 'Reviews'], ['automation', 'Automation'], ['speed', 'Speed']]
  const ring = (v: number) => `conic-gradient(${v >= 70 ? '#4ade80' : v >= 45 ? '#fbbf24' : '#f87171'} ${v * 3.6}deg, rgba(255,255,255,0.06) 0)`

  async function unlock(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    const r2 = await fetch(`/api/scan/${id}/lead`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) })
    const j = await r2.json().catch(() => ({}))
    if (!r2.ok) { setErr(j.error || 'Could not save'); setBusy(false); return }
    await load(); setBusy(false)
  }
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }

  return (
    <div className="sr" style={{ ['--acc' as string]: cat.accent }}>
      {/* header */}
      <header className="sr-head">
        <div>
          <span className="section-label">Vbild Scan · {cat.name} · {r.generatedBy === 'claude' ? 'AI-written' : 'rules-based'}{d.mode === 'scripted' ? ' · demo mode' : ''}</span>
          <h1>{r.headline}</h1>
          <p className="sr-sum">{r.summary}</p>
          {d.business && <p className="sr-biz">{d.business.name}{d.business.rating ? ` · ${d.business.rating.toFixed(1)}★ (${d.business.reviewCount})` : ''}{d.business.address ? ` · ${d.business.address}` : ''} {d.business.mapsUrl && <a href={d.business.mapsUrl} target="_blank" rel="noreferrer">Maps ↗</a>}</p>}
        </div>
        <div className="sr-score"><div className="sr-ring" style={{ background: ring(S.overall) }}><b>{S.overall}</b><small>/100</small></div><span>App-readiness</span></div>
      </header>

      {/* area scores */}
      <div className="sr-areas">
        {areas.map(([k, label]) => <div key={k} className="sr-area"><div className="sr-mini" style={{ background: ring(S[k]) }}><b>{S[k]}</b></div><span>{label}</span></div>)}
      </div>

      {/* opportunities */}
      <section className="sr-sec">
        <h2>What we&apos;d build for {r.businessName}</h2>
        <div className="sr-opps">
          {r.opportunities.map((o, i) => (
            <div key={i} className="sr-opp">
              <div className="sr-opp-top"><span className="sr-n">{i + 1}</span><b>{o.title}</b><span className={`sr-tier t-${o.tier.toLowerCase()}`}>{o.tier}</span></div>
              <p className="sr-what">{o.what}</p>
              <p className="sr-why"><span>Why:</span> {o.why}</p>
              <p className="sr-impact"><span>Impact:</span> {o.impact}</p>
              <p className="sr-job">Job: {o.job}</p>
            </div>
          ))}
          {r.locked && [1, 2].map((i) => (
            <div key={`l${i}`} className="sr-opp locked"><div className="sr-opp-top"><span className="sr-n">{i + 1}</span><b>Opportunity {i + 1}</b><span className="sr-tier">—</span></div><p className="sr-what">Unlock the full report to see the other opportunities, every finding, and your prototype.</p></div>
          ))}
        </div>
      </section>

      {/* gate */}
      {r.locked ? (
        <section className="sr-gate">
          <div>
            <span className="section-label">Unlock the full report</span>
            <h2>See all {3} opportunities, every finding, and a working prototype of {r.prototype.appName}.</h2>
            <p>We&apos;ll text you the link so you can open it on your phone. A Vbild person reads every report before reaching out — no automated sales.</p>
          </div>
          <form onSubmit={unlock} className="sr-form">
            <input placeholder="Your name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Mobile number" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Email (optional if phone given)" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Anything we should know? (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <button disabled={busy}>{busy ? 'Unlocking…' : 'Unlock my report'}</button>
            {err && <div className="sb-err">{err}</div>}
            <small>No spam. We only use this to send your report and, if you want, book a call.</small>
          </form>
        </section>
      ) : (
        <>
          <section className="sr-sec sr-two">
            <div>
              <h2>Every finding</h2>
              <ul className="sr-facts">{d.facts.map((f) => <li key={f.id} className={`sev-${f.severity}`}><i /><div><b>{f.text}</b>{f.evidence && <span>{f.evidence}</span>}</div></li>)}</ul>
            </div>
            <div>
              <h2>Insights</h2>
              <ul className="sr-insights">{r.insights.map((t, i) => <li key={i}>{t}</li>)}</ul>
              {similar.length > 0 && (<><h2 style={{ marginTop: '1.6rem' }}>We&apos;ve done this before</h2>
                <ul className="sr-similar">{similar.map((p) => <li key={p.id}><span>{p.emoji}</span><div><b>{p.name}</b><small>{p.client} · {p.vertical}{p.daysToShip ? ` · shipped in ${p.daysToShip} days` : ''}</small></div>{p.links?.live && <a href={p.links.live} target="_blank" rel="noreferrer">↗</a>}</li>)}</ul></>)}
            </div>
          </section>

          <section className="sr-sec">
            <h2>Your prototype: {r.prototype.appName}</h2>
            <p className="sr-sum">{r.prototype.tagline} Click around — this is the shape of the app, with your name on it. The real build is tailored in a 20-minute call.</p>
            <div className="sr-proto">
              <div className="ld-device"><div className="ld-device-bar"><i /><i /><i /><span>{r.prototype.appName.toLowerCase().replace(/\s+/g, '')}.vbild.app</span></div><div className="ld-device-screen"><MiniApp spec={spec} screen={screen} setScreen={setScreen} onToast={showToast} /></div></div>
              <div className="sr-proto-side">
                <div className="ld-screens">{scen.spec.screens.map((s, i) => <button key={s} className={screen === i ? 'on' : ''} onClick={() => setScreen(i)}>{i + 1}. {s}</button>)}</div>
                <div className="sr-cta">
                  <a className="btn-primary" href="https://cal.com/shayan-vbild/discovery-call" target="_blank" rel="noreferrer">Book 20 minutes with Vbild</a>
                  <Link className="btn-ghost" href={`/for/${cat.id}`}>How we build for {cat.name.toLowerCase()} →</Link>
                </div>
                <p className="sr-fine">Pricing starts at Solo ($0 + $29/mo) and custom builds from $3,500. Share this report: <code>{typeof window !== 'undefined' ? window.location.href : ''}</code></p>
              </div>
            </div>
            {toast && <div className="ld-toast" style={{ position: 'fixed', bottom: '2rem' }}>{toast}</div>}
          </section>
        </>
      )}
    </div>
  )
}
