import Link from 'next/link'
import { PROJECTS } from '@/lib/data/portfolio'
import { listRevenue, sumByProject } from '@/lib/team/revenue'
import { autoRevenueFor } from '@/lib/team/revenue-auto'
import { odysseyMetrics } from '@/lib/odyssey/cached'
import { WeeklyChart } from '../projects/[id]/OdysseyMoney'

export const dynamic = 'force-dynamic'
const fmt$ = (n: number, d = 0) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

export default async function RevenuePage() {
  const [manual, m] = await Promise.all([listRevenue().catch(() => []), odysseyMetrics()])
  const byProj = sumByProject(manual)
  const autos = Object.fromEntries(await Promise.all(PROJECTS.map(async (p) => [p.id, await autoRevenueFor(p.id, m)] as const)))
  const rows = PROJECTS.map((p) => {
    const mm = byProj[p.id] ?? { total: 0, byKind: {} }
    const share = Math.round((autos[p.id] ?? []).reduce((a, l) => a + l.amount, 0) * 100) / 100
    return { p, setup: mm.byKind.setup ?? 0, monthly: mm.byKind.monthly ?? 0, other: (mm.byKind.other ?? 0) + (mm.byKind.rev_share ?? 0), share, total: Math.round((mm.total + share) * 100) / 100 }
  }).filter((r) => r.total !== 0).sort((a, b) => b.total - a.total)
  const total = Math.round(rows.reduce((a, r) => a + r.total, 0) * 100) / 100
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthManual = manual.filter((e) => e.receivedOn.startsWith(thisMonth)).reduce((a, e) => a + e.amount, 0)
  const monthShare = m ? Math.round((m.weeks.filter((w) => w.start.startsWith(thisMonth)).reduce((a, w) => a + (w.gross - w.refunds) * 0.05 - w.fees, 0)) * 100) / 100 : 0

  return (
    <>
      <div className="admin-head compact">
        <div><h1>Revenue</h1><p>What Vbild has actually made, by project. Fees are logged on each project page; revenue share is live from the app&apos;s ledger.</p></div>
      </div>
      <div className="stat-strip">
        <div className="stat-cell"><span className="stat-l">To date</span><span className="stat-v green">{fmt$(total)}</span><span className="stat-s">{rows.length} paying project{rows.length === 1 ? '' : 's'}</span></div>
        <div className="stat-cell"><span className="stat-l">This month</span><span className="stat-v">{fmt$(monthManual + monthShare)}</span><span className="stat-s">{fmt$(monthManual)} fees · {fmt$(monthShare)} rev share net</span></div>
        {m && <div className="stat-cell"><span className="stat-l">Odyssey take rate</span><span className="stat-v">{((m.money.vbildShareAllTime - m.money.feesAllTime) / Math.max(1, m.money.grossAllTime - m.money.refundsAllTime) * 100).toFixed(1)}%</span><span className="stat-s">5% share minus {(m.money.feesAllTime / Math.max(1, m.money.grossAllTime) * 100).toFixed(1)}% Stripe fees</span></div>}
      </div>

      <div className="card flush">
        <table className="tbl">
          <thead><tr><th>Project</th><th className="num">Setup</th><th className="num">Monthly</th><th className="num">Other</th><th className="num">Rev share (net)</th><th className="num">Total</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.p.id}>
                <td><Link href={`/admin/projects/${r.p.id}?tab=money`} className="tbl-primary"><span className="proj-row-emoji" style={{ ['--accent' as string]: r.p.accent }}>{r.p.emoji}</span><span><b>{r.p.name}</b><small>{r.p.client}</small></span></Link></td>
                <td className="num">{r.setup ? fmt$(r.setup) : <span className="muted">—</span>}</td>
                <td className="num">{r.monthly ? fmt$(r.monthly) : <span className="muted">—</span>}</td>
                <td className="num">{r.other ? fmt$(r.other) : <span className="muted">—</span>}</td>
                <td className="num">{r.share ? fmt$(r.share) : <span className="muted">—</span>}</td>
                <td className="num"><b className="green">{fmt$(r.total)}</b></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="muted">Nothing logged yet.</td></tr>}
            <tr className="tbl-total"><td>Total</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.setup, 0))}</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.monthly, 0))}</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.other, 0))}</td><td className="num">{fmt$(rows.reduce((a, r) => a + r.share, 0))}</td><td className="num"><b>{fmt$(total)}</b></td></tr>
          </tbody>
        </table>
      </div>

      {m && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <div className="card-head"><h2>Odyssey · weekly gross &amp; bookings</h2><Link href="/admin/projects/odyssey-vr?tab=money" className="muted-link">Full money view →</Link></div>
          <WeeklyChart weeks={m.weeks} />
        </section>
      )}

      <section className="card" style={{ marginTop: '1rem' }}>
        <div className="card-head"><h2>Payments log</h2><span className="muted">{manual.length} entries</span></div>
        {manual.length === 0 ? <p className="empty">No payments logged. Open a project → Money → Log a payment.</p> : (
          <table className="tbl tight">
            <thead><tr><th>Date</th><th>Project</th><th>Kind</th><th>Note</th><th>Method</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {manual.map((e) => <tr key={e.id}><td className="muted">{e.receivedOn}{e.approx ? ' ~' : ''}</td><td>{PROJECTS.find((p) => p.id === e.projectId)?.name ?? e.projectId}</td><td>{e.kind.replace('_', ' ')}</td><td className="muted">{e.note ?? ''}</td><td className="muted">{e.method ?? ''}</td><td className="num"><b>{fmt$(e.amount, 2)}</b></td></tr>)}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
