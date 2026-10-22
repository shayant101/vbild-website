import postgres from 'postgres'
import { createHash, randomBytes } from 'crypto'

const URL = process.env.SCAN_DATABASE_URL
let sql: ReturnType<typeof postgres> | null = null
export function db() { if (!URL) throw new Error('SCAN_DATABASE_URL not set'); if (!sql) sql = postgres(URL, { max: 3, idle_timeout: 20, prepare: false, ssl: 'require' }); return sql }
export const teamDbConfigured = () => Boolean(URL)

export const newId = (p: string) => `${p}_${randomBytes(9).toString('base64url')}`
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export type Member = { id: string; email: string; name: string; role: 'admin' | 'member'; createdAt: string; lastLoginAt?: string; passkeys?: number }
export type Passkey = { id: string; memberId: string; publicKey: string; counter: number; transports?: string[]; deviceName?: string; backedUp?: boolean; createdAt: string; lastUsedAt?: string }

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const r = await db()`select * from scan.team_members where email = ${email.toLowerCase()}`
  return r.length ? row(r[0]) : null
}
export async function getMember(id: string): Promise<Member | null> {
  const r = await db()`select * from scan.team_members where id = ${id}`
  return r.length ? row(r[0]) : null
}
const row = (r: Record<string, unknown>): Member => ({ id: r.id as string, email: r.email as string, name: r.name as string, role: r.role as 'admin' | 'member', createdAt: new Date(r.created_at as string).toISOString(), lastLoginAt: r.last_login_at ? new Date(r.last_login_at as string).toISOString() : undefined, passkeys: r.passkeys !== undefined ? Number(r.passkeys) : undefined })

export async function upsertMember(email: string, name: string, role: 'admin' | 'member'): Promise<Member> {
  const e = email.toLowerCase()
  const existing = await getMemberByEmail(e)
  if (existing) return existing
  const id = newId('m')
  await db()`insert into scan.team_members (id, email, name, role) values (${id}, ${e}, ${name}, ${role})`
  return (await getMember(id))!
}
export async function listMembers(): Promise<Member[]> {
  const r = await db()`select m.*, (select count(*)::int from scan.passkeys p where p.member_id = m.id) as passkeys from scan.team_members m order by m.created_at`
  return r.map(row)
}
export async function removeMember(id: string) { await db()`delete from scan.team_members where id = ${id}` }
export async function touchLogin(id: string) { await db()`update scan.team_members set last_login_at = now() where id = ${id}` }

// invites
export async function createInvite(email: string, name: string, role: 'admin' | 'member', createdBy: string | null, days = 7) {
  const token = randomBytes(24).toString('base64url')
  await db()`insert into scan.invites (token_hash, email, name, role, created_by, expires_at) values (${sha256(token)}, ${email.toLowerCase()}, ${name}, ${role}, ${createdBy}, now() + (${days} || ' days')::interval)`
  return token
}
export async function getInvite(token: string) {
  const r = await db()`select * from scan.invites where token_hash = ${sha256(token)}`
  if (!r.length) return null
  const i = r[0]
  return { email: i.email as string, name: i.name as string, role: i.role as 'admin' | 'member', expired: new Date(i.expires_at as string) < new Date(), used: Boolean(i.used_at) }
}
export async function consumeInvite(token: string) { await db()`update scan.invites set used_at = now() where token_hash = ${sha256(token)}` }
export async function listInvites() {
  const r = await db()`select email, name, role, created_at, expires_at, used_at from scan.invites order by created_at desc limit 50`
  return r.map((i) => ({ email: i.email as string, name: i.name as string, role: i.role as string, createdAt: new Date(i.created_at as string).toISOString(), expiresAt: new Date(i.expires_at as string).toISOString(), used: Boolean(i.used_at) }))
}

// challenges (short-lived)
export async function putChallenge(challenge: string, kind: 'reg' | 'auth', memberId?: string) {
  const id = newId('ch')
  await db()`delete from scan.auth_challenges where expires_at < now()`
  await db()`insert into scan.auth_challenges (id, challenge, kind, member_id, expires_at) values (${id}, ${challenge}, ${kind}, ${memberId ?? null}, now() + interval '5 minutes')`
  return id
}
export async function takeChallenge(id: string, kind: 'reg' | 'auth') {
  const r = await db()`delete from scan.auth_challenges where id = ${id} and kind = ${kind} and expires_at > now() returning challenge, member_id`
  return r.length ? { challenge: r[0].challenge as string, memberId: r[0].member_id as string | null } : null
}

// passkeys
export async function addPasskey(p: Omit<Passkey, 'createdAt'>) {
  await db()`insert into scan.passkeys (id, member_id, public_key, counter, transports, device_name, backed_up) values (${p.id}, ${p.memberId}, ${p.publicKey}, ${p.counter}, ${p.transports ?? null}, ${p.deviceName ?? null}, ${p.backedUp ?? false})`
}
export async function getPasskey(id: string): Promise<Passkey | null> {
  const r = await db()`select * from scan.passkeys where id = ${id}`
  if (!r.length) return null
  const k = r[0]
  return { id: k.id, memberId: k.member_id, publicKey: k.public_key, counter: Number(k.counter), transports: k.transports ?? undefined, deviceName: k.device_name ?? undefined, backedUp: k.backed_up ?? undefined, createdAt: new Date(k.created_at).toISOString(), lastUsedAt: k.last_used_at ? new Date(k.last_used_at).toISOString() : undefined }
}
export async function listPasskeys(memberId: string): Promise<Passkey[]> {
  const r = await db()`select * from scan.passkeys where member_id = ${memberId} order by created_at`
  return r.map((k) => ({ id: k.id, memberId: k.member_id, publicKey: k.public_key, counter: Number(k.counter), transports: k.transports ?? undefined, deviceName: k.device_name ?? undefined, backedUp: k.backed_up ?? undefined, createdAt: new Date(k.created_at).toISOString(), lastUsedAt: k.last_used_at ? new Date(k.last_used_at).toISOString() : undefined }))
}
export async function bumpPasskey(id: string, counter: number) { await db()`update scan.passkeys set counter = ${counter}, last_used_at = now() where id = ${id}` }
export async function removePasskey(id: string, memberId: string) { await db()`delete from scan.passkeys where id = ${id} and member_id = ${memberId}` }
