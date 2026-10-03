import { PROJECTS, STATUS_LABEL, type ProjectStatus } from '@/lib/data/portfolio'
import { ProjectCard } from '../ui'
import Link from 'next/link'

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const list = status ? PROJECTS.filter((p) => p.status === status) : PROJECTS
  const statuses = Object.keys(STATUS_LABEL) as ProjectStatus[]
  return (
    <>
      <div className="admin-head">
        <div><h1>Projects</h1><p>{PROJECTS.length} projects · {PROJECTS.filter((p) => p.public).length} public on vbild.ai</p></div>
        <div className="filters">
          <Link href="/admin/projects" className={`chip${!status ? ' on' : ''}`}>All</Link>
          {statuses.map((s) => (
            <Link key={s} href={`/admin/projects?status=${s}`} className={`chip${status === s ? ' on' : ''}`}>{STATUS_LABEL[s]} · {PROJECTS.filter((p) => p.status === s).length}</Link>
          ))}
        </div>
      </div>
      <div className="proj-grid">{list.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
    </>
  )
}
