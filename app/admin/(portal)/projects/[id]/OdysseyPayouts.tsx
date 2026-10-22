import type { OdysseyMetrics } from '@/lib/odyssey/metrics'
import { openPayoutWeeks } from '@/lib/odyssey/cached'
import { getMercuryAccount, maxPerWeek, mercuryPayoutConfigured, mercuryReadConfigured, type InFlight } from '@/lib/odyssey/payouts'
import { PayoutButton, RefreshStatuses } from './PayoutButton'

const fmt$ = (n: number, d = 2) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtD = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const STATE_LABEL: Record<string, string> = { overdue: 'Overdue', due: 'Due today', upcoming: 'Upcoming', paid: 'Paid' }

export default async function OdysseyPayouts({ m, inFlight, isAdmin }: { m: OdysseyMetrics; inFlight: InFlight[]; isAdmin: boolean }) {
  const account = mercuryReadConfigured() ? await getMercuryAccount() : null
  const { open, unmatched, dueNow } = openPayoutWeeks(m, inFlight)
  const paidWeeks = m.payouts.weeks.length - open.length
  const inFlightTotal = inFlight.reduce((a, f) => a + f.amount, 0)

  return (
    <>
      <div className="stat-strip">
        <div className="stat-cell"><span className="stat-l">Due now</span><span className={`stat-v ${dueNow > 0 ? 'amber' : 'green'}`}>{fmt$(dueNow)}</span><span className="stat-s">{open.filter((w) => (w.state === 'overdue' || w.state === 'due') && !w.inFlight && !w.request).length} week(s) to send</span></div>
        <div className="stat-cell"><span className="stat-l">In flight</span><span className="stat-v">{fmt$(inFlightTotal)}</span><span className="stat-s">{inFlight.length} pending ACH in Mercury</span></div>
        <div className="stat-cell"><span className="stat-l">Owed total</span><span className="stat-v">{fmt$(m.money.outstandingToMerchant)}</span><span className="stat-s">incl. current open week</span></div>
        <div className="stat-cell"><span className="stat-l">Remitted</span><span className="stat-v">{fmt$(m.money.totalRemitted, 0)}</span><span className="stat-s">{m.payouts.remittances.length} transfers · {paidWeeks} weeks settled</span></div>
        {account && <div className="stat-cell"><span className="stat-l">Mercury {account.name}</span><span className="stat-v">{fmt$(account.availableBalance)}</span><span className="stat-s">available</span></div>}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Weeks to settle</h2>
          <div className="head-actions">{mercuryReadConfigured() && <RefreshStatuses />}</div>
        </div>
        <p className="hint">95% of gross − refunds ± chargebacks per Mon–Sun week, due 10 days after the week ends. <b>Request</b> creates a Mercury approval; you approve in Mercury; Odyssey records it after it posts. Cap {fmt$(maxPerWeek(), 0)}/week.
          {!mercuryPayoutConfigured() && <> <span className="warn">Request button is off until <code>MERCURY_PAYOUT_TOKEN</code> is set on vbild.ai.</span></>}
          {!mercuryReadConfigured() && <> <span className="warn">Set <code>MERCURY_API_TOKEN</code> to see manual transfers as in-flight instead of overdue.</span></>}
        </p>
        {open.length === 0 ? <p className="empty">All {paidWeeks} closed weeks are settled.</p> : (
          <table className="tbl tight">
            <thead><tr><th>Week</th><th className="num">Gross</th><th className="num">Refunds</th><th className="num">Adj.</th><th className="num">Owed</th><th className="num">Still due</th><th>Pay by</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {open.map((w) => (
                <tr key={w.start} className={w.inFlight ? '' : w.state}>
                  <td className="nowrap"><b>{w.memo}</b></td><td className="num">{fmt$(w.gross)}</td><td className="num">{w.refunds ? fmt$(w.refunds) : '—'}</td><td className="num">{w.adjustments ? fmt$(w.adjustments) : '—'}</td><td className="num">{fmt$(w.owed)}</td><td className="num"><b>{fmt$(w.due)}</b></td><td className="nowrap">{fmtD(w.dueDate)}</td>
                  <td>{w.inFlight ? <span className="status live" title={`Mercury ${w.inFlight.id}`}>sent · ACH pending</span> : w.request ? <span className={`status ${w.request.status === 'approved' ? 'live' : 'building'}`}>{w.request.status === 'pendingApproval' ? 'approve in Mercury' : w.request.status}</span> : <span className={`status ${w.state === 'overdue' ? 'overdue' : w.state === 'due' ? 'building' : 'pilot'}`}>{STATE_LABEL[w.state]}</span>}</td>
                  <td className="num">{!w.request && !w.inFlight && w.state !== 'upcoming' && <PayoutButton week={w.start} amount={w.due} memo={w.memo} enabled={mercuryPayoutConfigured()} canRequest={isAdmin} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {unmatched.length > 0 && <p className="warn" style={{ marginTop: '0.6rem' }}>Pending Mercury transfers that don&apos;t match a week: {unmatched.map((f) => `${fmt$(f.amount)}${f.memo ? ` "${f.memo}"` : ''}`).join(', ')}.</p>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Remittance history</h2><span className="muted">{m.payouts.remittances.length} transfers · {fmt$(m.money.totalRemitted)}</span></div>
        <table className="tbl tight">
          <thead><tr><th>Sent</th><th>Week</th><th>Method</th><th>Source</th><th className="num">Amount</th></tr></thead>
          <tbody>{m.payouts.remittances.map((r, i) => <tr key={i}><td className="muted nowrap">{r.transferred_at ? fmtD(r.transferred_at) : '—'}</td><td>{fmtD(r.period_start)} – {fmtD(r.period_end)}</td><td className="muted">{r.method ?? 'ACH'}</td><td className="muted">{r.source ?? 'manual'}</td><td className="num"><b>{fmt$(r.amount)}</b></td></tr>)}</tbody>
        </table>
      </section>
    </>
  )
}
