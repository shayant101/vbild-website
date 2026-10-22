import { SignJWT, jwtVerify } from 'jose'

export const ADMIN_COOKIE = 'vbild_admin'
const ONE_WEEK = 60 * 60 * 24 * 30 // 30 days for passkey sessions

export type Session = { id: string; email: string; name: string; role: 'admin' | 'member' }

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s || s.length < 16) return null
  return new TextEncoder().encode(s)
}

export function authConfigured() { return Boolean(secret()) }

export async function signSession(s: Session) {
  const k = secret()
  if (!k) throw new Error('ADMIN_SESSION_SECRET not set')
  return new SignJWT({ sub: s.id, email: s.email, name: s.name, role: s.role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ONE_WEEK}s`).sign(k)
}

export async function verifySession(token?: string): Promise<Session | null> {
  const k = secret()
  if (!k || !token) return null
  try {
    const { payload } = await jwtVerify(token, k)
    if (payload.role !== 'admin' && payload.role !== 'member') return null
    return { id: String(payload.sub), email: String(payload.email), name: String(payload.name || ''), role: payload.role }
  } catch { return null }
}

export const sessionCookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ONE_WEEK }
