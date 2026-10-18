import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import '../admin.css'
import LoginForm from './LoginForm'
import { adminConfigured } from '@/lib/auth'

export const metadata: Metadata = { title: 'Team login — Vbild', robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <div className="admin-root">
      <div className="login-wrap" style={{ width: '100%' }}>
        <div className="login-card">
          <Link href="/" className="admin-logo"><b>Vbild</b><span>Team</span></Link>
          <h1>Sign in</h1>
          <p>Internal portal for the Vbild team — projects, agents, and delivery status.</p>
          <Suspense fallback={null}><LoginForm configured={adminConfigured()} /></Suspense>
          <div className="login-foot"><Link href="/">← Back to vbild.ai</Link></div>
        </div>
      </div>
    </div>
  )
}
