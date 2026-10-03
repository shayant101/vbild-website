import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.ANTHROPIC_API_KEY

const SYSTEM = `You write product specs for small-business apps built by Vbild. Given a one-paragraph business description, return ONLY JSON:
{
 "appName": "short product name (1-2 words)",
 "tagline": "one sentence, names the business if given",
 "users": "who uses it, comma separated",
 "features": ["6 concrete features"],
 "screens": ["3 screen names"],
 "stack": ["3-5 technologies, Next.js first"],
 "scenario": one of "restaurant" | "smokeshop" | "vr" | "ranch",
 "tier": "Starter" | "Growth" | "Pro",
 "setup": 3500 | 8000 | 25000,
 "monthly": 149 | 299 | 499
}
scenario picks the closest prototype: restaurant = reservations/ordering/hospitality; smokeshop = retail/inventory/loyalty/age-gated; vr = bookings/slots/venues/entertainment; ranch = events/check-in/payments/offline. Keep features short (2-5 words).`

/** GET → tells the client whether live generation is available. */
export async function GET() {
  return NextResponse.json({ live: Boolean(KEY) })
}

export async function POST(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: 'live mode unavailable' }, { status: 503 })
  const { description } = await req.json().catch(() => ({}))
  if (typeof description !== 'string' || description.length < 8 || description.length > 1200) {
    return NextResponse.json({ error: 'description required' }, { status: 400 })
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 600, system: SYSTEM,
      messages: [{ role: 'user', content: `Business: ${description}\n\nReturn the JSON.` }],
    }),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 })
  const data = await r.json()
  const raw: string = data.content?.[0]?.text ?? ''
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return NextResponse.json({ error: 'bad model output' }, { status: 502 })
  try {
    const spec = JSON.parse(m[0])
    const ok = ['restaurant', 'smokeshop', 'vr', 'ranch'].includes(spec.scenario)
    if (!ok) spec.scenario = 'restaurant'
    return NextResponse.json({ spec })
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 502 })
  }
}
