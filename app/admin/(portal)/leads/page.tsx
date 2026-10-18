import Link from 'next/link'
import { dbConfigured, listLeads, listScans } from '@/lib/scan/db'
import LeadStatus from './LeadStatus'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const [leads, scans] = await Promise.all([listLeads(200), listScans(200)])
  return (
    <>
      <div className="admin-head">
        <div><h1>Leads &amp; scans</h1><p>{leads.length} leads · {scans.length} scans{dbConfigured() ? '' : ' · in-memory (set SCAN_DATABASE_URL)'}</p></div>
        <Link href="/scan" className="chip on" target="_blank">Open /scan ↗</Link>
      </div>
      <section className="admin-section">
        <div className="admin-section-head"><h2>Leads</h2></div>
        {leads.length === 0 ? <div className="panel"><p>No leads yet. Every unlocked report lands here with the owner&apos;s contact and the full report.</p></div> : (
          <div className="agent-stream">
            {leads.map((l) => (
              <div key={l.id} className="agent-row" style={{ gridTemplateColumns: '44px 1.4fr 1.6fr 1fr auto' }}>
                <div className="agent-ico" style={{ ['--accent' as string]: (l.score ?? 0) >= 70 ? '#4ade80' : (l.score ?? 0) >= 45 ? '#fbbf24' : '#f87171' }}>{l.score ?? '—'}</div>
                <div><div className="agent-name">{l.name}</div><div className="agent-proj">{l.phone ?? ''} {l.email ? `· ${l.email}` : ''}</div></div>
                <div className="agent-desc"><b style={{ color: 'var(--a-text)' }}>{l.businessName ?? '—'}</b><br />{l.note ?? ''}<br /><Link href={`/scan/${l.scanId}`} target="_blank" style={{ color: '#a5b4fc' }}>Open report ↗</Link></div>
                <div className="agent-io"><b>When</b> {new Date(l.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                <LeadStatus id={l.id} status={l.status} />
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="admin-section">
        <div className="admin-section-head"><h2>All scans</h2></div>
        <div className="panel activity">
          {scans.map((s) => (
            <div className="act" key={s.id} style={{ gridTemplateColumns: '120px 1fr' }}>
              <time>{new Date(s.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
              <div><b>{s.businessName ?? s.input}</b> <span>· {s.categoryId ?? ''} · score {s.score ?? '—'} · {s.status}{s.mode === 'scripted' ? ' · demo' : ''} · {s.leads} lead{s.leads === 1 ? '' : 's'} · </span><Link href={`/scan/${s.id}`} target="_blank" style={{ color: '#a5b4fc' }}>report ↗</Link></div>
            </div>
          ))}
          {scans.length === 0 && <p style={{ color: 'var(--a-muted)' }}>No scans yet.</p>}
        </div>
      </section>
    </>
  )
}
