import Link from 'next/link'
import { PROJECTS } from '@/lib/data/portfolio'
import { AGENTS } from '@/lib/data/agents'
import { AgentRow, ProjectCard } from './ui'
import { listRevenue, sumByProject } from '@/lib/team/revenue'
import { autoRevenueFor } from '@/lib/team/revenue-auto'

export const dynamic = 'force-dynamic'
const fmt$ = (n: number) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

export default async function AdminOverview() {
  const manual = await listRevenue().catch(() => [])
  const byProj = sumByProject(manual)
  const autoLines = Object.fromEntries(await Promise.all(PROJECTS.map(async (p) => [p.id, await autoRevenueFor(p.id)] as const)))
  const rows = PROJECTS.map((p) => { const m = byProj[p.id] ?? { total: 0, byKind: {} }; const auto = (autoLines[p.id] ?? []).reduce((a, l) => a + l.amount, 0); return { p, fees: m.total, share: Math.round(auto * 100) / 100, total: Math.round((m.total + auto) * 100) / 100, setup: m.byKind.setup ?? 0, monthly: m.byKind.monthly ?? 0 } }).filter((r) => r.total !== 0 || r.fees !== 0).sort((a, b) => b.total - a.total)
  const revenueTotal = Math.round(rows.reduce((a, r) => a + r.total, 0) * 100) / 100
  const live = PROJECTS.filter((p) => p.status === 'live')
  const building = PROJECTS.filter((p) => p.status === 'building' || p.status === 'pilot')
  const prodAgents = AGENTS.filter((a) => a.status === 'production')
  const verticals = new Set(PROJECTS.map((p) => p.vertical)).size
  const shipped = PROJECTS.filter((p) => p.daysToShip).map((p) => p.daysToShip!) 
  const median = shipped.length ? [...shipped].sort((a, b) => a - b)[Math.floor(shipped.length / 2)] : null

  const activity = [...PROJECTS]
    .map((p) => ({ t: p.shipped ?? p.started, p, kind: p.shipped ? 'shipped' : 'started' }))
    .sort((a, b) => (a.t < b.t ? 1 : -1))
    .slice(0, 8)

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Overview</h1>
          <p>Everything Vbild is building, in one place. {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <Link href="/demo" className="chip on" target="_blank">▶ Open live demo</Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Revenue to date</div><div className="kpi-value" style={{ color: '#4ade80' }}>{fmt$(revenueTotal)}</div><div className="kpi-sub">across {rows.length} paying project{rows.length === 1 ? '' : 's'} · fees + rev share, net of Stripe</div></div>
        <div className="kpi"><div className="kpi-label">Live</div><div className="kpi-value">{live.length}</div><div className="kpi-sub">apps in production</div></div>
        <div className="kpi"><div className="kpi-label">In build / pilot</div><div className="kpi-value">{building.length}</div><div className="kpi-sub">active engagements</div></div>
        <div className="kpi"><div className="kpi-label">Agents</div><div className="kpi-value">{prodAgents.length}<span style={{ fontSize: '1rem', color: 'var(--a-muted2)' }}>/{AGENTS.length}</span></div><div className="kpi-sub">in production</div></div>
        <div className="kpi"><div className="kpi-label">Verticals</div><div className="kpi-value">{verticals}</div><div className="kpi-sub">served so far</div></div>
        <div className="kpi"><div className="kpi-label">Median ship time</div><div className="kpi-value">{median ?? '—'}<span style={{ fontSize: '1rem', color: 'var(--a-muted2)' }}>d</span></div><div className="kpi-sub">estimate · verify <span className="verify">VERIFY</span></div></div>
      </div>

      <section className="admin-section">
        <div className="admin-section-head"><h2>Money made per project</h2><span style={{ fontSize: '0.75rem', color: 'var(--a-muted2)' }}>Log fees on each project page · rev share is live from the app&apos;s ledger</span></div>
        <div className="panel">
          {rows.length === 0 ? <p style={{ color: 'var(--a-muted)' }}>No revenue logged yet.</p> : (
            <table className="rev-table">
              <thead><tr><th>Project</th><th className="num">Setup</th><th className="num">Monthly</th><th className="num">Rev share (net)</th><th className="num">Total</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.p.id}>
                    <td><Link href={`/admin/projects/${r.p.id}`} style={{ color: 'inherit', fontWeight: 600 }}>{r.p.emoji} {r.p.name}</Link> <span style={{ color: 'var(--a-muted2)', fontSize: '0.78rem' }}>· {r.p.client}</span></td>
                    <td className="num">{r.setup ? fmt$(r.setup) : '—'}</td><td className="num">{r.monthly ? fmt$(r.monthly) : '—'}</td><td className="num">{r.share ? fmt$(r.share) : '—'}</td><td className="num"><b style={{ color: '#4ade80' }}>{fmt$(r.total)}</b></td>
                  </tr>
                ))}
                <tr><td style={{ color: 'var(--a-muted)' }}>Total</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.setup, 0))}</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.monthly, 0))}</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.share, 0))}</td><td className="num"><b>{fmt$(revenueTotal)}</b></td></tr>
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head"><h2>Projects</h2><Link href="/admin/projects">All projects →</Link></div>
        <div className="proj-grid">{PROJECTS.slice(0, 6).map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      </section>

      <div className="detail-grid">
        <section className="admin-section">
          <div className="admin-section-head"><h2>Agents stream</h2><Link href="/admin/agents">Full stream →</Link></div>
          <div className="agent-stream">{AGENTS.filter((a) => a.status === 'production').slice(0, 4).map((a) => <AgentRow key={a.id} a={a} />)}</div>
        </section>
        <section className="admin-section">
          <div className="admin-section-head"><h2>Activity</h2></div>
          <div className="panel activity">
            {activity.map((a) => (
              <div className="act" key={a.p.id + a.kind}>
                <time>{a.t}</time>
                <div><b>{a.p.name}</b> <span>{a.kind === 'shipped' ? 'shipped' : 'kicked off'} · {a.p.client}</span></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
