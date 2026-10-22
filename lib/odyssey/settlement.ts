/**
 * Merchant settlement math — a 1:1 port of odyssey-vr-nextjs/lib/settlement.ts so the
 * Vbild command center shows exactly the numbers the merchant's Settlement tab shows.
 *
 * Odyssey receives 95% of GROSS collected minus refunds, plus/minus direct merchant
 * adjustments (chargebacks + their fees), in Mon–Sun weeks bucketed in venue time
 * (America/Los_Angeles). Transfers apply to the OLDEST unpaid balance first.
 * Each week is paid 10 days after it ends (the Wednesday of the week after next).
 */
export const MERCHANT_SHARE = 0.95
export const VENUE_TZ = 'America/Los_Angeles'
export const PAYOUT_LAG_DAYS = 10

export type LedgerEntry = { paid_at: string; gross: number | null; type: string }
export type WeekDue = { start: string; end: string; owed: number; due: number; gross: number; refunds: number; adjustments: number }

export const round2 = (n: number) => Math.round(n * 100) / 100

export function merchantOwed(entries: LedgerEntry[]): number {
  let gross = 0, adj = 0
  for (const p of entries) {
    const g = Number(p.gross ?? 0)
    if (p.type === 'adjustment') adj += g
    else if (p.type === 'refund') gross -= g
    else gross += g
  }
  return round2(gross * MERCHANT_SHARE + adj)
}

export function ptDate(isoTs: string | Date): string {
  return new Date(isoTs).toLocaleDateString('en-CA', { timeZone: VENUE_TZ })
}
export function todayPT(): string { return new Date().toLocaleDateString('en-CA', { timeZone: VENUE_TZ }) }
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}
export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10)
}
export function payoutDueDate(weekEnd: string): string { return addDays(weekEnd, PAYOUT_LAG_DAYS) }
export function lastClosedSunday(today = todayPT()): string {
  const dow = new Date(today + 'T12:00:00Z').getUTCDay() // 0 = Sun
  return addDays(today, -(dow === 0 ? 7 : dow))
}
/** "Oct 05 - Oct 11" — the memo the Odyssey Mercury sync parses back into a week. */
export function memoRange(start: string, end: string): string {
  const f = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' })
  return `${f(start)} - ${f(end)}`
}

export function owedThrough(entries: LedgerEntry[], throughDate: string): number {
  return merchantOwed(entries.filter((p) => ptDate(p.paid_at) <= throughDate))
}
export function weekBalanceDue(owedWeek: number, owedThroughWeekEnd: number, totalRemitted: number): number {
  const due = Math.min(owedWeek, Math.max(0, owedThroughWeekEnd - totalRemitted))
  return due < 0.005 ? 0 : round2(due)
}

/** Every Mon–Sun week from the first payment through `throughDate`, with owed + still-due balances. */
export function weeklyDues(entries: LedgerEntry[], totalRemitted: number, throughDate: string): WeekDue[] {
  const dated = entries.map((p) => ({ ...p, d: ptDate(p.paid_at) })).filter((p) => p.d <= throughDate)
  if (dated.length === 0) return []
  const first = dated.map((p) => p.d).sort()[0]
  const out: WeekDue[] = []
  for (let wk = mondayOf(first); wk <= throughDate; wk = addDays(wk, 7)) {
    const end = addDays(wk, 6)
    const inWeek = dated.filter((p) => p.d >= wk && p.d <= end)
    let gross = 0, refunds = 0, adjustments = 0
    for (const p of inWeek) {
      const g = Number(p.gross ?? 0)
      if (p.type === 'adjustment') adjustments += g
      else if (p.type === 'refund') refunds += g
      else gross += g
    }
    const owed = merchantOwed(inWeek)
    out.push({ start: wk, end, owed, due: weekBalanceDue(owed, owedThrough(entries, end), totalRemitted), gross: round2(gross), refunds: round2(refunds), adjustments: round2(adjustments) })
  }
  return out
}
