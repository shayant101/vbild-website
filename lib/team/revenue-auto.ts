import { odysseyConfigured } from '@/lib/odyssey/db'
import { getOdysseyMetrics, type OdysseyMetrics } from '@/lib/odyssey/metrics'

/** Revenue lines computed live from a project's own ledger (not stored). */
export type AutoLine = { label: string; amount: number; sub?: string }

export async function autoRevenueFor(projectId: string, prefetched?: OdysseyMetrics | null): Promise<AutoLine[]> {
  if (projectId === 'odyssey-vr' && odysseyConfigured()) {
    const m = prefetched ?? (await getOdysseyMetrics().catch(() => null))
    if (!m) return []
    const net = m.money.grossAllTime - m.money.refundsAllTime
    return [
      { label: '5% revenue share', amount: m.money.vbildShareAllTime, sub: `on $${net.toLocaleString('en-US', { maximumFractionDigits: 0 })} collected net of refunds · live from the Odyssey ledger` },
      { label: 'Stripe processing fees (paid out of the share)', amount: -m.money.feesAllTime, sub: 'Vbild absorbs card fees; merchant gets a clean 95%' },
    ]
  }
  return []
}
