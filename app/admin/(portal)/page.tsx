import Link from 'next/link'
import { PROJECTS } from '@/lib/data/portfolio'
import { AGENTS } from '@/lib/data/agents'
import { AgentRow, ProjectCard } from './ui'

export default function AdminOverview() {
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
        <div className="kpi"><div className="kpi-label">Live</div><div className="kpi-value">{live.length}</div><div className="kpi-sub">apps in production</div></div>
        <div className="kpi"><div className="kpi-label">In build / pilot</div><div className="kpi-value">{building.length}</div><div className="kpi-sub">active engagements</div></div>
        <div className="kpi"><div className="kpi-label">Agents</div><div className="kpi-value">{prodAgents.length}<span style={{ fontSize: '1rem', color: 'var(--a-muted2)' }}>/{AGENTS.length}</span></div><div className="kpi-sub">in production</div></div>
        <div className="kpi"><div className="kpi-label">Verticals</div><div className="kpi-value">{verticals}</div><div className="kpi-sub">served so far</div></div>
        <div className="kpi"><div className="kpi-label">Median ship time</div><div className="kpi-value">{median ?? '—'}<span style={{ fontSize: '1rem', color: 'var(--a-muted2)' }}>d</span></div><div className="kpi-sub">estimate · verify <span className="verify">VERIFY</span></div></div>
      </div>

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
