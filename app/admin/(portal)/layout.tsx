import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import '../admin.css'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import AdminNav from './AdminNav'

export const metadata: Metadata = { title: 'Vbild Team', robots: { index: false, follow: false } }

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const session = await verifySession(jar.get(ADMIN_COOKIE)?.value)
  return (
    <div className="admin-root">
      <aside className="admin-side">
        <Link href="/admin" className="admin-logo"><b>Vbild</b><span>Team</span></Link>
        <AdminNav email={session?.email ?? ''} />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
