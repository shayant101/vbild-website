import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { PROJECTS, STATUS_LABEL } from '@/lib/data/portfolio'
import { AGENTS } from '@/lib/data/agents'
import { detailFor } from '@/lib/data/project-detail'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { getRegistryProjects, listChangeRequests, listWorkItems } from '@/lib/team/work'
import { listRevenue } from '@/lib/team/revenue'
import { autoRevenueFor } from '@/lib/team/revenue-auto'
import { odysseyInFlight, odysseyMetrics, openPayoutWeeks } from '@/lib/odyssey/cached'
import { odysseyConfigured } from '@/lib/odyssey/db'
import { AgentRow } from '../../ui'
import WorkItems from './WorkItems'
import RevenuePanel from './RevenuePanel'
import OdysseyMoney from './OdysseyMoney'
import OdysseyPayouts from './OdysseyPayouts'

export const dynamic = 'force-dynamic'

const REQ_STATUS: Record<string, string> = { new: 'concept', planned: 'pilot', awaiting_approval: 'building', approved: 'building', in_progress: 'building', deployed: 'live', done: 'live', rejected: 'internal' }
const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
type Tab = 'overview' | 'money' | 'payouts' | 'work' | 'setup'

export default async function ProjectDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab: tabParam }] = await Promise.all([params, searchParams])
  const p = PROJECTS.find((x) => x.id === id)
  if (!p) notFound()
  const d = detailFor(id)
  const hasMoney = d.money === 'odyssey'
  const tabs: { key: Tab; label: string }[] = [{ key: 'overview', label: 'Overview' }, { key: 'money', label: 'Money' }, ...(hasMoney ? [{ key: 'payouts' as Tab, label: 'Payouts' }] : []), { key: 'work', label: 'Work' }, { key: 'setup', label: 'Setup' }]
  const tab: Tab = (tabs.find((t) => t.key === tabParam)?.key ?? 'overview')

  const jar = await cookies()
  const session = await verifySession(jar.get(ADMIN_COOKIE)?.value)
  const isAdmin = session?.role === 'admin'
  const agents = AGENTS.filter((a) => p.agents?.includes(a.id))
  const [work, requests, registry, revenue, m, inFlight] = await Promise.all([
    listWorkItems(id), listChangeRequests(d.opsIds), getRegistryProjects(d.opsIds), listRevenue(id).catch(() => []),
    hasMoney ? odysseyMetrics() : Promise.resolve(null), hasMoney ? odysseyInFlight() : Promise.resolve([]),
  ])
  const autoRev = await autoRevenueFor(id, m)
  const revenueTotal = Math.round((revenue.reduce((a, r) => a + r.amount, 0) + autoRev.reduce((a, l) => a + l.amount, 0)) * 100) / 100
  const openWork = work.filter((w) => w.status !== 'done')
  const openReqs = requests.filter((r) => !['deployed', 'done', 'rejected'].includes(r.status))
  const payoutInfo = m ? openPayoutWeeks(m, inFlight) : null
  const counts: Partial<Record<Tab, number>> = { work: openWork.length + openReqs.length, payouts: payoutInfo?.actionable.length || undefined }
  const href = (t: Tab) => (t === 'overview' ? `/admin/projects/${id}` : `/admin/projects/${id}?tab=${t}`)

  return (
    <>
      <div className="admin-crumb"><Link href="/admin/projects">Projects</Link> / {p.name}</div>
      <div className="admin-head compact">
        <div>
          <h1>{p.emoji} {p.name}</h1>
          <p>{p.client} · {p.vertical} · {p.tier} · {revenueTotal > 0 ? <b className="green">{fmt$(revenueTotal)} earned</b> : 'nothing earned yet'}{m ? <> · {m.usage.upcomingEvents} upcoming events · {fmt$(m.money.last7.gross)} last 7d</> : null}</p>
        </div>
        <div className="head-actions">
          {d.pieces.slice(0, 2).map((x) => x.href && <a key={x.label} href={x.href} target="_blank" rel="noreferrer" className="chip">{x.label} ↗</a>)}
          <span className={`status ${p.status}`}>{STATUS_LABEL[p.status]}</span>
        </div>
      </div>

      <nav className="tabs">
        {tabs.map((t) => <Link key={t.key} href={href(t.key)} className={tab === t.key ? 'on' : ''}>{t.label}{counts[t.key] ? <span className="tab-badge">{counts[t.key]}</span> : null}</Link>)}
      </nav>

      {tab === 'overview' && (
        <>
          {d.rules && <div className="rules-bar">{d.rules.map((r) => <span key={r}>⚠ {r}</span>)}</div>}
          <div className="two-col wide-left">
            <div className="stack">
              <section className="card"><div className="card-head"><h2>What it is</h2></div><p className="prose">{p.summary}</p></section>
              {d.delivered.length > 0 ? (
                <section className="card">
                  <div className="card-head"><h2>Delivered</h2><span className="muted">{d.delivered.reduce((n, g) => n + g.items.length, 0)} features live</span></div>
                  <div className="deliv-grid">{d.delivered.map((g) => <div key={g.title}><h4>{g.title}</h4><ul>{g.items.map((f) => <li key={f}>{f}</li>)}</ul></div>)}</div>
                </section>
              ) : <section className="card"><div className="card-head"><h2>Features</h2></div><ul className="plain">{p.features.map((f) => <li key={f}>{f}</li>)}</ul></section>}
              {agents.length > 0 && <section className="card"><div className="card-head"><h2>Agents on this project</h2></div><div className="agent-stream">{agents.map((a) => <AgentRow key={a.id} a={a} />)}</div></section>}
            </div>
            <div className="stack">
              {(openWork.length > 0 || openReqs.length > 0 || (payoutInfo && payoutInfo.actionable.length > 0)) && (
                <section className="card">
                  <div className="card-head"><h2>Needs attention</h2></div>
                  <div className="action-list">
                    {payoutInfo?.actionable.map((w) => <Link key={w.start} href={href('payouts')} className={`action tone-${w.state === 'overdue' ? 'red' : 'amber'}`}><span className="action-ico">$</span><span className="action-body"><b>Pay week {w.memo}</b><small>{w.state} · due {w.dueDate}</small></span><span className="action-amt">${w.due.toFixed(2)}</span></Link>)}
                    {openReqs.slice(0, 3).map((r) => <Link key={r.id} href={href('work')} className="action tone-blue"><span className="action-ico">✉</span><span className="action-body"><b>{r.summary ?? r.body.slice(0, 70)}</b><small>merchant request · {r.status.replace('_', ' ')}</small></span></Link>)}
                    {openWork.slice(0, 4).map((w) => <Link key={w.id} href={href('work')} className={`action tone-${w.status === 'doing' ? 'green' : 'grey'}`}><span className="action-ico">✎</span><span className="action-body"><b>{w.title}</b><small>{w.status === 'doing' ? 'in progress' : 'to do'} · {w.kind}</small></span></Link>)}
                  </div>
                </section>
              )}
              <section className="card">
                <div className="card-head"><h2>Product pieces</h2></div>
                <div className="pieces">
                  {d.pieces.map((x) => <div key={x.label} className="piece">{x.href ? <a href={x.href} target="_blank" rel="noreferrer">{x.label} ↗</a> : <span>{x.label}</span>}{x.note && <small>{x.note}</small>}</div>)}
                  {d.pieces.length === 0 && p.links && Object.entries(p.links).map(([k, v]) => v && <div key={k} className="piece"><a href={v} target="_blank" rel="noreferrer">{k} ↗</a></div>)}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {tab === 'money' && (
        <div className="stack">
          <RevenuePanel projectId={id} initial={revenue} auto={autoRev} canEdit={isAdmin} />
          {hasMoney && (m ? <OdysseyMoney m={m} /> : <section className="card"><p className="empty">{odysseyConfigured() ? 'Could not read the Odyssey ledger right now.' : <>Set <code>ODYSSEY_DATABASE_URL</code> on vbild.ai to light this up.</>}</p></section>)}
        </div>
      )}

      {tab === 'payouts' && hasMoney && (
        <div className="stack">
          {m ? <OdysseyPayouts m={m} inFlight={inFlight} isAdmin={isAdmin} /> : <section className="card"><p className="empty">Ledger unavailable.</p></section>}
        </div>
      )}

      {tab === 'work' && (
        <div className="two-col wide-left">
          <div className="stack">
            <WorkItems projectId={id} initial={work} canEdit={Boolean(session)} />
          </div>
          <div className="stack">
            <section className="card">
              <div className="card-head"><h2>Merchant change requests</h2><span className="muted">{openReqs.length} open</span></div>
              {requests.length === 0 ? <p className="empty">None yet. They arrive by SMS into the vbild-ops queue.</p> : (
                <div className="activity">
                  {requests.map((r) => (
                    <div className="act" key={r.id} style={{ gridTemplateColumns: '64px 1fr auto' }}>
                      <time>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
                      <div><b>{r.summary ?? r.body.slice(0, 90)}</b> <span>· {r.fromName ?? 'merchant'}{r.category ? ` · ${r.category}` : ''}{r.tier ? ` · ${r.tier}` : ''}{r.previewUrl ? <> · <a href={r.previewUrl} target="_blank" rel="noreferrer" className="muted-link">preview ↗</a></> : null}</span></div>
                      <span className={`status ${REQ_STATUS[r.status] ?? 'concept'}`}>{r.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'setup' && (
        <div className="two-col">
          <div className="stack">
            <section className="card">
              <div className="card-head"><h2>Details</h2></div>
              <dl className="kv">
                <div><dt>Owner</dt><dd>{p.owner}</dd></div><div><dt>Started</dt><dd>{p.started}</dd></div>
                <div><dt>Shipped</dt><dd>{p.shipped ?? '—'}</dd></div><div><dt>Days to ship</dt><dd>{p.daysToShip ?? '—'}{p.estimate && <span className="verify">EST</span>}</dd></div>
                <div><dt>Public</dt><dd>{p.public ? 'Yes — on vbild.ai' : 'No — internal'}</dd></div><div><dt>Tier</dt><dd>{p.tier}</dd></div>
              </dl>
            </section>
            <section className="card"><div className="card-head"><h2>Stack</h2></div><div className="proj-meta">{p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}</div></section>
            {d.contacts && <section className="card"><div className="card-head"><h2>People</h2></div><dl className="kv one">{d.contacts.map((c) => <div key={c.name}><dt>{c.role}</dt><dd>{c.name}<br /><small className="muted">{c.channel}</small></dd></div>)}</dl></section>}
          </div>
          <div className="stack">
            {registry.length > 0 && (
              <section className="card">
                <div className="card-head"><h2>Ops registry</h2><span className="muted">vbild-ops</span></div>
                <div className="pieces">{registry.map((r) => <div key={r.id} className="piece"><span>{r.name ?? r.id} <small className="muted">· {r.id}</small></span><small>{[r.productionUrl, r.previewUrl].filter(Boolean).join(' · ')}{r.notes ? ` · ${r.notes}` : ''}</small></div>)}</div>
              </section>
            )}
            {hasMoney && (
              <section className="card">
                <div className="card-head"><h2>Integrations</h2></div>
                <dl className="kv one">
                  <div><dt>Odyssey ledger</dt><dd>{odysseyConfigured() ? <span className="status live">connected</span> : <span className="status overdue">ODYSSEY_DATABASE_URL missing</span>}</dd></div>
                  <div><dt>Mercury read</dt><dd>{process.env.MERCURY_API_TOKEN ? <span className="status live">connected</span> : <span className="status building">MERCURY_API_TOKEN missing</span>}</dd></div>
                  <div><dt>Mercury payout requests</dt><dd>{process.env.MERCURY_PAYOUT_TOKEN ? <span className="status live">connected</span> : <span className="status building">MERCURY_PAYOUT_TOKEN missing</span>}</dd></div>
                </dl>
                <p className="hint">Env vars live on the <b>vbild</b> Vercel project (Settings → Environment Variables). Redeploy after adding.</p>
              </section>
            )}
          </div>
        </div>
      )}
    </>
  )
}
