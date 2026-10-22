import Link from 'next/link'
import { dbConfigured, listLeads, listScans } from '@/lib/scan/db'
import LeadStatus from './LeadStatus'

export const dynamic = 'force-dynamic'
const when = (s: string) => new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const [leads, scans] = await Promise.all([listLeads(200), listScans(100)])
  const list = status ? leads.filter((l) => l.status === status) : leads
  const counts = leads.reduce<Record<string, number>>((a, l) => ((a[l.status] = (a[l.status] ?? 0) + 1), a), {})
  const order = ['new', 'contacted', 'call_booked', 'proposal', 'won', 'lost']
  return (
    <>
      <div className="admin-head compact">
        <div><h1>Leads</h1><p>{leads.length} leads · {scans.length} scans{dbConfigured() ? '' : ' · in-memory (set SCAN_DATABASE_URL)'} · every unlocked Vbild Scan report lands here</p></div>
        <div className="head-actions">
          <div className="filters">
            <Link href="/admin/leads" className={`chip${!status ? ' on' : ''}`}>All</Link>
            {order.filter((s) => counts[s]).map((s) => <Link key={s} href={`/admin/leads?status=${s}`} className={`chip${status === s ? ' on' : ''}`}>{s.replace('_', ' ')} · {counts[s]}</Link>)}
          </div>
          <Link href="/scan" className="chip on" target="_blank">Open /scan ↗</Link>
        </div>
      </div>

      <div className="card flush">
        {list.length === 0 ? <p className="empty" style={{ padding: '1.2rem' }}>No leads{status ? ` with status "${status}"` : ' yet'}.</p> : (
          <table className="tbl">
            <thead><tr><th>Score</th><th>Lead</th><th>Business</th><th>Note</th><th>When</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className={l.status === 'new' ? 'is-new' : ''}>
                  <td><span className="score" style={{ ['--c' as string]: (l.score ?? 0) >= 70 ? '#4ade80' : (l.score ?? 0) >= 45 ? '#fbbf24' : '#f87171' }}>{l.score ?? '—'}</span></td>
                  <td><b>{l.name}</b><small className="sub">{[l.phone, l.email].filter(Boolean).join(' · ')}</small></td>
                  <td>{l.businessName ?? <span className="muted">—</span>}</td>
                  <td className="muted clamp">{l.note ?? ''}</td>
                  <td className="muted nowrap">{when(l.createdAt)}</td>
                  <td><LeadStatus id={l.id} status={l.status} /></td>
                  <td className="num nowrap">{l.phone && <a href={`tel:${l.phone}`} className="muted-link">call</a>} <Link href={`/scan/${l.scanId}`} target="_blank" className="muted-link">report ↗</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <details className="card" style={{ marginTop: '1rem' }}>
        <summary className="card-head" style={{ cursor: 'pointer' }}><h2>All scans · {scans.length}</h2></summary>
        <table className="tbl tight">
          <thead><tr><th>When</th><th>Business / input</th><th>Category</th><th className="num">Score</th><th>Status</th><th className="num">Leads</th><th></th></tr></thead>
          <tbody>
            {scans.map((s) => <tr key={s.id}><td className="muted nowrap">{when(s.createdAt)}</td><td><b>{s.businessName ?? s.input}</b></td><td className="muted">{s.categoryId ?? ''}</td><td className="num">{s.score ?? '—'}</td><td className="muted">{s.status}{s.mode === 'scripted' ? ' · demo' : ''}</td><td className="num">{s.leads}</td><td className="num"><Link href={`/scan/${s.id}`} target="_blank" className="muted-link">report ↗</Link></td></tr>)}
            {scans.length === 0 && <tr><td colSpan={7} className="muted">No scans yet.</td></tr>}
          </tbody>
        </table>
      </details>
    </>
  )
}
