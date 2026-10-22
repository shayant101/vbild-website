/**
 * Odyssey payouts from the Vbild command center (SERVER-ONLY).
 *
 * This NEVER moves money. It creates a Mercury "request send money" approval for
 * one settlement week; Shayan approves (or rejects) it inside Mercury. Once sent,
 * the Odyssey app's 6-hourly Mercury sync records the transfer as a remittance by
 * reading the memo ("Oct 05 - Oct 11").
 *
 * Env (on the vbild.ai Vercel project):
 *   MERCURY_API_TOKEN              read-only token → balance + request status
 *   MERCURY_PAYOUT_TOKEN           token with RequestSendMoney scope → create requests
 *   MERCURY_ODYSSEY_RECIPIENT_ID   optional; defaults to the "Odyssey VR" recipient
 *   MERCURY_ACCOUNT_ID             optional; defaults to the first active checking account
 *   PAYOUT_MAX_PER_WEEK            optional safety cap (default 5000)
 */
import { odb } from './db'
import { getOdysseyMetrics, type PayoutWeek } from './metrics'
import { memoRange } from './settlement'

const BASE = 'https://api.mercury.com/api/v1'
const DEFAULT_RECIPIENT_ID = 'cbf795f8-97f5-11f1-a760-57e6011efde0' // Mercury recipient "Odyssey VR" (ACH)

function tok(name: string) {
  let t = (process.env[name] ?? '').trim().replace(/^["'`]+|["'`]+$/g, '').replace(/^Bearer\s+/i, '').trim()
  if (t && !t.startsWith('secret-token:')) t = `secret-token:${t}`
  return t.length > 'secret-token:'.length ? t : ''
}
export const mercuryReadConfigured = () => Boolean(tok('MERCURY_API_TOKEN') || tok('MERCURY_PAYOUT_TOKEN'))
export const mercuryPayoutConfigured = () => Boolean(tok('MERCURY_PAYOUT_TOKEN'))
export const maxPerWeek = () => (Number(process.env.PAYOUT_MAX_PER_WEEK) > 0 ? Number(process.env.PAYOUT_MAX_PER_WEEK) : 5000)

async function mercury<T>(token: string, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Mercury ${res.status} on ${path}: ${text.slice(0, 200)}`)
  return (text ? JSON.parse(text) : {}) as T
}

type Account = { id: string; kind: string; status: string; availableBalance: number; currentBalance: number; name: string }

export async function getMercuryAccount(): Promise<Account | null> {
  const t = tok('MERCURY_API_TOKEN') || tok('MERCURY_PAYOUT_TOKEN')
  if (!t) return null
  try {
    const { accounts } = await mercury<{ accounts: Account[] }>(t, 'GET', '/accounts')
    const wanted = process.env.MERCURY_ACCOUNT_ID
    return (wanted ? accounts.find((a) => a.id === wanted) : accounts.find((a) => a.kind === 'checking' && a.status === 'active')) ?? null
  } catch (e) { console.warn('[odyssey/payouts] account read failed:', e instanceof Error ? e.message : e); return null }
}

export type InFlight = { id: string; amount: number; status: string; createdAt: string; memo: string; note: string }

/**
 * Outgoing payments to Odyssey that Mercury has but Odyssey's ledger hasn't recorded yet
 * (status pending = ACH still in flight; Odyssey's sync only records once posted).
 */
export async function listInFlightToOdyssey(sinceDate: string): Promise<InFlight[]> {
  const t = tok('MERCURY_API_TOKEN') || tok('MERCURY_PAYOUT_TOKEN')
  if (!t) return []
  try {
    const account = await getMercuryAccount(); if (!account) return []
    const qs = new URLSearchParams({ start: sinceDate, limit: '200' })
    const { transactions } = await mercury<{ transactions: { id: string; amount: number; status: string; kind: string; createdAt?: string; postedAt?: string | null; counterpartyName?: string | null; counterpartyNickname?: string | null; externalMemo?: string | null; note?: string | null }[] }>(t, 'GET', `/account/${account.id}/transactions?${qs}`)
    return (transactions ?? [])
      .filter((x) => x.amount < 0 && x.kind === 'outgoingPayment' && x.status === 'pending' && /odyssey/i.test(`${x.counterpartyName ?? ''} ${x.counterpartyNickname ?? ''}`))
      .map((x) => ({ id: x.id, amount: Math.abs(x.amount), status: x.status, createdAt: x.createdAt ?? '', memo: x.externalMemo ?? '', note: x.note ?? '' }))
  } catch (e) { console.warn('[odyssey/payouts] in-flight read failed:', e instanceof Error ? e.message : e); return [] }
}

/** Poll Mercury for open requests and persist status changes (approved / rejected / cancelled). */
export async function refreshPayoutRequests(): Promise<void> {
  const d = odb(); const t = tok('MERCURY_API_TOKEN') || tok('MERCURY_PAYOUT_TOKEN')
  if (!d || !t) return
  const open = await d`select id, mercury_request_id from payout_requests where status = 'pendingApproval' and mercury_request_id is not null`
  for (const r of open) {
    try {
      const resp = await mercury<{ status?: string }>(t, 'GET', `/request-send-money/${r.mercury_request_id}`)
      if (resp.status && resp.status !== 'pendingApproval') await d`update payout_requests set status = ${resp.status}, updated_at = now() where id = ${r.id}`
    } catch (e) { console.warn('[odyssey/payouts] status check failed', r.mercury_request_id, e instanceof Error ? e.message : e) }
  }
}

export type RequestOutcome = { ok: true; week: PayoutWeek; mercuryRequestId: string | null } | { ok: false; error: string }

/** Create ONE Mercury approval request for the given settlement week (Monday, YYYY-MM-DD). */
export async function requestPayout(weekStart: string, requestedBy: string): Promise<RequestOutcome> {
  const d = odb(); const t = tok('MERCURY_PAYOUT_TOKEN')
  if (!d) return { ok: false, error: 'ODYSSEY_DATABASE_URL is not set' }
  if (!t) return { ok: false, error: 'MERCURY_PAYOUT_TOKEN is not set on vbild.ai — add it in Vercel to enable payout requests' }
  await refreshPayoutRequests()
  const m = await getOdysseyMetrics()
  const w = m?.payouts.weeks.find((x) => x.start === weekStart)
  if (!w) return { ok: false, error: 'Unknown settlement week' }
  if (w.state === 'paid') return { ok: false, error: 'This week is already fully paid' }
  if (w.state === 'upcoming') return { ok: false, error: `Not due until ${w.dueDate} (10-day refund buffer)` }
  if (w.request) return { ok: false, error: `A request already exists (${w.request.status})` }
  if (w.due > maxPerWeek()) return { ok: false, error: `$${w.due} is over the $${maxPerWeek()} safety cap — send this one manually in Mercury` }

  const idempotencyKey = `odyssey-payout-${w.start}-${Math.round(w.due * 100)}-${Date.now()}`
  // Claim the week first (unique index = one active request per week)
  let rowId: string
  try {
    const ins = await d`insert into payout_requests (period_start, period_end, amount, idempotency_key, status, requested_by)
      values (${w.start}, ${w.end}, ${w.due}, ${idempotencyKey}, 'pendingApproval', ${requestedBy}) returning id`
    rowId = ins[0].id
  } catch { return { ok: false, error: 'A request for this week already exists' } }

  try {
    const account = await getMercuryAccount()
    if (!account) throw new Error('No Mercury checking account visible to this token')
    const memo = memoRange(w.start, w.end)
    const resp = await mercury<{ requestId?: string; id?: string; status?: string }>(t, 'POST', `/account/${account.id}/request-send-money`, {
      recipientId: process.env.MERCURY_ODYSSEY_RECIPIENT_ID || DEFAULT_RECIPIENT_ID,
      amount: w.due, paymentMethod: 'ach', idempotencyKey, externalMemo: memo,
      note: `Odyssey payout · week ${memo} · requested from vbild.ai by ${requestedBy}`,
    })
    const mid = resp.requestId ?? resp.id ?? null
    await d`update payout_requests set mercury_request_id = ${mid}, status = ${resp.status ?? 'pendingApproval'}, updated_at = now() where id = ${rowId}`
    return { ok: true, week: w, mercuryRequestId: mid }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await d`update payout_requests set status = 'failed', error = ${msg.slice(0, 500)}, updated_at = now() where id = ${rowId}`
    return { ok: false, error: msg }
  }
}
