import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, adminConfigured, checkCredentials, sessionCookieOptions, signSession } from '@/lib/auth'

// Very small in-memory throttle (per server instance) — 10 attempts / 15 min / IP.
const attempts = new Map<string, { n: number; t: number }>()
const WINDOW = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET.' },
      { status: 503 },
    )
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const rec = attempts.get(ip)
  if (rec && now - rec.t < WINDOW && rec.n >= 10) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const { email, password } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
  }

  if (!checkCredentials(email, password)) {
    attempts.set(ip, { n: (rec && now - rec.t < WINDOW ? rec.n : 0) + 1, t: rec && now - rec.t < WINDOW ? rec.t : now })
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  attempts.delete(ip)
  const token = await signSession(email)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions)
  return res
}
