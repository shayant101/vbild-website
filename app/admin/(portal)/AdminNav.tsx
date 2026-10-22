'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export type Badges = { leadsNew: number; payoutsDue: number; workOpen: number }
type Item = { href: string; label: string; ico: string; badge?: number; tone?: 'red' | 'blue' | 'amber'; external?: boolean }

export default function AdminNav({ email, badges }: { email: string; badges: Badges }) {
  const path = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); router.replace('/admin/login'); router.refresh() }

  const groups: { title: string; items: Item[] }[] = [
    { title: 'Operate', items: [
      { href: '/admin', label: 'Today', ico: '◎', badge: badges.payoutsDue, tone: 'red' },
      { href: '/admin/projects', label: 'Projects', ico: '▣', badge: badges.workOpen, tone: 'amber' },
      { href: '/admin/leads', label: 'Leads', ico: '◉', badge: badges.leadsNew, tone: 'blue' },
    ] },
    { title: 'Company', items: [
      { href: '/admin/revenue', label: 'Revenue', ico: '$' },
      { href: '/admin/team', label: 'Team & devices', ico: '🔑' },
    ] },
    { title: 'Reference', items: [
      { href: '/admin/agents', label: 'Agents', ico: '⚡' },
      { href: '/admin/investors', label: 'Investor room', ico: '◆' },
      { href: '/', label: 'Public site', ico: '↗', external: true },
    ] },
  ]
  const isActive = (href: string) => (href === '/admin' ? path === '/admin' : href !== '/' && path.startsWith(href))
  const current = groups.flatMap((g) => g.items).find((i) => isActive(i.href))?.label ?? 'Today'

  return (
    <>
      <button className="admin-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}><span className="lbl">{current}</span><span>{open ? '✕' : '☰'}</span></button>
      <div className={`admin-nav${open ? ' open' : ''}`} role="navigation" onClick={() => setOpen(false)}>
        {groups.map((g) => (
          <div key={g.title} className="nav-group">
            <div className="nav-title">{g.title}</div>
            {g.items.map((i) => (
              <Link key={i.href} href={i.href} className={isActive(i.href) ? 'active' : ''} target={i.external ? '_blank' : undefined}>
                <span className="ico">{i.ico}</span><span className="lbl">{i.label}</span>
                {i.badge ? <span className={`nav-badge ${i.tone ?? ''}`}>{i.badge}</span> : null}
              </Link>
            ))}
          </div>
        ))}
        <div className="admin-side-foot">
          <div className="admin-user" title={email}>{email}</div>
          <button className="admin-logout" onClick={logout}>Sign out</button>
        </div>
      </div>
    </>
  )
}
