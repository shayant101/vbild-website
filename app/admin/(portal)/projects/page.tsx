import Link from 'next/link'
import { PROJECTS, STATUS_LABEL, type ProjectStatus } from '@/lib/data/portfolio'
import { loadToday } from '@/lib/admin/today'

export const dynamic = 'force-dynamic'
const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const t = await loadToday()
  const rows = t.projects.filter((p) => !status || p.status === status)
  const statuses = Object.keys(STATUS_LABEL) as ProjectStatus[]
  return (
    <>
      <div className="admin-head compact">
        <div><h1>Projects</h1><p>{PROJECTS.length} projects · {fmt$(t.revenueTotal)} earned · {t.counts.workOpen} open work items</p></div>
        <div className="filters">
          <Link href="/admin/projects" className={`chip${!status ? ' on' : ''}`}>All</Link>
          {statuses.map((s) => { const n = PROJECTS.filter((p) => p.status === s).length; return n ? <Link key={s} href={`/admin/projects?status=${s}`} className={`chip${status === s ? ' on' : ''}`}>{STATUS_LABEL[s]} · {n}</Link> : null })}
        </div>
      </div>
      <div className="card flush">
        <table className="tbl">
          <thead><tr><th>Project</th><th>Status</th><th className="num">Earned</th><th className="num">Open work</th><th className="num">Requests</th><th>Pulse</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const full = PROJECTS.find((x) => x.id === p.id)!
              return (
                <tr key={p.id}>
                  <td><Link href={`/admin/projects/${p.id}`} className="tbl-primary"><span className="proj-row-emoji" style={{ ['--accent' as string]: p.accent }}>{p.emoji}</span><span><b>{p.name}</b><small>{p.client} · {full.vertical}</small></span></Link></td>
                  <td><span className={`status ${p.status}`}>{STATUS_LABEL[p.status as ProjectStatus]}</span></td>
                  <td className="num">{p.revenue ? <b className="green">{fmt$(p.revenue)}</b> : <span className="muted">—</span>}</td>
                  <td className="num">{p.openWork || <span className="muted">—</span>}</td>
                  <td className="num">{p.openRequests || <span className="muted">—</span>}</td>
                  <td className="muted">{p.pulse ?? `${full.tier} · since ${full.started}`}</td>
                  <td className="num">{p.live && <a href={p.live} target="_blank" rel="noreferrer" className="muted-link">live ↗</a>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
