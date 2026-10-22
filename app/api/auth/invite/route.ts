import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getInvite, putChallenge, upsertMember, listPasskeys, teamDbConfigured } from '@/lib/team/db'
import { rp } from '@/lib/team/webauthn'

export const dynamic = 'force-dynamic'

/** Step 1 of enrolment: validate the invite and hand the browser passkey-creation options. */
export async function POST(req: NextRequest) {
  if (!teamDbConfigured()) return NextResponse.json({ error: 'Team login is not configured (SCAN_DATABASE_URL).' }, { status: 503 })
  const { token } = await req.json().catch(() => ({}))
  if (typeof token !== 'string' || token.length < 20) return NextResponse.json({ error: 'Invalid invite.' }, { status: 400 })
  const inv = await getInvite(token)
  if (!inv) return NextResponse.json({ error: 'This invite link is not valid.' }, { status: 404 })
  if (inv.expired) return NextResponse.json({ error: 'This invite has expired. Ask an admin for a new one.' }, { status: 410 })
  if (inv.used) return NextResponse.json({ error: 'This invite was already used. Sign in with your passkey, or ask for a new invite.' }, { status: 410 })
  const member = await upsertMember(inv.email, inv.name, inv.role)
  const existing = await listPasskeys(member.id)
  const { rpID, rpName } = rp(req)
  const options = await generateRegistrationOptions({
    rpName, rpID, userName: member.email, userDisplayName: member.name,
    attestationType: 'none',
    excludeCredentials: existing.map((k) => ({ id: k.id, transports: k.transports as never })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
  })
  const challengeId = await putChallenge(options.challenge, 'reg', member.id)
  return NextResponse.json({ options, challengeId, member: { name: member.name, email: member.email } })
}
