import postgres from 'postgres'
import type { Scan } from './types'

/**
 * Storage for scans + leads. Uses Postgres (dedicated `vbild_scan` role, schema `scan`)
 * when SCAN_DATABASE_URL is set; otherwise an in-memory map so the feature still demos.
 */
const URL = process.env.SCAN_DATABASE_URL
let sql: ReturnType<typeof postgres> | null = null
function db() { if (!URL) return null; if (!sql) sql = postgres(URL, { max: 3, idle_timeout: 20, prepare: false, ssl: 'require' }); return sql }

const mem = new Map<string, Scan>()
const memLeads: Lead[] = []

export type Lead = { id: string; scanId: string; name: string; phone?: string; email?: string; note?: string; status: string; ownerNotes?: string; createdAt: string; businessName?: string; score?: number | null }

export const newId = (p = 's') => `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

export async function saveScan(s: Scan, ipHash?: string) {
  const d = db()
  if (!d) { mem.set(s.id, s); return }
  await d`insert into scan.scans (id, input, input_kind, place_id, business_name, website, phone, address, category_id, sub_vertical, rating, review_count, facts, signals, report, score, status, error, mode, ip_hash, created_at, completed_at)
    values (${s.id}, ${s.input}, ${s.inputKind}, ${s.business?.placeId ?? null}, ${s.business?.name ?? s.report?.businessName ?? null}, ${s.business?.website ?? s.site?.url ?? null}, ${s.business?.phone ?? null}, ${s.business?.address ?? null}, ${s.report?.categoryId ?? null}, ${s.report?.subVertical ?? null}, ${s.business?.rating ?? null}, ${s.business?.reviewCount ?? null}, ${d.json(s.facts as never)}, ${d.json({ business: s.business, site: s.site } as never)}, ${s.report ? d.json(s.report as never) : null}, ${s.score ?? null}, ${s.status}, ${s.error ?? null}, ${s.mode}, ${ipHash ?? null}, ${s.createdAt}, ${s.completedAt ?? null})
    on conflict (id) do update set business_name = excluded.business_name, website = excluded.website, phone = excluded.phone, address = excluded.address, category_id = excluded.category_id, sub_vertical = excluded.sub_vertical, rating = excluded.rating, review_count = excluded.review_count, facts = excluded.facts, signals = excluded.signals, report = excluded.report, score = excluded.score, status = excluded.status, error = excluded.error, mode = excluded.mode, completed_at = excluded.completed_at`
}

export async function getScan(id: string): Promise<Scan | null> {
  const d = db()
  if (!d) return mem.get(id) ?? null
  const rows = await d`select * from scan.scans where id = ${id}`
  if (!rows.length) return null
  const r = rows[0]
  const leads = await d`select count(*)::int as n from scan.leads where scan_id = ${id}`
  const sig = (r.signals || {}) as { business?: Scan['business']; site?: Scan['site'] }
  return { id: r.id, input: r.input, inputKind: r.input_kind, status: r.status, mode: r.mode, business: sig.business, site: sig.site, facts: r.facts || [], report: r.report || undefined, score: r.score ?? undefined, error: r.error ?? undefined, createdAt: new Date(r.created_at).toISOString(), completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined, unlocked: leads[0].n > 0 }
}

export async function recentScanForPlace(placeId: string, hours = 24): Promise<Scan | null> {
  const d = db(); if (!d) return null
  const rows = await d`select id from scan.scans where place_id = ${placeId} and status = 'done' and created_at > now() - (${hours} || ' hours')::interval order by created_at desc limit 1`
  return rows.length ? getScan(rows[0].id) : null
}

export async function saveLead(l: Lead) {
  const d = db()
  if (!d) { memLeads.push(l); const s = mem.get(l.scanId); if (s) s.unlocked = true; return }
  await d`insert into scan.leads (id, scan_id, name, phone, email, note, status, created_at) values (${l.id}, ${l.scanId}, ${l.name}, ${l.phone ?? null}, ${l.email ?? null}, ${l.note ?? null}, ${l.status}, ${l.createdAt})`
}

export async function listLeads(limit = 100): Promise<Lead[]> {
  const d = db()
  if (!d) return memLeads.map((l) => ({ ...l, businessName: mem.get(l.scanId)?.report?.businessName, score: mem.get(l.scanId)?.score ?? null })).reverse()
  const rows = await d`select l.*, s.business_name, s.score from scan.leads l join scan.scans s on s.id = l.scan_id order by l.created_at desc limit ${limit}`
  return rows.map((r) => ({ id: r.id, scanId: r.scan_id, name: r.name, phone: r.phone ?? undefined, email: r.email ?? undefined, note: r.note ?? undefined, status: r.status, ownerNotes: r.owner_notes ?? undefined, createdAt: new Date(r.created_at).toISOString(), businessName: r.business_name ?? undefined, score: r.score }))
}

export async function listScans(limit = 100): Promise<Array<Pick<Scan, 'id' | 'input' | 'status' | 'score' | 'createdAt' | 'mode'> & { businessName?: string; categoryId?: string; leads: number }>> {
  const d = db()
  if (!d) return Array.from(mem.values()).map((s) => ({ id: s.id, input: s.input, status: s.status, score: s.score, createdAt: s.createdAt, mode: s.mode, businessName: s.report?.businessName, categoryId: s.report?.categoryId, leads: memLeads.filter((l) => l.scanId === s.id).length })).reverse()
  const rows = await d`select s.id, s.input, s.status, s.score, s.created_at, s.mode, s.business_name, s.category_id, (select count(*)::int from scan.leads l where l.scan_id = s.id) as leads from scan.scans s order by s.created_at desc limit ${limit}`
  return rows.map((r) => ({ id: r.id, input: r.input, status: r.status, score: r.score ?? undefined, createdAt: new Date(r.created_at).toISOString(), mode: r.mode, businessName: r.business_name ?? undefined, categoryId: r.category_id ?? undefined, leads: r.leads }))
}

export async function updateLeadStatus(id: string, status: string, ownerNotes?: string) {
  const d = db()
  if (!d) { const l = memLeads.find((x) => x.id === id); if (l) { l.status = status; if (ownerNotes !== undefined) l.ownerNotes = ownerNotes } return }
  await d`update scan.leads set status = ${status}, owner_notes = coalesce(${ownerNotes ?? null}, owner_notes), updated_at = now() where id = ${id}`
}

export function dbConfigured() { return Boolean(URL) }
