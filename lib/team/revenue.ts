import { db, newId, teamDbConfigured } from './db'

/** Money Vbild has actually made, per project. Manual entries live in scan.project_revenue;
 *  revenue-share lines are computed live from the source app's ledger (see lib/odyssey/metrics). */
export type RevenueKind = 'setup' | 'monthly' | 'rev_share' | 'other'
export type RevenueEntry = { id: string; projectId: string; kind: RevenueKind; amount: number; receivedOn: string; method?: string; note?: string; approx: boolean; createdBy?: string; createdAt: string }
export const REVENUE_KINDS: RevenueKind[] = ['setup', 'monthly', 'rev_share', 'other']

const row = (r: Record<string, unknown>): RevenueEntry => ({ id: r.id as string, projectId: r.project_id as string, kind: r.kind as RevenueKind, amount: Number(r.amount), receivedOn: String(r.received_on).slice(0, 10), method: (r.method as string) ?? undefined, note: (r.note as string) ?? undefined, approx: Boolean(r.approx), createdBy: (r.created_by as string) ?? undefined, createdAt: new Date(r.created_at as string).toISOString() })

export async function listRevenue(projectId?: string): Promise<RevenueEntry[]> {
  if (!teamDbConfigured()) return []
  const d = db()
  const r = projectId
    ? await d`select id, project_id, kind, amount, received_on::text as received_on, method, note, approx, created_by, created_at from scan.project_revenue where project_id = ${projectId} order by received_on desc, created_at desc`
    : await d`select id, project_id, kind, amount, received_on::text as received_on, method, note, approx, created_by, created_at from scan.project_revenue order by received_on desc, created_at desc`
  return r.map(row)
}
export async function addRevenue(e: Omit<RevenueEntry, 'id' | 'createdAt'>): Promise<RevenueEntry> {
  const id = newId('r')
  const r = await db()`insert into scan.project_revenue (id, project_id, kind, amount, received_on, method, note, approx, created_by)
    values (${id}, ${e.projectId}, ${e.kind}, ${e.amount}, ${e.receivedOn}, ${e.method ?? null}, ${e.note ?? null}, ${e.approx}, ${e.createdBy ?? null}) returning id, project_id, kind, amount, received_on::text as received_on, method, note, approx, created_by, created_at`
  return row(r[0])
}
export async function deleteRevenue(id: string): Promise<void> { await db()`delete from scan.project_revenue where id = ${id}` }

/** Totals by project from manual entries only (rev-share is added by the caller). */
export function sumByProject(entries: RevenueEntry[]): Record<string, { total: number; byKind: Partial<Record<RevenueKind, number>> }> {
  const out: Record<string, { total: number; byKind: Partial<Record<RevenueKind, number>> }> = {}
  for (const e of entries) {
    const p = (out[e.projectId] ??= { total: 0, byKind: {} })
    p.total = Math.round((p.total + e.amount) * 100) / 100
    p.byKind[e.kind] = Math.round(((p.byKind[e.kind] ?? 0) + e.amount) * 100) / 100
  }
  return out
}
