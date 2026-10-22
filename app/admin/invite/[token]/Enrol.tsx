'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { startRegistration } from '@simplewebauthn/browser'

export default function Enrol({ token }: { token: string }) {
  const router = useRouter()
  const [state, setState] = useState<{ phase: 'checking' | 'ready' | 'busy' | 'done' | 'error'; msg?: string; name?: string; email?: string; options?: unknown; challengeId?: string }>({ phase: 'checking' })
  const [device, setDevice] = useState('')

  useEffect(() => {
    fetch('/api/auth/invite', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) setState({ phase: 'error', msg: d.error }); else { setState({ phase: 'ready', name: d.member.name, email: d.member.email, options: d.options, challengeId: d.challengeId }); setDevice(guessDevice()) } })
      .catch(() => setState({ phase: 'error', msg: 'Network error.' }))
  }, [token])

  async function enrol() {
    setState((s) => ({ ...s, phase: 'busy' }))
    try {
      const response = await startRegistration({ optionsJSON: state.options as never })
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ challengeId: state.challengeId, response, token, deviceName: device }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setState((s) => ({ ...s, phase: 'error', msg: d.error })); return }
      setState((s) => ({ ...s, phase: 'done' }))
      setTimeout(() => { router.replace('/admin'); router.refresh() }, 900)
    } catch (e) {
      const m = (e as Error).message || ''
      setState((s) => ({ ...s, phase: 'ready', msg: /not allowed|abort|cancel/i.test(m) ? 'Cancelled — tap again and approve the prompt.' : m }))
    }
  }

  if (state.phase === 'checking') return <><h1>Checking your invite…</h1><p>One moment.</p></>
  if (state.phase === 'error') return <><h1>This link won&apos;t work</h1><div className="login-err">{state.msg}</div><div className="login-foot"><a href="/admin/login">Already set up? Sign in →</a></div></>
  if (state.phase === 'done') return <><h1>You&apos;re in, {state.name?.split(' ')[0]}.</h1><p>Passkey saved on this device. Opening the portal…</p></>
  return (
    <>
      <h1>Welcome, {state.name?.split(' ')[0]}.</h1>
      <p>Set up this device so you can sign in with Touch ID, Face ID, or your phone — no password, ever. Signed in as <b>{state.email}</b>.</p>
      <label htmlFor="dev">Name this device (optional)</label>
      <input id="dev" value={device} onChange={(e) => setDevice(e.target.value)} placeholder="e.g. Shayan's MacBook" />
      <button className="login-btn" onClick={enrol} disabled={state.phase === 'busy'}>{state.phase === 'busy' ? 'Waiting for your device…' : '🔑 Create my passkey'}</button>
      {state.msg && <div className="login-err">{state.msg}</div>}
      <small style={{ display: 'block', marginTop: '0.9rem', color: 'var(--a-muted2)', fontSize: '0.75rem', lineHeight: 1.5 }}>Your passkey never leaves this device. On Apple devices it syncs through iCloud Keychain, so your iPhone will work too. You can add or remove devices later from Team → Devices.</small>
    </>
  )
}

function guessDevice() {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Android/.test(ua)) return 'Android phone'
  if (/Windows/.test(ua)) return 'Windows PC'
  return 'This device'
}
