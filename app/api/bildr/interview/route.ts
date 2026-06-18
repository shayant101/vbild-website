import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `You are Bildr, an AI product strategist who helps people turn app ideas into reality. You conduct a friendly, structured interview to understand their vision.

Your goal across 5-6 turns is to understand:
1. The core problem they're solving
2. Who the target users are
3. The key features needed
4. Any specific workflow or business logic
5. What success looks like for them

Rules:
- Keep responses SHORT: 2-3 sentences max
- Be warm, enthusiastic, and encouraging
- Ask ONE focused question per response
- After 5+ user messages, end with: "I have everything I need to design your app. Hit 'Generate My App' whenever you're ready!"
- Never mention competitors by name
- Never promise timelines or pricing

Start by warmly introducing yourself and asking what kind of app they want to build.`

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 }
    )
  }

  const { messages } = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: response.status })
  }

  const data = await response.json()
  const content = data.content?.[0]?.text ?? ''
  return NextResponse.json({ content })
}
