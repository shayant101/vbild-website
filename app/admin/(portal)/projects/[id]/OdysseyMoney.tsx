import type { OdysseyMetrics } from '@/lib/odyssey/metrics'

const fmt$ = (n: number, d = 0) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtD = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const pct = (now: number, prev: number) => (prev <= 0 ? null : Math.round(((now - prev) / prev) * 100))

export function Trend({ now, prev }: { now: number; prev: number }) {
  const p = pct(now, prev)
  if (p === null) return null
  return <span className={`trend ${p >= 0 ? 'up' : 'down'}`}>{p >= 0 ? '▲' : '▼'} {Math.abs(p)}% vs prior</span>
}

export function WeeklyChart({ weeks }: { weeks: OdysseyMetrics['weeks'] }) {
  const W = 720, H = 180, padL = 44, padB = 24, padT = 8
  const max = Math.max(50, ...weeks.map((w) => w.gross))
  const bw = (W - padL - 8) / weeks.length
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const bmax = Math.max(1, ...weeks.map((w) => w.bookings))
  const yb = (n: number) => padT + (H - padT - padB) * (1 - n / bmax)
  const line = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'}${padL + bw * i + bw / 2},${yb(w.bookings)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wk-chart" role="img" aria-label="Weekly gross and bookings">
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={padL} x2={W - 8} y1={y(max * t)} y2={y(max * t)} stroke="currentColor" opacity="0.08" /><text x={padL - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.5">{fmt$(max * t)}</text></g>)}
      {weeks.map((w, i) => {
        const cur = i === weeks.length - 1
        return (
          <g key={w.start}>
            <rect x={padL + bw * i + 3} y={y(w.gross)} width={Math.max(2, bw - 6)} height={Math.max(0, H - padB - y(w.gross))} rx="4" fill="url(#g)" opacity={cur ? 0.55 : 1}>
              <title>{fmtD(w.start)}–{fmtD(w.end)}{cur ? ' (this week so far)' : ''}: gross {fmt$(w.gross, 2)} · refunds {fmt$(w.refunds, 2)} · fees {fmt$(w.fees, 2)} · to merchant {fmt$(w.owed, 2)} · {w.bookings} bookings · {w.newCustomers} new customers</title>
            </rect>
            {(i % Math.ceil(weeks.length / 8) === 0 || cur) && <text x={padL + bw * i + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.55">{fmtD(w.start)}</text>}
          </g>
        )
      })}
      <path d={line} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
      {weeks.map((w, i) => <circle key={w.start} cx={padL + bw * i + bw / 2} cy={yb(w.bookings)} r="2.5" fill="#fbbf24"><title>{w.bookings} bookings</title></circle>)}
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
    </svg>
  )
}

export default function OdysseyMoney({ m }: { m: OdysseyMetrics }) {
  const { money, usage } = m
  return (
    <>
      <div className="stat-strip">
        <div className="stat-cell"><span className="stat-l">Gross processed</span><span className="stat-v">{fmt$(money.grossAllTime)}</span><span className="stat-s">{fmt$(money.refundsAllTime)} refunded · {fmt$(money.feesAllTime)} Stripe fees</span></div>
        <div className="stat-cell"><span className="stat-l">Last 7 days</span><span className="stat-v">{fmt$(money.last7.gross)} <Trend now={money.last7.gross} prev={money.prev7.gross} /></span><span className="stat-s">{money.last7.bookings} bookings</span></div>
        <div className="stat-cell"><span className="stat-l">Last 28 days</span><span className="stat-v">{fmt$(money.last28.gross)} <Trend now={money.last28.gross} prev={money.prev28.gross} /></span><span className="stat-s">{money.last28.bookings} bookings</span></div>
        <div className="stat-cell"><span className="stat-l">Vbild 5% share</span><span className="stat-v green">{fmt$(money.vbildShareAllTime)}</span><span className="stat-s">net {fmt$(money.vbildShareAllTime - money.feesAllTime)} after Stripe fees</span></div>
        <div className="stat-cell"><span className="stat-l">Owed to merchant</span><span className="stat-v amber">{fmt$(money.outstandingToMerchant)}</span><span className="stat-s">{fmt$(money.totalRemitted)} remitted of {fmt$(money.merchantOwedAllTime)}</span></div>
        <div className="stat-cell"><span className="stat-l">Avg booking</span><span className="stat-v">{fmt$(money.avgBooking)}</span><span className="stat-s">{money.openDisputes} open dispute{money.openDisputes === 1 ? '' : 's'}{money.adjustments ? ` · adj ${fmt$(money.adjustments)}` : ''}</span></div>
      </div>

      <section className="card">
        <div className="card-head"><h2>Weekly trajectory</h2><span className="muted"><span style={{ color: '#a78bfa' }}>■</span> gross &nbsp;<span style={{ color: '#fbbf24' }}>●</span> bookings · Mon–Sun, venue time · hover for detail</span></div>
        <WeeklyChart weeks={m.weeks} />
        <div className="by-type">{money.byType.map((t) => <span key={t.type} className="tag">{t.type} · {t.count} · {fmt$(t.gross)}</span>)}</div>
      </section>

      <div className="stat-strip" style={{ marginTop: '1rem' }}>
        <div className="stat-cell"><span className="stat-l">Bookings</span><span className="stat-v">{usage.bookingsAllTime}</span><span className="stat-s">{usage.completed} completed · {usage.cancelled} cancelled/refunded</span></div>
        <div className="stat-cell"><span className="stat-l">Upcoming events</span><span className="stat-v">{usage.upcomingEvents}</span><span className="stat-s">confirmed, on the calendar</span></div>
        <div className="stat-cell"><span className="stat-l">Customers</span><span className="stat-v">{usage.customersAllTime}</span><span className="stat-s">{usage.repeatRate}% booked twice+ · {usage.marketingOptIn} email opt-in</span></div>
        <div className="stat-cell"><span className="stat-l">Waivers signed</span><span className="stat-v">{usage.waiverRate}%</span><span className="stat-s">of paid bookings · last booking {usage.lastBookingAt ? new Date(usage.lastBookingAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span></div>
      </div>
      <div className="two-col">
        <section className="card"><div className="card-head"><h2>Bookings by status</h2></div><div className="bars">{usage.byStatus.map((s) => <div key={s.status} className="bar-row"><span>{s.status.replace('_', ' ')}</span><i style={{ width: `${(s.count / usage.bookingsAllTime) * 100}%` }} /><b>{s.count}</b></div>)}</div></section>
        <section className="card"><div className="card-head"><h2>Where bookings come from</h2></div><div className="bars">{usage.bySource.map((s) => <div key={s.source} className="bar-row"><span>{s.source}</span><i style={{ width: `${(s.count / Math.max(1, usage.bySource[0]?.count ?? 1)) * 100}%` }} /><b>{s.count}</b></div>)}</div></section>
      </div>
    </>
  )
}
