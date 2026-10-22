import type { Metadata } from 'next'
import Link from 'next/link'
import '../../admin.css'
import Enrol from './Enrol'
import { Mark } from '@/components/Logo'

export const metadata: Metadata = { title: 'Join the Vbild team', robots: { index: false, follow: false } }

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <div className="admin-root">
      <div className="login-wrap" style={{ width: '100%' }}>
        <div className="login-card">
          <Link href="/" className="admin-logo"><Mark size={22} /><b>Vbild</b><span>Team</span></Link>
          <Enrol token={token} />
        </div>
      </div>
    </div>
  )
}
