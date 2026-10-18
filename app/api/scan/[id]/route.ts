import { NextRequest, NextResponse } from 'next/server'
import { getScan } from '@/lib/scan/db'
import { publicView } from '@/lib/scan/public'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getScan(id)
  if (!s) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(publicView(s))
}
