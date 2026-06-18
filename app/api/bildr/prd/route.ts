import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const PRD_SYSTEM = `You are a senior product architect. Given a conversation transcript, produce a structured PRD as JSON.

Return ONLY valid JSON, no markdown, no explanation. Schema:
{
  "appName": "short memorable name",
  "tagline": "one sentence value prop",
  "archetype": one of ["marketplace","saas","social","ecommerce","booking","ondemand","content","internal"],
  "targetUser": "who uses this app",
  "coreProblem": "the main problem solved",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "screens": ["Screen Name 1", "Screen Name 2", "Screen Name 3"],
  "techStack": ["Next.js", "Supabase", "Stripe"]
}

Choose archetype carefully:
- marketplace: two-sided platform, buyers + sellers
- saas: B2B tool, dashboards, analytics, CRM
- social: user profiles, feeds, messaging, community
- ecommerce: product catalog, cart, checkout, inventory
- booking: appointments, scheduling, reservations, calendar
- ondemand: real-time delivery, uber-like, location tracking
- content: media, articles, streaming, creator platform
- internal: team workflows, admin panels, internal tools`

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 }
    )
  }

  const { messages } = await req.json()

  const transcript = messages
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Bildr'}: ${m.content}`)
    .join('\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: PRD_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Here is the interview transcript:\n\n${transcript}\n\nGenerate the PRD JSON now.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: response.status })
  }

  const data = await response.json()
  const raw = data.content?.[0]?.text ?? '{}'

  try {
    const prd = JSON.parse(raw)
    return NextResponse.json({ prd })
  } catch {
    // Try to extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const prd = JSON.parse(match[0])
        return NextResponse.json({ prd })
      } catch {
        return NextResponse.json({ error: 'Failed to parse PRD', raw }, { status: 500 })
      }
    }
    return NextResponse.json({ error: 'No JSON in response', raw }, { status: 500 })
  }
}
