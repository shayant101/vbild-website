import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { runScan } from '@/lib/scan/run'
import { publicView } from '@/lib/scan/public'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const bucket = new Map<string, { n: number; t: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const ipHash = createHash('sha256').update(ip + (process.env.ADMIN_SESSION_SECRET || '')).digest('hex').slice(0, 16)
  const now = Date.now(); const b = bucket.get(ipHash)
  if (b && now - b.t < 3600_000 && b.n >= 8) return NextResponse.json({ error: 'Too many scans from this network. Try again in an hour.' }, { status: 429 })
  bucket.set(ipHash, { n: (b && now - b.t < 3600_000 ? b.n : 0) + 1, t: b && now - b.t < 3600_000 ? b.t : now })

  const { input } = await req.json().catch(() => ({}))
  if (typeof input !== 'string' || input.trim().length < 3 || input.length > 400) return NextResponse.json({ error: 'Paste a Google Maps link, a website, or a business name.' }, { status: 400 })
  const scan = await runScan(input, ipHash)
  if (scan.status === 'error') return NextResponse.json({ id: scan.id, error: scan.error }, { status: 422 })
  return NextResponse.json({ id: scan.id, scan: publicView(scan) })
}
