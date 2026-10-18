import { AGENTS, AGENT_STATUS_LABEL, type AgentStatus } from '@/lib/data/agents'
import { AgentRow } from '../ui'
import Link from 'next/link'

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ status?: string; sellable?: string }> }) {
  const { status, sellable } = await searchParams
  let list = AGENTS
  if (status) list = list.filter((a) => a.status === status)
  if (sellable === '1') list = list.filter((a) => a.sellable)
  const statuses = Object.keys(AGENT_STATUS_LABEL) as AgentStatus[]
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Agents stream</h1>
          <p>{AGENTS.length} agents built across the account · {AGENTS.filter((a) => a.sellable).length} packageable for customers</p>
        </div>
        <div className="filters">
          <Link href="/admin/agents" className={`chip${!status && !sellable ? ' on' : ''}`}>All</Link>
          {statuses.map((s) => <Link key={s} href={`/admin/agents?status=${s}`} className={`chip${status === s ? ' on' : ''}`}>{AGENT_STATUS_LABEL[s]}</Link>)}
          <Link href="/admin/agents?sellable=1" className={`chip${sellable ? ' on' : ''}`}>Sellable</Link>
        </div>
      </div>
      <div className="agent-stream">{list.map((a) => <AgentRow key={a.id} a={a} />)}</div>
      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--a-muted2)' }}>
        Next: each agent gets a “Package” action that generates a customer-facing one-pager and a price on the Starter/Growth/Pro grid.
      </p>
    </>
  )
}
