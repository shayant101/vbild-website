'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Sign-in failed.'); return }
      const next = params.get('next')
      router.replace(next && next.startsWith('/admin') ? next : '/admin')
      router.refresh()
    } catch {
      setErr('Network error. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      {!configured && (
        <div className="login-err">
          Login isn&apos;t configured on this deployment yet. Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and{' '}
          <code>ADMIN_SESSION_SECRET</code> in Vercel (see <code>.env.example</code>).
        </div>
      )}
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="login-btn" disabled={busy || !configured}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {err && <div className="login-err">{err}</div>}
    </form>
  )
}
