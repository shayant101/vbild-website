import Link from 'next/link'
import { AGENT_STATUS_LABEL, type Agent } from '@/lib/data/agents'
import { PROJECTS, STATUS_LABEL, type Project } from '@/lib/data/portfolio'

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link href={`/admin/projects/${p.id}`} className="proj-card" style={{ ['--accent' as string]: p.accent }}>
      <div className="proj-top">
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="proj-emoji">{p.emoji}</span>
          <div>
            <div className="proj-name">{p.name}</div>
            <div className="proj-client">{p.client} · {p.vertical}</div>
          </div>
        </div>
        <span className={`status ${p.status}`}>{STATUS_LABEL[p.status]}</span>
      </div>
      <p className="proj-sum">{p.summary}</p>
      <div className="proj-meta">
        <span className="tag">{p.tier}</span>
        {p.stack.slice(0, 3).map((s) => <span className="tag" key={s}>{s}</span>)}
        {p.stack.length > 3 && <span className="tag">+{p.stack.length - 3}</span>}
      </div>
    </Link>
  )
}

export function AgentRow({ a }: { a: Agent }) {
  const proj = a.project ? PROJECTS.find((p) => p.id === a.project) : null
  return (
    <div className="agent-row" style={{ ['--accent' as string]: a.accent }}>
      <div className="agent-ico">{a.emoji}</div>
      <div>
        <div className="agent-name">{a.name}</div>
        <div className="agent-proj">
          {proj ? <Link href={`/admin/projects/${proj.id}`} style={{ color: 'inherit' }}>{proj.name}</Link> : 'Vbild internal'} · {a.model}
        </div>
      </div>
      <div className="agent-desc">{a.oneLiner}</div>
      <div className="agent-io">
        <b>Trigger</b> {a.trigger}<br />
        <b>Out</b> {a.outputs.join(', ')}
      </div>
      <span className={`status ${a.status}`}>{AGENT_STATUS_LABEL[a.status]}</span>
    </div>
  )
}
