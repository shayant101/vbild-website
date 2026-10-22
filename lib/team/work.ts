import { db, newId, teamDbConfigured } from './db'

/** Command-center work items (changes to work on) + the SMS change-request queue from vbild-ops. */
export type WorkItem = { id: string; projectId: string; title: string; kind: 'change' | 'bug' | 'idea' | 'feature'; status: 'todo' | 'doing' | 'done'; priority: 1 | 2 | 3; notes?: string; createdBy?: string; createdAt: string; doneAt?: string }
export type ChangeRequest = { id: number; projectId: string; fromName?: string; body: string; status: string; tier?: string; category?: string; summary?: string; result?: string; previewUrl?: string; createdAt: string; approvedAt?: string }
export type RegistryProject = { id: string; merchant?: string; name?: string; repoUrl?: string; vercelProjectId?: string; previewUrl?: string; productionUrl?: string; notes?: string }

const ri = (r: Record<string, unknown>): WorkItem => ({ id: r.id as string, projectId: r.project_id as string, title: r.title as string, kind: r.kind as WorkItem['kind'], status: r.status as WorkItem['status'], priority: Number(r.priority) as 1 | 2 | 3, notes: (r.notes as string) ?? undefined, createdBy: (r.created_by as string) ?? undefined, createdAt: new Date(r.created_at as string).toISOString(), doneAt: r.done_at ? new Date(r.done_at as string).toISOString() : undefined })

export async function listWorkItems(projectId: string): Promise<WorkItem[]> {
  if (!teamDbConfigured()) return []
  try { const r = await db()`select * from scan.work_items where project_id = ${projectId} order by (status = 'done'), priority, created_at desc`; return r.map(ri) } catch { return [] }
}
export async function addWorkItem(projectId: string, title: string, kind: WorkItem['kind'], priority: 1 | 2 | 3, by: string, notes?: string): Promise<WorkItem> {
  const id = newId('w')
  const r = await db()`insert into scan.work_items (id, project_id, title, kind, status, priority, notes, created_by) values (${id}, ${projectId}, ${title}, ${kind}, 'todo', ${priority}, ${notes ?? null}, ${by}) returning *`
  return ri(r[0])
}
export async function updateWorkItem(id: string, patch: Partial<Pick<WorkItem, 'status' | 'title' | 'priority' | 'kind' | 'notes'>>): Promise<void> {
  const d = db()
  if (patch.status) await d`update scan.work_items set status = ${patch.status}, done_at = ${patch.status === 'done' ? new Date() : null}, updated_at = now() where id = ${id}`
  if (patch.title) await d`update scan.work_items set title = ${patch.title}, updated_at = now() where id = ${id}`
  if (patch.priority) await d`update scan.work_items set priority = ${patch.priority}, updated_at = now() where id = ${id}`
  if (patch.kind) await d`update scan.work_items set kind = ${patch.kind}, updated_at = now() where id = ${id}`
  if (patch.notes !== undefined) await d`update scan.work_items set notes = ${patch.notes ?? null}, updated_at = now() where id = ${id}`
}
export async function deleteWorkItem(id: string): Promise<void> { await db()`delete from scan.work_items where id = ${id}` }

/** SMS change requests from merchants (vbild-ops `requests`). Approval codes are never readable by this role. */
export async function listChangeRequests(projectIds: string[]): Promise<ChangeRequest[]> {
  if (!teamDbConfigured() || projectIds.length === 0) return []
  try {
    const r = await db()`select id, project_id, from_name, body, status, tier, category, summary, result, preview_url, created_at, approved_at from public.requests where project_id in ${db()(projectIds)} order by created_at desc limit 50`
    return r.map((x) => ({ id: Number(x.id), projectId: x.project_id, fromName: x.from_name ?? undefined, body: x.body, status: x.status, tier: x.tier ?? undefined, category: x.category ?? undefined, summary: x.summary ?? undefined, result: x.result ?? undefined, previewUrl: x.preview_url ?? undefined, createdAt: new Date(x.created_at).toISOString(), approvedAt: x.approved_at ? new Date(x.approved_at).toISOString() : undefined }))
  } catch (e) { console.warn('[work] requests read failed', e instanceof Error ? e.message : e); return [] }
}
export async function getRegistryProjects(ids: string[]): Promise<RegistryProject[]> {
  if (!teamDbConfigured() || ids.length === 0) return []
  try {
    const r = await db()`select id, merchant, name, repo_url, vercel_project_id, preview_url, production_url, notes from public.projects where id in ${db()(ids)}`
    return r.map((x) => ({ id: x.id, merchant: x.merchant ?? undefined, name: x.name ?? undefined, repoUrl: x.repo_url ?? undefined, vercelProjectId: x.vercel_project_id ?? undefined, previewUrl: x.preview_url ?? undefined, productionUrl: x.production_url ?? undefined, notes: x.notes ?? undefined }))
  } catch (e) { console.warn('[work] registry read failed', e instanceof Error ? e.message : e); return [] }
}

/** Open work across all projects (for Today + nav badge). */
export async function listOpenWorkItems(): Promise<WorkItem[]> {
  if (!teamDbConfigured()) return []
  try { const r = await db()`select * from scan.work_items where status <> 'done' order by (status = 'doing') desc, priority, created_at desc`; return r.map(ri) } catch { return [] }
}
/** Open merchant change requests across all projects. */
export async function listOpenChangeRequests(): Promise<ChangeRequest[]> {
  if (!teamDbConfigured()) return []
  try {
    const r = await db()`select id, project_id, merchant, from_name, body, status, tier, category, summary, result, preview_url, created_at, approved_at from public.requests where status not in ('deployed','done','rejected') order by created_at desc limit 50`
    return r.map((x) => ({ id: Number(x.id), projectId: x.project_id, fromName: x.from_name ?? undefined, body: x.body, status: x.status, tier: x.tier ?? undefined, category: x.category ?? undefined, summary: x.summary ?? undefined, result: x.result ?? undefined, previewUrl: x.preview_url ?? undefined, createdAt: new Date(x.created_at).toISOString(), approvedAt: x.approved_at ? new Date(x.approved_at).toISOString() : undefined }))
  } catch { return [] }
}
