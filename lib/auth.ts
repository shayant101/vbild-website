import { SignJWT, jwtVerify } from 'jose'

export const ADMIN_COOKIE = 'vbild_admin'
const ONE_WEEK = 60 * 60 * 24 * 7

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s || s.length < 16) return null
  return new TextEncoder().encode(s)
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && secret())
}

/** Constant-time-ish compare to avoid trivial timing leaks. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export function checkCredentials(email: string, password: string) {
  const e = process.env.ADMIN_EMAIL ?? ''
  const p = process.env.ADMIN_PASSWORD ?? ''
  if (!e || !p) return false
  return safeEqual(email.trim().toLowerCase(), e.trim().toLowerCase()) && safeEqual(password, p)
}

export async function signSession(email: string) {
  const s = secret()
  if (!s) throw new Error('ADMIN_SESSION_SECRET not set')
  return new SignJWT({ sub: email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ONE_WEEK}s`)
    .sign(s)
}

export async function verifySession(token?: string) {
  const s = secret()
  if (!s || !token) return null
  try {
    const { payload } = await jwtVerify(token, s)
    return payload.role === 'admin' ? { email: String(payload.sub) } : null
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: ONE_WEEK,
}
