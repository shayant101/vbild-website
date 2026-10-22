import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { addPasskey, consumeInvite, getMember, takeChallenge, touchLogin, putChallenge, listPasskeys } from '@/lib/team/db'
import { rp } from '@/lib/team/webauthn'
import { ADMIN_COOKIE, sessionCookieOptions, signSession, verifySession } from '@/lib/auth'
import { generateRegistrationOptions } from '@simplewebauthn/server'

export const dynamic = 'force-dynamic'

/** GET: options for adding another passkey to an already-signed-in account. */
export async function GET(req: NextRequest) {
  const s = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const existing = await listPasskeys(s.id)
  const { rpID, rpName } = rp(req)
  const options = await generateRegistrationOptions({ rpName, rpID, userName: s.email, userDisplayName: s.name, attestationType: 'none', excludeCredentials: existing.map((k) => ({ id: k.id, transports: k.transports as never })), authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' } })
  const challengeId = await putChallenge(options.challenge, 'reg', s.id)
  return NextResponse.json({ options, challengeId })
}

/** POST: verify the browser's new passkey, store it, sign the user in. */
export async function POST(req: NextRequest) {
  const { challengeId, response, token, deviceName } = await req.json().catch(() => ({}))
  const ch = await takeChallenge(String(challengeId || ''), 'reg')
  if (!ch || !ch.memberId) return NextResponse.json({ error: 'Challenge expired. Reload and try again.' }, { status: 400 })
  const member = await getMember(ch.memberId)
  if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  const { rpID, origin } = rp(req)
  let v
  try {
    v = await verifyRegistrationResponse({ response, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false })
  } catch (e) { return NextResponse.json({ error: `Passkey could not be verified: ${(e as Error).message}` }, { status: 400 }) }
  if (!v.verified || !v.registrationInfo) return NextResponse.json({ error: 'Passkey could not be verified.' }, { status: 400 })
  const { credential, credentialBackedUp } = v.registrationInfo
  await addPasskey({ id: credential.id, memberId: member.id, publicKey: Buffer.from(credential.publicKey).toString('base64url'), counter: credential.counter, transports: credential.transports as string[] | undefined, deviceName: typeof deviceName === 'string' ? deviceName.slice(0, 60) : undefined, backedUp: credentialBackedUp })
  if (typeof token === 'string') await consumeInvite(token)
  await touchLogin(member.id)
  const jwt = await signSession({ id: member.id, email: member.email, name: member.name, role: member.role })
  const res = NextResponse.json({ ok: true, name: member.name })
  res.cookies.set(ADMIN_COOKIE, jwt, sessionCookieOptions)
  return res
}
