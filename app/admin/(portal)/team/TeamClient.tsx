'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startRegistration } from '@simplewebauthn/browser'
import type { Session } from '@/lib/auth'

type M = { id: string; email: string; name: string; role: string; createdAt: string; lastLoginAt?: string; passkeys?: number }
type I = { email: string; name: string; role: string; createdAt: string; expiresAt: string; used: boolean }
type K = { id: string; deviceName?: string; createdAt: string; lastUsedAt?: string; backedUp?: boolean }

export default function TeamClient({ me, members, invites, myPasskeys }: { me: Session; members: M[]; invites: I[]; myPasskeys: K[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', role: 'member' })
  const [link, setLink] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const fmt = (d?: string) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'
  const call = async (body: Record<string, unknown>) => { const r = await fetch('/api/admin/team', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) { setMsg(d.error || 'Failed'); return null } return d }

  async function invite(e: React.FormEvent) { e.preventDefault(); setMsg(null); const d = await call({ action: 'invite', ...form }); if (d?.url) { setLink(d.url); setForm({ name: '', email: '', role: 'member' }); router.refresh() } }
  async function addDevice() {
    setMsg(null)
    try {
      const o = await fetch('/api/auth/register', { cache: 'no-store' }).then((r) => r.json())
      const response = await startRegistration({ optionsJSON: o.options })
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ challengeId: o.challengeId, response, deviceName: prompt('Name this device', 'New device') || 'New device' }) })
      if (!r.ok) setMsg((await r.json()).error || 'Could not add device'); else router.refresh()
    } catch (e) { setMsg((e as Error).message) }
  }
  async function revoke(id: string) { if (!confirm('Remove this device? It will no longer be able to sign in.')) return; await call({ action: 'revoke-passkey', id }); router.refresh() }
  async function remove(id: string, name: string) { if (!confirm(`Remove ${name} from the team?`)) return; await call({ action: 'remove-member', id }); router.refresh() }

  return (
    <div className="detail-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div className="panel">
          <h3>Members</h3>
          <div className="agent-stream">
            {members.map((m) => (
              <div key={m.id} className="agent-row" style={{ gridTemplateColumns: '44px 1.4fr 1fr 1fr auto' }}>
                <div className="agent-ico" style={{ ['--accent' as string]: m.role === 'admin' ? '#a855f7' : '#6366f1' }}>{m.name.slice(0, 1)}</div>
                <div><div className="agent-name">{m.name}{m.id === me.id && <span className="tag" style={{ marginLeft: '0.5rem' }}>you</span>}</div><div className="agent-proj">{m.email}</div></div>
                <div className="agent-io"><b>Role</b> {m.role}<br /><b>Devices</b> {m.passkeys ?? 0}</div>
                <div className="agent-io"><b>Last sign-in</b> {fmt(m.lastLoginAt)}</div>
                {me.role === 'admin' && m.id !== me.id ? <button className="chip" onClick={() => remove(m.id, m.name)}>Remove</button> : <span />}
              </div>
            ))}
          </div>
        </div>
        {me.role === 'admin' && (
          <div className="panel">
            <h3>Invite someone</h3>
            <form onSubmit={invite} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto auto', gap: '0.5rem', alignItems: 'end' }}>
              <div><label style={{ fontSize: '0.7rem', color: 'var(--a-muted2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label><input className="login-card-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></div>
              <div><label style={{ fontSize: '0.7rem', color: 'var(--a-muted2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></div>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, width: 'auto' }}><option value="member">member</option><option value="admin">admin</option></select>
              <button className="login-btn" style={{ width: 'auto', margin: 0, padding: '0.6rem 1rem' }}>Create invite link</button>
            </form>
            {link && <div className="panel" style={{ marginTop: '0.9rem', background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.35)' }}><p style={{ color: 'var(--a-text)', fontSize: '0.85rem' }}>Send this link to them (valid 7 days, works once):</p><code style={{ display: 'block', marginTop: '0.4rem', wordBreak: 'break-all', fontSize: '0.8rem', color: '#86efac' }}>{link}</code><button className="chip on" style={{ marginTop: '0.6rem' }} onClick={() => navigator.clipboard.writeText(link)}>Copy</button></div>}
            {invites.length > 0 && <div className="activity" style={{ marginTop: '1rem' }}>{invites.slice(0, 6).map((i, n) => <div key={n} className="act"><time>{fmt(i.createdAt)}</time><div><b>{i.name}</b> <span>· {i.email} · {i.role} · {i.used ? 'used ✓' : new Date(i.expiresAt) < new Date() ? 'expired' : 'pending'}</span></div></div>)}</div>}
          </div>
        )}
      </div>
      <div className="panel">
        <h3>Your devices</h3>
        <ul>{myPasskeys.map((k) => <li key={k.id} style={{ justifyContent: 'space-between' }}><span>{k.deviceName || 'Passkey'}{k.backedUp ? ' · synced' : ''} <small style={{ color: 'var(--a-muted2)' }}>· added {fmt(k.createdAt)} · last used {fmt(k.lastUsedAt)}</small></span>{myPasskeys.length > 1 && <button className="chip" onClick={() => revoke(k.id)}>Remove</button>}</li>)}</ul>
        <button className="chip on" style={{ marginTop: '1rem' }} onClick={addDevice}>+ Add this device</button>
        <p style={{ marginTop: '0.8rem', fontSize: '0.78rem' }}>Keep at least one device. If you lose all of them, an admin can send you a new invite link.</p>
        {msg && <div className="login-err" style={{ marginTop: '0.8rem' }}>{msg}</div>}
      </div>
    </div>
  )
}
const inputStyle: React.CSSProperties = { width: '100%', background: '#0a0a16', border: '1px solid var(--a-border)', borderRadius: 8, padding: '0.55rem 0.7rem', color: 'var(--a-text)', fontSize: '0.9rem' }
