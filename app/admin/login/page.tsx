import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import '../admin.css'
import PasskeyLogin from './PasskeyLogin'
import { authConfigured } from '@/lib/auth'
import { teamDbConfigured } from '@/lib/team/db'
import { Mark } from '@/components/Logo'

export const metadata: Metadata = { title: 'Team sign-in — Vbild', robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <div className="admin-root">
      <div className="login-wrap" style={{ width: '100%' }}>
        <div className="login-card">
          <Link href="/" className="admin-logo"><Mark size={22} /><b>Vbild</b><span>Team</span></Link>
          <h1>Sign in</h1>
          <p>Use the passkey on this device — Touch ID, Face ID, or your phone.</p>
          <Suspense fallback={null}><PasskeyLogin configured={authConfigured() && teamDbConfigured()} /></Suspense>
          <div className="login-foot">New here? Open the invite link an admin sent you. · <Link href="/">vbild.ai</Link></div>
        </div>
      </div>
    </div>
  )
}
