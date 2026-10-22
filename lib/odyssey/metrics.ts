import { odb } from './db'
import { addDays, lastClosedSunday, memoRange, mondayOf, payoutDueDate, ptDate, round2, todayPT, weeklyDues, type LedgerEntry, type WeekDue } from './settlement'

export type WeekPoint = {
  start: string; end: string
  gross: number; refunds: number; fees: number; net: number; owed: number
  bookings: number; newCustomers: number
}
export type PayoutRequestRow = { id: string; period_start: string; period_end: string; amount: number; status: string; requested_by: string; mercury_request_id: string | null; error: string | null; created_at: string }
export type PayoutWeek = WeekDue & { dueDate: string; memo: string; state: 'overdue' | 'due' | 'upcoming' | 'paid'; request: PayoutRequestRow | null }

export type OdysseyMetrics = {
  asOf: string
  money: {
    grossAllTime: number; refundsAllTime: number; feesAllTime: number; netAllTime: number
    merchantOwedAllTime: number; vbildShareAllTime: number
    totalRemitted: number; outstandingToMerchant: number
    adjustments: number; openDisputes: number
    last7: { gross: number; bookings: number }; prev7: { gross: number; bookings: number }
    last28: { gross: number; bookings: number }; prev28: { gross: number; bookings: number }
    byType: { type: string; count: number; gross: number }[]
    avgBooking: number
  }
  usage: {
    bookingsAllTime: number; customersAllTime: number; upcomingEvents: number; completed: number; cancelled: number
    waiverRate: number; repeatRate: number; marketingOptIn: number; smsOptIn: number
    byStatus: { status: string; count: number }[]
    bySource: { source: string; count: number }[]
    lastBookingAt: string | null; lastPaymentAt: string | null
  }
  weeks: WeekPoint[]
  payouts: { weeks: PayoutWeek[]; dueNow: number; remittances: { period_start: string; period_end: string; amount: number; transferred_at: string | null; method: string | null; source: string | null }[] }
}

function sum<T>(rows: T[], f: (r: T) => number) { return round2(rows.reduce((a, r) => a + (Number(f(r)) || 0), 0)) }

export async function getOdysseyMetrics(): Promise<OdysseyMetrics | null> {
  const d = odb()
  if (!d) return null
  const [payments, adjustments, remittances, bookings, customers, disputes, payoutReqs] = await Promise.all([
    d`select paid_at, gross, stripe_fee, net, type::text as type, booking_id from payments where status = 'succeeded' and paid_at is not null order by paid_at`,
    d`select occurred_at, amount, kind from merchant_adjustments order by occurred_at`,
    d`select period_start::text, period_end::text, amount, transferred_at::text, method, source from remittances order by period_start`,
    d`select id, status::text as status, type::text as type, event_date::text as event_date, total, created_at, customer_id, waiver_signed_at, source, utm_source from bookings`,
    d`select id, created_at, marketing_opt_in, sms_opt_in from customers`,
    d`select status from disputes`,
    d`select id, period_start::text, period_end::text, amount, status, requested_by, mercury_request_id, error, created_at from payout_requests order by created_at desc`,
  ])

  // ── Settlement ledger (identical to Odyssey's) ──────────────────────────────
  const ledger: LedgerEntry[] = [
    ...payments.map((p) => ({ paid_at: new Date(p.paid_at).toISOString(), gross: Number(p.gross ?? 0), type: String(p.type) })),
    ...adjustments.map((a) => ({ paid_at: new Date(a.occurred_at).toISOString(), gross: Number(a.amount), type: 'adjustment' })),
  ]
  const totalRemitted = sum(remittances, (r) => Number(r.amount))
  const today = todayPT()
  const closedThrough = lastClosedSunday(today)
  const dues = weeklyDues(ledger, totalRemitted, closedThrough)

  const active = new Map<string, PayoutRequestRow>()
  for (const r of payoutReqs as unknown as PayoutRequestRow[]) {
    if ((r.status === 'pendingApproval' || r.status === 'approved') && !active.has(r.period_start)) active.set(r.period_start, { ...r, amount: Number(r.amount) })
  }
  const payoutWeeks: PayoutWeek[] = dues.map((w) => {
    const dueDate = payoutDueDate(w.end)
    const state: PayoutWeek['state'] = w.due <= 0.005 ? 'paid' : today > dueDate ? 'overdue' : today === dueDate ? 'due' : 'upcoming'
    return { ...w, dueDate, memo: memoRange(w.start, w.end), state, request: active.get(w.start) ?? null }
  })
  const dueNow = sum(payoutWeeks.filter((w) => w.state === 'overdue' || w.state === 'due'), (w) => w.due)

  // ── Money ───────────────────────────────────────────────────────────────────
  const isRefund = (t: string) => t === 'refund'
  const grossAllTime = sum(payments.filter((p) => !isRefund(p.type)), (p) => Number(p.gross))
  const refundsAllTime = sum(payments.filter((p) => isRefund(p.type)), (p) => Number(p.gross))
  const feesAllTime = sum(payments, (p) => Number(p.stripe_fee))
  const netAllTime = round2(grossAllTime - refundsAllTime - feesAllTime)
  const adjTotal = sum(adjustments, (a) => Number(a.amount))
  const merchantOwedAllTime = round2((grossAllTime - refundsAllTime) * 0.95 + adjTotal)
  const vbildShareAllTime = round2((grossAllTime - refundsAllTime) * 0.05)
  const outstandingToMerchant = round2(Math.max(0, merchantOwedAllTime - totalRemitted))

  const window = (from: string, to: string) => {
    const ps = payments.filter((p) => { const x = ptDate(p.paid_at); return x >= from && x <= to && !isRefund(p.type) })
    const bs = bookings.filter((b) => { const x = ptDate(b.created_at); return x >= from && x <= to && b.status !== 'pending_payment' })
    return { gross: sum(ps, (p) => Number(p.gross)), bookings: bs.length }
  }
  const last7 = window(addDays(today, -6), today), prev7 = window(addDays(today, -13), addDays(today, -7))
  const last28 = window(addDays(today, -27), today), prev28 = window(addDays(today, -55), addDays(today, -28))

  const byTypeMap = new Map<string, { count: number; gross: number }>()
  for (const p of payments) { const t = String(p.type); const e = byTypeMap.get(t) ?? { count: 0, gross: 0 }; e.count++; e.gross = round2(e.gross + Number(p.gross ?? 0)); byTypeMap.set(t, e) }
  const byType = [...byTypeMap].map(([type, v]) => ({ type, ...v })).sort((a, b) => b.gross - a.gross)

  const paidBookings = bookings.filter((b) => !['pending_payment', 'cancelled', 'refunded'].includes(b.status))
  const avgBooking = paidBookings.length ? round2(sum(paidBookings, (b) => Number(b.total)) / paidBookings.length) : 0

  // ── Usage ───────────────────────────────────────────────────────────────────
  const byStatusMap = new Map<string, number>()
  for (const b of bookings) byStatusMap.set(b.status, (byStatusMap.get(b.status) ?? 0) + 1)
  const bySourceMap = new Map<string, number>()
  for (const b of paidBookings) { const s = (b.utm_source || b.source || 'direct') as string; bySourceMap.set(s, (bySourceMap.get(s) ?? 0) + 1) }
  const custBookings = new Map<string, number>()
  for (const b of paidBookings) if (b.customer_id) custBookings.set(b.customer_id, (custBookings.get(b.customer_id) ?? 0) + 1)
  const repeaters = [...custBookings.values()].filter((n) => n > 1).length
  const waivered = paidBookings.filter((b) => b.waiver_signed_at).length

  // ── Weekly trajectory (last 16 closed weeks + current) ──────────────────────
  const weeks: WeekPoint[] = []
  const firstWeek = dues.length ? dues[0].start : mondayOf(today)
  const startWeek = (() => { let w = mondayOf(today); for (let i = 0; i < 16 && w > firstWeek; i++) w = addDays(w, -7); return w })()
  for (let wk = startWeek; wk <= today; wk = addDays(wk, 7)) {
    const end = addDays(wk, 6)
    const ps = payments.filter((p) => { const x = ptDate(p.paid_at); return x >= wk && x <= end })
    const gross = sum(ps.filter((p) => !isRefund(p.type)), (p) => Number(p.gross))
    const refunds = sum(ps.filter((p) => isRefund(p.type)), (p) => Number(p.gross))
    const fees = sum(ps, (p) => Number(p.stripe_fee))
    const due = dues.find((x) => x.start === wk)
    weeks.push({
      start: wk, end, gross, refunds, fees, net: round2(gross - refunds - fees), owed: due?.owed ?? round2((gross - refunds) * 0.95),
      bookings: bookings.filter((b) => { const x = ptDate(b.created_at); return x >= wk && x <= end && b.status !== 'pending_payment' }).length,
      newCustomers: customers.filter((c) => { const x = ptDate(c.created_at); return x >= wk && x <= end }).length,
    })
  }

  const lastBooking = bookings.length ? bookings.map((b) => new Date(b.created_at).getTime()).sort((a, b) => b - a)[0] : null
  const lastPayment = payments.length ? new Date(payments[payments.length - 1].paid_at).toISOString() : null

  return {
    asOf: new Date().toISOString(),
    money: {
      grossAllTime, refundsAllTime, feesAllTime, netAllTime, merchantOwedAllTime, vbildShareAllTime, totalRemitted, outstandingToMerchant,
      adjustments: adjTotal, openDisputes: disputes.filter((x) => !['won', 'lost', 'warning_closed', 'charge_refunded'].includes(String(x.status))).length,
      last7, prev7, last28, prev28, byType, avgBooking,
    },
    usage: {
      bookingsAllTime: bookings.length, customersAllTime: customers.length,
      upcomingEvents: bookings.filter((b) => b.event_date >= today && ['confirmed', 'pending_balance', 'balance_overdue'].includes(b.status)).length,
      completed: byStatusMap.get('completed') ?? 0, cancelled: (byStatusMap.get('cancelled') ?? 0) + (byStatusMap.get('refunded') ?? 0),
      waiverRate: paidBookings.length ? Math.round((waivered / paidBookings.length) * 100) : 0,
      repeatRate: custBookings.size ? Math.round((repeaters / custBookings.size) * 100) : 0,
      marketingOptIn: customers.filter((c) => c.marketing_opt_in).length, smsOptIn: customers.filter((c) => c.sms_opt_in).length,
      byStatus: [...byStatusMap].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      bySource: [...bySourceMap].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 6),
      lastBookingAt: lastBooking ? new Date(lastBooking).toISOString() : null, lastPaymentAt: lastPayment,
    },
    weeks,
    payouts: { weeks: payoutWeeks, dueNow, remittances: remittances.map((r) => ({ period_start: r.period_start, period_end: r.period_end, amount: Number(r.amount), transferred_at: r.transferred_at, method: r.method, source: r.source })).reverse() },
  }
}
