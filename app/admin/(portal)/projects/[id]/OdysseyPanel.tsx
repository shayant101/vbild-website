import { odysseyConfigured } from '@/lib/odyssey/db'
import { getOdysseyMetrics, type OdysseyMetrics } from '@/lib/odyssey/metrics'
import { getMercuryAccount, maxPerWeek, mercuryPayoutConfigured, mercuryReadConfigured, refreshPayoutRequests } from '@/lib/odyssey/payouts'
import { PayoutButton, RefreshStatuses } from './PayoutButton'

const fmt$ = (n: number, d = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtD = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const pct = (now: number, prev: number) => (prev <= 0 ? (now > 0 ? '+∞' : '—') : `${now >= prev ? '+' : ''}${Math.round(((now - prev) / prev) * 100)}%`)

function Trend({ now, prev }: { now: number; prev: number }) {
  const up = now >= prev
  return <span className="trend" style={{ color: prev <= 0 && now <= 0 ? 'var(--a-muted2)' : up ? '#4ade80' : '#f87171' }}>{pct(now, prev)} vs prior</span>
}

function WeeklyChart({ weeks }: { weeks: OdysseyMetrics['weeks'] }) {
  const W = 720, H = 190, padL = 44, padB = 26, padT = 10
  const max = Math.max(50, ...weeks.map((w) => w.gross))
  const bw = (W - padL - 8) / weeks.length
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const bmax = Math.max(1, ...weeks.map((w) => w.bookings))
  const line = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'}${padL + bw * i + bw / 2},${padT + (H - padT - padB) * (1 - w.bookings / bmax)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wk-chart" role="img" aria-label="Weekly gross and bookings">
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={padL} x2={W - 8} y1={y(max * t)} y2={y(max * t)} stroke="currentColor" opacity="0.08" /><text x={padL - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.5">{fmt$(max * t)}</text></g>)}
      {weeks.map((w, i) => {
        const cur = i === weeks.length - 1
        return (
          <g key={w.start}>
            <rect x={padL + bw * i + 3} y={y(w.gross)} width={Math.max(2, bw - 6)} height={H - padB - y(w.gross)} rx="4" fill={cur ? 'url(#gpart)' : 'url(#g)'} opacity={cur ? 0.6 : 1}>
              <title>{fmtD(w.start)}–{fmtD(w.end)}: gross {fmt$(w.gross, 2)} · refunds {fmt$(w.refunds, 2)} · fees {fmt$(w.fees, 2)} · to merchant {fmt$(w.owed, 2)} · {w.bookings} bookings · {w.newCustomers} new customers</title>
            </rect>
            {(i % Math.ceil(weeks.length / 8) === 0 || cur) && <text x={padL + bw * i + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.55">{fmtD(w.start)}</text>}
          </g>
        )
      })}
      <path d={line} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
      {weeks.map((w, i) => <circle key={w.start} cx={padL + bw * i + bw / 2} cy={padT + (H - padT - padB) * (1 - w.bookings / bmax)} r="2.5" fill="#fbbf24"><title>{w.bookings} bookings</title></circle>)}
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
        <linearGradient id="gpart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
      </defs>
    </svg>
  )
}

export default async function OdysseyPanel({ isAdmin }: { isAdmin: boolean }) {
  if (!odysseyConfigured()) return <div className="panel"><h3>Money &amp; usage</h3><p style={{ color: 'var(--a-muted)' }}>Set <code>ODYSSEY_DATABASE_URL</code> on vbild.ai to light this up.</p></div>
  let m: OdysseyMetrics | null = null
  let error = ''
  try { await refreshPayoutRequests(); m = await getOdysseyMetrics() } catch (e) { error = e instanceof Error ? e.message : 'query failed' }
  if (!m) return <div className="panel"><h3>Money &amp; usage</h3><p style={{ color: '#fca5a5' }}>Could not read the Odyssey ledger: {error}</p></div>
  const account = mercuryReadConfigured() ? await getMercuryAccount() : null
  const { money, usage, payouts } = m
  const dueWeeks = payouts.weeks.filter((w) => w.state !== 'paid')
  const paidWeeks = payouts.weeks.filter((w) => w.state === 'paid').length
  const STATE_LABEL: Record<string, string> = { overdue: 'Overdue', due: 'Due today', upcoming: 'Upcoming', paid: 'Paid' }

  return (
    <>
      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Money <span className="live-dot" title="Live from the Odyssey ledger" /></h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--a-muted2)' }}>Live · {new Date(m.asOf).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · 95% to merchant, 5% Vbild</span>
        </div>
        <div className="kpi-grid">
          <div className="kpi"><div className="kpi-label">Gross processed</div><div className="kpi-value">{fmt$(money.grossAllTime)}</div><div className="kpi-sub">all time · {fmt$(money.refundsAllTime)} refunded · {fmt$(money.feesAllTime)} Stripe fees</div></div>
          <div className="kpi"><div className="kpi-label">Last 7 days</div><div className="kpi-value">{fmt$(money.last7.gross)}</div><div className="kpi-sub"><Trend now={money.last7.gross} prev={money.prev7.gross} /> · {money.last7.bookings} bookings</div></div>
          <div className="kpi"><div className="kpi-label">Last 28 days</div><div className="kpi-value">{fmt$(money.last28.gross)}</div><div className="kpi-sub"><Trend now={money.last28.gross} prev={money.prev28.gross} /> · {money.last28.bookings} bookings</div></div>
          <div className="kpi"><div className="kpi-label">Vbild share (5%)</div><div className="kpi-value">{fmt$(money.vbildShareAllTime)}</div><div className="kpi-sub">on {fmt$(money.grossAllTime - money.refundsAllTime)} net of refunds</div></div>
          <div className="kpi"><div className="kpi-label">Owed to merchant</div><div className="kpi-value" style={{ color: money.outstandingToMerchant > 0 ? '#fbbf24' : undefined }}>{fmt$(money.outstandingToMerchant)}</div><div className="kpi-sub">{fmt$(money.totalRemitted)} remitted of {fmt$(money.merchantOwedAllTime)}{money.adjustments !== 0 ? ` · adj ${fmt$(money.adjustments)}` : ''}</div></div>
          <div className="kpi"><div className="kpi-label">Avg booking</div><div className="kpi-value">{fmt$(money.avgBooking)}</div><div className="kpi-sub">{money.openDisputes} open dispute{money.openDisputes === 1 ? '' : 's'}</div></div>
        </div>
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.6rem' }}>
            <h3>Weekly trajectory</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--a-muted2)' }}><span style={{ color: '#a78bfa' }}>■</span> gross collected &nbsp; <span style={{ color: '#fbbf24' }}>●</span> bookings · Mon–Sun weeks, venue time · hover for detail</span>
          </div>
          <WeeklyChart weeks={m.weeks} />
          <div className="by-type">
            {money.byType.map((t) => <span key={t.type} className="tag">{t.type} · {t.count} · {fmt$(t.gross)}</span>)}
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head"><h2>Usage</h2><span style={{ fontSize: '0.75rem', color: 'var(--a-muted2)' }}>Last booking {usage.lastBookingAt ? new Date(usage.lastBookingAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</span></div>
        <div className="kpi-grid">
          <div className="kpi"><div className="kpi-label">Bookings</div><div className="kpi-value">{usage.bookingsAllTime}</div><div className="kpi-sub">{usage.completed} completed · {usage.cancelled} cancelled/refunded</div></div>
          <div className="kpi"><div className="kpi-label">Upcoming events</div><div className="kpi-value">{usage.upcomingEvents}</div><div className="kpi-sub">confirmed, on the calendar</div></div>
          <div className="kpi"><div className="kpi-label">Customers</div><div className="kpi-value">{usage.customersAllTime}</div><div className="kpi-sub">{usage.repeatRate}% booked twice+ · {usage.marketingOptIn} email · {usage.smsOptIn} SMS opt-in</div></div>
          <div className="kpi"><div className="kpi-label">Waivers signed</div><div className="kpi-value">{usage.waiverRate}%</div><div className="kpi-sub">of paid bookings, digitally</div></div>
        </div>
        <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="panel"><h3>By status</h3><div className="bars">{usage.byStatus.map((s) => <div key={s.status} className="bar-row"><span>{s.status.replace('_', ' ')}</span><i style={{ width: `${(s.count / usage.bookingsAllTime) * 100}%` }} /><b>{s.count}</b></div>)}</div></div>
          <div className="panel"><h3>Where bookings come from</h3><div className="bars">{usage.bySource.map((s) => <div key={s.source} className="bar-row"><span>{s.source}</span><i style={{ width: `${(s.count / Math.max(1, usage.bySource[0]?.count ?? 1)) * 100}%` }} /><b>{s.count}</b></div>)}</div></div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Payouts to Odyssey</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {account && <span className="tag">Mercury {account.name}: {fmt$(account.availableBalance, 2)} available</span>}
            {mercuryReadConfigured() && <RefreshStatuses />}
          </div>
        </div>
        <div className="panel">
          <p style={{ color: 'var(--a-muted)', fontSize: '0.85rem', marginBottom: '0.9rem' }}>
            Each Mon–Sun week pays <b>95% of gross − refunds ± chargebacks</b>, due 10 days after the week ends. Requesting here only creates a Mercury approval — <b>you approve it in Mercury</b>; the Odyssey sync then records it. Cap {fmt$(maxPerWeek())}/week.
            {!mercuryPayoutConfigured() && <> <span style={{ color: '#fbbf24' }}>Payout button is off until <code>MERCURY_PAYOUT_TOKEN</code> is set on vbild.ai.</span></>}
          </p>
          {payouts.dueNow > 0 && <div className="due-banner">{fmt$(payouts.dueNow, 2)} due now across {dueWeeks.filter((w) => w.state !== 'upcoming').length} week(s)</div>}
          {dueWeeks.length === 0 ? <p style={{ color: '#4ade80' }}>All {paidWeeks} closed weeks are settled. Nothing owed.</p> : (
            <table className="pay-table">
              <thead><tr><th>Week</th><th>Gross</th><th>Refunds</th><th>Adj.</th><th>Owed (95%)</th><th>Still due</th><th>Pay by</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {dueWeeks.map((w) => (
                  <tr key={w.start} className={w.state}>
                    <td><b>{w.memo}</b></td><td>{fmt$(w.gross, 2)}</td><td>{w.refunds ? fmt$(w.refunds, 2) : '—'}</td><td>{w.adjustments ? fmt$(w.adjustments, 2) : '—'}</td><td>{fmt$(w.owed, 2)}</td><td><b>{fmt$(w.due, 2)}</b></td><td>{fmtD(w.dueDate)}</td>
                    <td>{w.request ? <span className={`status ${w.request.status === 'approved' ? 'live' : 'building'}`}>{w.request.status === 'pendingApproval' ? 'awaiting your approval' : w.request.status}</span> : <span className={`status ${w.state === 'overdue' ? 'overdue' : w.state === 'due' ? 'building' : 'pilot'}`}>{STATE_LABEL[w.state]}</span>}</td>
                    <td>{!w.request && w.state !== 'upcoming' && <PayoutButton week={w.start} amount={w.due} memo={w.memo} enabled={mercuryPayoutConfigured()} canRequest={isAdmin} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--a-muted)', fontSize: '0.85rem' }}>Remittance history · {payouts.remittances.length} transfers · {fmt$(money.totalRemitted, 2)}</summary>
            <div className="activity" style={{ marginTop: '0.6rem' }}>
              {payouts.remittances.map((r, i) => <div className="act" key={i} style={{ gridTemplateColumns: '110px 1fr' }}><time>{r.transferred_at ? fmtD(r.transferred_at) : '—'}</time><div><b>{fmt$(r.amount, 2)}</b> <span>· week {fmtD(r.period_start)}–{fmtD(r.period_end)} · {r.method ?? 'ACH'} · {r.source ?? 'manual'}</span></div></div>)}
            </div>
          </details>
        </div>
      </section>
    </>
  )
}
