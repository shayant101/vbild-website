import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server'
import { bumpPasskey, getMember, getPasskey, putChallenge, takeChallenge, touchLogin, teamDbConfigured } from '@/lib/team/db'
import { rp } from '@/lib/team/webauthn'
import { ADMIN_COOKIE, authConfigured, sessionCookieOptions, signSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** GET: authentication options (discoverable credentials — the browser shows the user's saved passkeys). */
export async function GET(req: NextRequest) {
  if (!teamDbConfigured() || !authConfigured()) return NextResponse.json({ error: 'Team login is not configured.' }, { status: 503 })
  const { rpID } = rp(req)
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred', allowCredentials: [] })
  const challengeId = await putChallenge(options.challenge, 'auth')
  return NextResponse.json({ options, challengeId })
}

export async function POST(req: NextRequest) {
  const { challengeId, response } = await req.json().catch(() => ({}))
  const ch = await takeChallenge(String(challengeId || ''), 'auth')
  if (!ch) return NextResponse.json({ error: 'Sign-in timed out. Try again.' }, { status: 400 })
  const key = await getPasskey(String(response?.id || ''))
  if (!key) return NextResponse.json({ error: 'This passkey is not registered with Vbild. Use your invite link to set up this device.' }, { status: 404 })
  const { rpID, origin } = rp(req)
  let v
  try {
    v = await verifyAuthenticationResponse({ response, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false,
      credential: { id: key.id, publicKey: new Uint8Array(Buffer.from(key.publicKey, 'base64url')), counter: key.counter, transports: key.transports as never } })
  } catch (e) { return NextResponse.json({ error: `Could not verify: ${(e as Error).message}` }, { status: 400 }) }
  if (!v.verified) return NextResponse.json({ error: 'Passkey verification failed.' }, { status: 401 })
  await bumpPasskey(key.id, v.authenticationInfo.newCounter)
  const member = await getMember(key.memberId)
  if (!member) return NextResponse.json({ error: 'Member no longer exists.' }, { status: 403 })
  await touchLogin(member.id)
  const jwt = await signSession({ id: member.id, email: member.email, name: member.name, role: member.role })
  const res = NextResponse.json({ ok: true, name: member.name })
  res.cookies.set(ADMIN_COOKIE, jwt, sessionCookieOptions)
  return res
}
