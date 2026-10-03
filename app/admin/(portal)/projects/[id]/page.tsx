import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PROJECTS, STATUS_LABEL } from '@/lib/data/portfolio'
import { AGENTS } from '@/lib/data/agents'
import { AgentRow } from '../../ui'

export function generateStaticParams() { return PROJECTS.map((p) => ({ id: p.id })) }

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = PROJECTS.find((x) => x.id === id)
  if (!p) notFound()
  const agents = AGENTS.filter((a) => p.agents?.includes(a.id))
  return (
    <>
      <div className="admin-crumb"><Link href="/admin/projects">Projects</Link> / {p.name}</div>
      <div className="admin-head">
        <div>
          <h1>{p.emoji} {p.name}</h1>
          <p>{p.client} · {p.vertical} · {p.tier}</p>
        </div>
        <span className={`status ${p.status}`}>{STATUS_LABEL[p.status]}</span>
      </div>
      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="panel"><h3>Summary</h3><p>{p.summary}</p></div>
          <div className="panel"><h3>Features</h3><ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
          {agents.length > 0 && (
            <div>
              <div className="admin-section-head"><h2>Agents on this project</h2></div>
              <div className="agent-stream">{agents.map((a) => <AgentRow key={a.id} a={a} />)}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="panel">
            <h3>Details</h3>
            <dl className="kv">
              <div><dt>Owner</dt><dd>{p.owner}</dd></div>
              <div><dt>Started</dt><dd>{p.started}</dd></div>
              <div><dt>Shipped</dt><dd>{p.shipped ?? '—'}</dd></div>
              <div><dt>Days to ship</dt><dd>{p.daysToShip ?? '—'}{p.estimate && <span className="verify">EST</span>}</dd></div>
              <div><dt>Public</dt><dd>{p.public ? 'Yes — on vbild.ai' : 'No — internal'}</dd></div>
              <div><dt>Tier</dt><dd>{p.tier}</dd></div>
            </dl>
          </div>
          <div className="panel"><h3>Stack</h3><div className="proj-meta">{p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}</div></div>
          {p.links && (
            <div className="panel">
              <h3>Links</h3>
              <dl className="kv" style={{ gridTemplateColumns: '1fr' }}>
                {p.links.live && <div><dt>Live</dt><dd><a href={p.links.live} target="_blank" rel="noreferrer">{p.links.live}</a></dd></div>}
                {p.links.repo && <div><dt>Repo</dt><dd><a href={p.links.repo} target="_blank" rel="noreferrer">{p.links.repo}</a></dd></div>}
                {p.links.docs && <div><dt>Docs</dt><dd><a href={p.links.docs} target="_blank" rel="noreferrer">{p.links.docs}</a></dd></div>}
              </dl>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
