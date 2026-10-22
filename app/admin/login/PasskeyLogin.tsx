'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'

export default function PasskeyLogin({ configured }: { configured: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  useEffect(() => { setSupported(browserSupportsWebAuthn()) }, [])

  async function signIn() {
    setBusy(true); setErr(null)
    try {
      const o = await fetch('/api/auth/login', { cache: 'no-store' }).then((r) => r.json())
      if (o.error) { setErr(o.error); return }
      const response = await startAuthentication({ optionsJSON: o.options })
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ challengeId: o.challengeId, response }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(d.error || 'Sign-in failed.'); return }
      const next = params.get('next')
      router.replace(next && next.startsWith('/admin') ? next : '/admin'); router.refresh()
    } catch (e) {
      const m = (e as Error).message || ''
      setErr(/not allowed|abort|cancel/i.test(m) ? 'Cancelled. Tap the button and approve the prompt.' : m || 'Sign-in failed.')
    } finally { setBusy(false) }
  }

  if (!configured) return <div className="login-err">Team sign-in isn&apos;t configured on this deployment yet (needs <code>SCAN_DATABASE_URL</code> and <code>ADMIN_SESSION_SECRET</code>).</div>
  if (!supported) return <div className="login-err">This browser doesn&apos;t support passkeys. Use Safari, Chrome or Edge on a recent device.</div>
  return (
    <>
      <button className="login-btn" onClick={signIn} disabled={busy}>{busy ? 'Waiting for your device…' : '🔑 Sign in with passkey'}</button>
      {err && <div className="login-err">{err}</div>}
    </>
  )
}
