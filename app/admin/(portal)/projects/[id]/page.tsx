import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { PROJECTS, STATUS_LABEL } from '@/lib/data/portfolio'
import { AGENTS } from '@/lib/data/agents'
import { detailFor } from '@/lib/data/project-detail'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { getRegistryProjects, listChangeRequests, listWorkItems } from '@/lib/team/work'
import { AgentRow } from '../../ui'
import WorkItems from './WorkItems'
import OdysseyPanel from './OdysseyPanel'

export const dynamic = 'force-dynamic'

const REQ_STATUS: Record<string, string> = { new: 'concept', planned: 'pilot', awaiting_approval: 'building', approved: 'building', in_progress: 'building', deployed: 'live', done: 'live', rejected: 'internal' }

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = PROJECTS.find((x) => x.id === id)
  if (!p) notFound()
  const d = detailFor(id)
  const jar = await cookies()
  const session = await verifySession(jar.get(ADMIN_COOKIE)?.value)
  const isAdmin = session?.role === 'admin'
  const agents = AGENTS.filter((a) => p.agents?.includes(a.id))
  const [work, requests, registry] = await Promise.all([listWorkItems(id).catch(() => []), listChangeRequests(d.opsIds), getRegistryProjects(d.opsIds)])
  const openReqs = requests.filter((r) => !['deployed', 'done', 'rejected'].includes(r.status))
  const delivered = d.delivered.reduce((n, g) => n + g.items.length, 0)

  return (
    <>
      <div className="admin-crumb"><Link href="/admin/projects">Projects</Link> / {p.name}</div>
      <div className="admin-head">
        <div>
          <h1>{p.emoji} {p.name}</h1>
          <p>{p.client} · {p.vertical} · {p.tier} · owner {p.owner} · since {p.started}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {d.pieces.slice(0, 2).map((x) => x.href && <a key={x.label} href={x.href} target="_blank" rel="noreferrer" className="chip on">{x.label} ↗</a>)}
          <span className={`status ${p.status}`}>{STATUS_LABEL[p.status]}</span>
        </div>
      </div>

      {d.rules && (
        <div className="rules-bar">{d.rules.map((r) => <span key={r}>⚠ {r}</span>)}</div>
      )}

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Delivered</div><div className="kpi-value">{delivered || p.features.length}</div><div className="kpi-sub">features live</div></div>
        <div className="kpi"><div className="kpi-label">Open work</div><div className="kpi-value">{work.filter((w) => w.status !== 'done').length}</div><div className="kpi-sub">{work.filter((w) => w.status === 'doing').length} in progress</div></div>
        <div className="kpi"><div className="kpi-label">Change requests</div><div className="kpi-value">{openReqs.length}</div><div className="kpi-sub">{requests.length} total from merchant</div></div>
        <div className="kpi"><div className="kpi-label">Agents</div><div className="kpi-value">{agents.length}</div><div className="kpi-sub">attached to this project</div></div>
      </div>

      {d.money === 'odyssey' && <OdysseyPanel isAdmin={isAdmin} />}

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <WorkItems projectId={id} initial={work} canEdit={Boolean(session)} />

          <div className="panel">
            <h3>Merchant change requests</h3>
            {requests.length === 0 ? <p style={{ color: 'var(--a-muted)' }}>No SMS change requests yet. They arrive from the merchant via the vbild-ops queue.</p> : (
              <div className="activity">
                {requests.map((r) => (
                  <div className="act" key={r.id} style={{ gridTemplateColumns: '90px 1fr auto' }}>
                    <time>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
                    <div><b>{r.summary ?? r.body.slice(0, 90)}</b> <span>· {r.fromName ?? 'merchant'}{r.category ? ` · ${r.category}` : ''}{r.tier ? ` · ${r.tier}` : ''}{r.previewUrl ? <> · <a href={r.previewUrl} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc' }}>preview ↗</a></> : null}</span></div>
                    <span className={`status ${REQ_STATUS[r.status] ?? 'concept'}`}>{r.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {d.delivered.length > 0 ? (
            <div className="panel">
              <h3>Delivered</h3>
              <div className="deliv-grid">
                {d.delivered.map((g) => (
                  <div key={g.title}><h4>{g.title}</h4><ul>{g.items.map((f) => <li key={f}>{f}</li>)}</ul></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel"><h3>Features</h3><ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
          )}

          {agents.length > 0 && (
            <div>
              <div className="admin-section-head"><h2>Agents on this project</h2></div>
              <div className="agent-stream">{agents.map((a) => <AgentRow key={a.id} a={a} />)}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="panel"><h3>Summary</h3><p>{p.summary}</p></div>
          <div className="panel">
            <h3>Product pieces</h3>
            <div className="pieces">
              {d.pieces.map((x) => (
                <div key={x.label} className="piece">
                  {x.href ? <a href={x.href} target="_blank" rel="noreferrer">{x.label} ↗</a> : <span>{x.label}</span>}
                  {x.note && <small>{x.note}</small>}
                </div>
              ))}
              {registry.map((r) => (
                <div key={r.id} className="piece" style={{ opacity: 0.85 }}>
                  <span>Registry · {r.name ?? r.id}</span>
                  <small>{[r.productionUrl, r.previewUrl].filter(Boolean).join(' · ')}{r.notes ? ` · ${r.notes}` : ''}</small>
                </div>
              ))}
              {d.pieces.length === 0 && registry.length === 0 && p.links && Object.entries(p.links).map(([k, v]) => v && <div key={k} className="piece"><a href={v} target="_blank" rel="noreferrer">{k} ↗</a></div>)}
            </div>
          </div>
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
          {d.contacts && <div className="panel"><h3>People</h3><dl className="kv" style={{ gridTemplateColumns: '1fr' }}>{d.contacts.map((c) => <div key={c.name}><dt>{c.role}</dt><dd>{c.name}<br /><small style={{ color: 'var(--a-muted2)' }}>{c.channel}</small></dd></div>)}</dl></div>}
        </div>
      </div>
    </>
  )
}
