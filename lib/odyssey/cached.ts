import { unstable_cache, revalidateTag } from 'next/cache'
import { getOdysseyMetrics, type OdysseyMetrics } from './metrics'
import { listInFlightToOdyssey, mercuryReadConfigured, type InFlight } from './payouts'
import { odysseyConfigured } from './db'

/**
 * 60-second cache in front of the Odyssey ledger + Mercury so the sidebar badges,
 * Today page and project tabs don't each re-read 300 rows. Payout actions call
 * `bustOdyssey()` so the next render is fresh.
 */
export const TAG = 'odyssey'

const metricsCached = unstable_cache(async () => (odysseyConfigured() ? getOdysseyMetrics().catch(() => null) : null), ['odyssey-metrics'], { revalidate: 60, tags: [TAG] })
const inFlightCached = unstable_cache(async () => (mercuryReadConfigured() ? listInFlightToOdyssey(new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10)) : ([] as InFlight[])), ['odyssey-inflight'], { revalidate: 60, tags: [TAG] })

export async function odysseyMetrics(): Promise<OdysseyMetrics | null> { return metricsCached() }
export async function odysseyInFlight(): Promise<InFlight[]> { return inFlightCached() }
export function bustOdyssey() { revalidateTag(TAG) }

/** Weeks that still need a transfer, with in-flight Mercury ACHs matched the same way Odyssey's sync does (memo, then exact amount). */
export function openPayoutWeeks(m: OdysseyMetrics, inFlight: InFlight[]) {
  const used = new Set<string>()
  const open = m.payouts.weeks.filter((w) => w.state !== 'paid').map((w) => {
    const byMemo = inFlight.find((f) => !used.has(f.id) && f.memo && f.memo.trim().toLowerCase() === w.memo.toLowerCase())
    const hit = byMemo ?? inFlight.find((f) => !used.has(f.id) && Math.abs(f.amount - w.due) < 0.005) ?? null
    if (hit) used.add(hit.id)
    return { ...w, inFlight: hit }
  })
  const unmatched = inFlight.filter((f) => !used.has(f.id))
  const actionable = open.filter((w) => (w.state === 'overdue' || w.state === 'due') && !w.inFlight && !w.request)
  const dueNow = Math.round(actionable.reduce((a, w) => a + w.due, 0) * 100) / 100
  return { open, unmatched, actionable, dueNow }
}
