import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Mark } from '@/components/Logo'
import '../admin.css'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { loadBadges } from '@/lib/admin/today'
import AdminNav from './AdminNav'

export const metadata: Metadata = { title: 'Vbild Team', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const [session, badges] = await Promise.all([verifySession(jar.get(ADMIN_COOKIE)?.value), loadBadges()])
  return (
    <div className="admin-root">
      <aside className="admin-side">
        <Link href="/admin" className="admin-logo"><Mark size={22} /><b>Vbild</b><span>Team</span></Link>
        <AdminNav email={session ? `${session.name} · ${session.email}` : ''} badges={badges} />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
