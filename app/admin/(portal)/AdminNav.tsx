'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const ITEMS = [
  { href: '/admin', label: 'Overview', ico: '◫' },
  { href: '/admin/projects', label: 'Projects', ico: '▣' },
  { href: '/admin/agents', label: 'Agents stream', ico: '⚡' },
  { href: '/admin/investors', label: 'Investor room', ico: '◆' },
]

export default function AdminNav({ email }: { email: string }) {
  const path = usePathname()
  const router = useRouter()
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login'); router.refresh()
  }
  return (
    <>
      <div className="admin-nav" role="navigation">
        {ITEMS.map((i) => {
          const active = i.href === '/admin' ? path === '/admin' : path.startsWith(i.href)
          return (
            <Link key={i.href} href={i.href} className={active ? 'active' : ''}>
              <span className="ico">{i.ico}</span><span className="lbl">{i.label}</span>
            </Link>
          )
        })}
        <Link href="/" target="_blank"><span className="ico">↗</span><span className="lbl">Public site</span></Link>
      </div>
      <div className="admin-side-foot">
        <div className="admin-user" title={email}>{email}</div>
        <button className="admin-logout" onClick={logout}>Sign out</button>
      </div>
    </>
  )
}
