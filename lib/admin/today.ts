import { PROJECTS } from '@/lib/data/portfolio'
import { listLeads, dbConfigured as scanDbConfigured } from '@/lib/scan/db'
import { listOpenChangeRequests, listOpenWorkItems, type ChangeRequest, type WorkItem } from '@/lib/team/work'
import { listRevenue, sumByProject } from '@/lib/team/revenue'
import { autoRevenueFor } from '@/lib/team/revenue-auto'
import { odysseyInFlight, odysseyMetrics, openPayoutWeeks } from '@/lib/odyssey/cached'
import { mercuryPayoutConfigured, mercuryReadConfigured } from '@/lib/odyssey/payouts'
import { odysseyConfigured } from '@/lib/odyssey/db'
import type { OdysseyMetrics } from '@/lib/odyssey/metrics'
import { detailFor } from '@/lib/data/project-detail'

export type Action = { kind: 'payout' | 'lead' | 'work' | 'request' | 'info' | 'setup'; title: string; sub?: string; href: string; amount?: number; tone: 'red' | 'amber' | 'blue' | 'green' | 'grey' }
export type ProjectRow = { id: string; name: string; emoji: string; client: string; status: string; accent: string; revenue: number; openWork: number; openRequests: number; live?: string; pulse?: string }
export type Today = {
  actions: Action[]
  counts: { leadsNew: number; payoutsDue: number; workOpen: number }
  revenueTotal: number
  projects: ProjectRow[]
  odyssey: OdysseyMetrics | null
  inFlightTotal: number
  work: WorkItem[]
  requests: ChangeRequest[]
  leads: Awaited<ReturnType<typeof listLeads>>
}

const r2 = (n: number) => Math.round(n * 100) / 100

export async function loadToday(): Promise<Today> {
  const [m, inFlight, leads, work, requests, revenue] = await Promise.all([
    odysseyMetrics(), odysseyInFlight(), listLeads(50).catch(() => []), listOpenWorkItems(), listOpenChangeRequests(), listRevenue().catch(() => []),
  ])
  const byProj = sumByProject(revenue)
  const autos = await Promise.all(PROJECTS.map(async (p) => [p.id, (await autoRevenueFor(p.id, m)).reduce((a, l) => a + l.amount, 0)] as const))
  const autoMap = Object.fromEntries(autos)
  const projects: ProjectRow[] = PROJECTS.map((p) => {
    const ops = detailFor(p.id).opsIds
    return {
      id: p.id, name: p.name, emoji: p.emoji, client: p.client, status: p.status, accent: p.accent,
      revenue: r2((byProj[p.id]?.total ?? 0) + (autoMap[p.id] ?? 0)),
      openWork: work.filter((w) => w.projectId === p.id).length,
      openRequests: requests.filter((q) => ops.includes(q.projectId)).length,
      live: p.links?.live,
      pulse: p.id === 'odyssey-vr' && m ? `$${m.money.last7.gross.toLocaleString('en-US', { maximumFractionDigits: 0 })} last 7d · ${m.usage.upcomingEvents} upcoming` : undefined,
    }
  })
  const revenueTotal = r2(projects.reduce((a, p) => a + p.revenue, 0))

  const actions: Action[] = []
  const leadsNew = leads.filter((l) => l.status === 'new').length
  let payoutsDue = 0
  if (m) {
    const { actionable, open, unmatched } = openPayoutWeeks(m, inFlight)
    payoutsDue = actionable.length
    for (const w of actionable) actions.push({ kind: 'payout', tone: w.state === 'overdue' ? 'red' : 'amber', title: `Pay Odyssey · week ${w.memo}`, sub: `${w.state === 'overdue' ? 'Overdue since' : 'Due'} ${w.dueDate}`, amount: w.due, href: '/admin/projects/odyssey-vr?tab=payouts' })
    for (const w of open.filter((x) => x.request && x.request.status === 'pendingApproval')) actions.push({ kind: 'payout', tone: 'amber', title: `Approve in Mercury · week ${w.memo}`, sub: 'Request created from here, waiting for your approval', amount: w.due, href: 'https://app.mercury.com' })
    for (const u of unmatched) actions.push({ kind: 'info', tone: 'grey', title: `Pending Mercury transfer doesn't match a week`, sub: `$${u.amount.toFixed(2)}${u.memo ? ` · "${u.memo}"` : ''}`, href: '/admin/projects/odyssey-vr?tab=payouts' })
    if (m.money.openDisputes > 0) actions.push({ kind: 'info', tone: 'amber', title: `${m.money.openDisputes} open Stripe dispute${m.money.openDisputes === 1 ? '' : 's'} on Odyssey`, sub: 'Evidence may be due — check Stripe', href: 'https://dashboard.stripe.com/disputes' })
  }
  for (const l of leads.filter((l) => l.status === 'new').slice(0, 5)) actions.push({ kind: 'lead', tone: 'blue', title: `New lead · ${l.name}${l.businessName ? ` (${l.businessName})` : ''}`, sub: `${l.phone ?? l.email ?? ''}${l.score != null ? ` · score ${l.score}` : ''} · ${new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, href: '/admin/leads' })
  for (const q of requests.slice(0, 5)) actions.push({ kind: 'request', tone: 'blue', title: `Merchant request · ${q.summary ?? q.body.slice(0, 70)}`, sub: `${q.projectId} · ${q.status.replace('_', ' ')}${q.tier ? ` · ${q.tier}` : ''}`, href: `/admin/projects/${PROJECTS.find((p) => detailFor(p.id).opsIds.includes(q.projectId))?.id ?? 'odyssey-vr'}?tab=work` })
  for (const w of work.filter((w) => w.status === 'doing' || w.priority === 1).slice(0, 5)) actions.push({ kind: 'work', tone: w.status === 'doing' ? 'green' : 'amber', title: `${w.status === 'doing' ? 'In progress' : 'High priority'} · ${w.title}`, sub: PROJECTS.find((p) => p.id === w.projectId)?.name ?? w.projectId, href: `/admin/projects/${w.projectId}?tab=work` })

  // Setup gaps worth fixing (only shown when relevant)
  if (!odysseyConfigured()) actions.push({ kind: 'setup', tone: 'grey', title: 'Connect the Odyssey ledger', sub: 'Set ODYSSEY_DATABASE_URL in Vercel', href: '/admin/projects/odyssey-vr?tab=setup' })
  if (odysseyConfigured() && !mercuryReadConfigured()) actions.push({ kind: 'setup', tone: 'grey', title: 'Add MERCURY_API_TOKEN to vbild.ai', sub: 'Shows balance + in-flight transfers so manual payments stop looking overdue', href: '/admin/projects/odyssey-vr?tab=setup' })
  if (odysseyConfigured() && !mercuryPayoutConfigured()) actions.push({ kind: 'setup', tone: 'grey', title: 'Add MERCURY_PAYOUT_TOKEN to vbild.ai', sub: 'Enables one-click payout requests (you still approve in Mercury)', href: '/admin/projects/odyssey-vr?tab=setup' })
  if (!scanDbConfigured()) actions.push({ kind: 'setup', tone: 'grey', title: 'Scan database not connected', sub: 'Set SCAN_DATABASE_URL', href: '/admin/leads' })

  return {
    actions, counts: { leadsNew, payoutsDue, workOpen: work.length }, revenueTotal, projects, odyssey: m,
    inFlightTotal: r2(inFlight.reduce((a, f) => a + f.amount, 0)), work, requests, leads,
  }
}

/** Light version for the sidebar badges. */
export async function loadBadges(): Promise<Today['counts']> {
  try {
    const [m, inFlight, leads, work] = await Promise.all([odysseyMetrics(), odysseyInFlight(), listLeads(50).catch(() => []), listOpenWorkItems()])
    return { leadsNew: leads.filter((l) => l.status === 'new').length, payoutsDue: m ? openPayoutWeeks(m, inFlight).actionable.length : 0, workOpen: work.length }
  } catch { return { leadsNew: 0, payoutsDue: 0, workOpen: 0 } }
}
