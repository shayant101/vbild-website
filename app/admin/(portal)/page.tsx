import Link from 'next/link'
import { loadToday, type Action } from '@/lib/admin/today'
import { STATUS_LABEL, type ProjectStatus } from '@/lib/data/portfolio'

export const dynamic = 'force-dynamic'

const fmt$ = (n: number, d = 0) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const pct = (now: number, prev: number) => (prev <= 0 ? null : Math.round(((now - prev) / prev) * 100))
const ICON: Record<Action['kind'], string> = { payout: '$', lead: '◉', work: '✎', request: '✉', info: 'i', setup: '⚙' }

function Trend({ now, prev }: { now: number; prev: number }) {
  const p = pct(now, prev)
  if (p === null) return null
  return <span className={`trend ${p >= 0 ? 'up' : 'down'}`}>{p >= 0 ? '▲' : '▼'} {Math.abs(p)}%</span>
}

export default async function Today() {
  const t = await loadToday()
  const m = t.odyssey
  const greeting = (() => { const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Los_Angeles' })); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' })()
  const needs = t.actions.filter((a) => a.kind !== 'setup' && a.kind !== 'info')
  const fyi = t.actions.filter((a) => a.kind === 'info' || a.kind === 'setup')

  return (
    <>
      <div className="admin-head compact">
        <div>
          <h1>{greeting}, Shayan</h1>
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' })} · {needs.length === 0 ? 'nothing needs you right now' : `${needs.length} thing${needs.length === 1 ? '' : 's'} need you`}</p>
        </div>
        <div className="head-actions">
          <Link href="/admin/leads" className="chip">Leads{t.counts.leadsNew ? ` · ${t.counts.leadsNew} new` : ''}</Link>
          <Link href="/admin/projects/odyssey-vr?tab=payouts" className="chip">Payouts{t.counts.payoutsDue ? ` · ${t.counts.payoutsDue} due` : ''}</Link>
          <Link href="/scan" className="chip on" target="_blank">Run a scan ↗</Link>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-cell"><span className="stat-l">Revenue to date</span><span className="stat-v green">{fmt$(t.revenueTotal)}</span><span className="stat-s">fees + rev share, net of Stripe</span></div>
        {m && <div className="stat-cell"><span className="stat-l">Odyssey · last 7 days</span><span className="stat-v">{fmt$(m.money.last7.gross)} <Trend now={m.money.last7.gross} prev={m.money.prev7.gross} /></span><span className="stat-s">{m.money.last7.bookings} bookings · {m.usage.upcomingEvents} upcoming events</span></div>}
        {m && <div className="stat-cell"><span className="stat-l">Owed to Odyssey</span><span className="stat-v amber">{fmt$(m.money.outstandingToMerchant)}</span><span className="stat-s">{t.inFlightTotal > 0 ? `${fmt$(t.inFlightTotal, 2)} in flight · ` : ''}{t.counts.payoutsDue} week{t.counts.payoutsDue === 1 ? '' : 's'} to pay</span></div>}
        <div className="stat-cell"><span className="stat-l">Leads</span><span className="stat-v">{t.counts.leadsNew}<small> new</small></span><span className="stat-s">{t.leads.length} total from Vbild Scan</span></div>
        <div className="stat-cell"><span className="stat-l">Open work</span><span className="stat-v">{t.counts.workOpen}</span><span className="stat-s">{t.work.filter((w) => w.status === 'doing').length} in progress · {t.requests.length} merchant requests</span></div>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head"><h2>Needs you</h2><span className="muted">{needs.length}</span></div>
          {needs.length === 0 ? <p className="empty">Inbox zero. Payouts are current, no new leads, nothing in progress.</p> : (
            <div className="action-list">
              {needs.map((a, i) => (
                <Link key={i} href={a.href} className={`action tone-${a.tone}`} target={a.href.startsWith('http') ? '_blank' : undefined}>
                  <span className="action-ico">{ICON[a.kind]}</span>
                  <span className="action-body"><b>{a.title}</b>{a.sub && <small>{a.sub}</small>}</span>
                  {a.amount != null && <span className="action-amt">{fmt$(a.amount, 2)}</span>}
                  <span className="action-go">→</span>
                </Link>
              ))}
            </div>
          )}
          {fyi.length > 0 && (
            <details className="fyi">
              <summary>{fyi.length} FYI / setup</summary>
              <div className="action-list">
                {fyi.map((a, i) => (
                  <Link key={i} href={a.href} className={`action tone-${a.tone}`} target={a.href.startsWith('http') ? '_blank' : undefined}>
                    <span className="action-ico">{ICON[a.kind]}</span>
                    <span className="action-body"><b>{a.title}</b>{a.sub && <small>{a.sub}</small>}</span>
                    <span className="action-go">→</span>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Projects</h2><Link href="/admin/projects" className="muted-link">All →</Link></div>
          <div className="proj-rows">
            {t.projects.map((p) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} className="proj-row" style={{ ['--accent' as string]: p.accent }}>
                <span className="proj-row-emoji">{p.emoji}</span>
                <span className="proj-row-main"><b>{p.name}</b><small>{p.pulse ?? p.client}</small></span>
                <span className="proj-row-meta">
                  {p.revenue > 0 && <span className="tag green">{fmt$(p.revenue)}</span>}
                  {p.openWork > 0 && <span className="tag">{p.openWork} work</span>}
                  {p.openRequests > 0 && <span className="tag blue">{p.openRequests} req</span>}
                  <span className={`status ${p.status}`}>{STATUS_LABEL[p.status as ProjectStatus]}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
