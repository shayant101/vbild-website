import { cookies } from 'next/headers'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'
import { listInvites, listMembers, listPasskeys } from '@/lib/team/db'
import TeamClient from './TeamClient'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const jar = await cookies()
  const s = (await verifySession(jar.get(ADMIN_COOKIE)?.value))!
  const [members, invites, mine] = await Promise.all([listMembers(), listInvites(), listPasskeys(s.id)])
  return (
    <>
      <div className="admin-head"><div><h1>Team &amp; devices</h1><p>Passkeys replace passwords. Invite someone with a one-time link; remove a device to lock it out instantly.</p></div></div>
      <TeamClient me={s} members={members} invites={invites} myPasskeys={mine.map((k) => ({ id: k.id, deviceName: k.deviceName, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt, backedUp: k.backedUp }))} />
    </>
  )
}
