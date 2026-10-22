import postgres from 'postgres'

/**
 * Odyssey VR booking database (production). Connects with the restricted
 * `vbild_cc` role: SELECT on the ledger/usage tables, INSERT/UPDATE only on
 * payout_requests. It cannot touch bookings, refunds, Stripe or config.
 * Server-only. Never import from a 'use client' file.
 */
const URL = process.env.ODYSSEY_DATABASE_URL
let sql: ReturnType<typeof postgres> | null = null

export function odysseyConfigured() { return Boolean(URL) }

export function odb() {
  if (!URL) return null
  if (!sql) sql = postgres(URL, { max: 3, idle_timeout: 20, prepare: false, ssl: 'require', connect_timeout: 10 })
  return sql
}
