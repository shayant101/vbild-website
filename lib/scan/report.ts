import type { Business, Fact, Report, Site } from './types'
import { CATEGORY_BY_ID, type CategoryId } from '@/lib/data/categories'
import { PROJECTS } from '@/lib/data/portfolio'
import { scoreFromFacts } from './detectors'

const KEY = process.env.ANTHROPIC_API_KEY

const IMPACT: Record<string, string> = {
  'no-booking': '20–40% of bookings happen after hours (Jobber: >50% of home-service payments are now online, 2025)',
  'no-ordering': 'First-party ordering keeps the 15–30% marketplaces take (Owner.com, Toast pricing, 2026)',
  'third-party-only': 'Moving 30% of marketplace orders first-party is pure margin',
  'few-reviews': 'Automated review requests typically 3–5× monthly review volume',
  'mid-rating': 'Every +0.1 in rating lifts map-pack clicks; most lift comes from asking',
  'low-rating': 'Rating recovery starts with asking happy customers systematically',
  'no-receptionist': 'Missed-call text-back recovers 20–30% of otherwise lost inquiries (industry benchmark)',
  'no-crm': 'Rebooking prompts raise repeat rate; Owner.com and Toast both build on this',
  'slow-mobile': 'Pages under 3s convert roughly 2× pages over 5s (Google)',
  'no-site': 'A site + Maps profile is the baseline every other fix builds on',
  'no-capture': 'A form + text-back turns after-hours visits into leads',
}

const TIER_FOR: Record<string, Report['opportunities'][number]['tier']> = {
  'no-booking': 'Starter', 'no-ordering': 'Growth', 'third-party-only': 'Growth', 'few-reviews': 'Solo', 'mid-rating': 'Solo', 'low-rating': 'Solo',
  'no-receptionist': 'Solo', 'no-crm': 'Starter', 'slow-mobile': 'Starter', 'no-site': 'Starter', 'no-capture': 'Solo', 'generic-booking': 'Starter', 'no-reservations': 'Starter', 'recent-negatives': 'Starter', 'review-themes': 'Growth',
}

function buildFor(id: string, categoryId: CategoryId, name: string): { title: string; what: string; job: string } {
  const c = CATEGORY_BY_ID[categoryId]
  const map: Record<string, [string, string, number]> = {
    'no-booking': ['Online booking with deposits', `A branded booking page for ${name}: pick a service and time, pay a deposit, get reminders. No phone tag.`, 1],
    'generic-booking': ['Booking in your brand, with deposits', `Replace the generic scheduler with ${name}'s own flow: deposits, no-show fees, reminders, and rebooking.`, 1],
    'no-ordering': ['First-party online ordering', `Ordering on ${name}'s own site and a counter tablet, synced to your POS, with loyalty built in.`, 0],
    'third-party-only': ['Your own ordering, next to the marketplaces', `Keep DoorDash for discovery; route repeat customers to ${name}'s own ordering with points.`, 0],
    'no-reservations': ['Reservations with party-size deposits', `Floor timeline, deposits on large parties, kitchen heads-up — the TableSync pattern.`, 1],
    'few-reviews': ['Automatic review requests', `A text 2 hours after every visit or job, routed to Google. Runs by itself.`, 4],
    'mid-rating': ['Review engine', `Ask every happy customer, catch unhappy ones privately first.`, 4],
    'low-rating': ['Review recovery', `Private feedback first, public ask second; owner-voice replies drafted for approval.`, 4],
    'recent-negatives': ['Service recovery agent', `Flags a 1–3 star review within minutes and drafts a reply and a make-good offer.`, 4],
    'review-themes': ['Fix what the reviews say', `The app removes the exact friction customers write about — booking, waits, unanswered calls.`, 1],
    'no-receptionist': ['AI receptionist', `Missed call → instant text → qualify → book. Works nights and weekends.`, 5],
    'no-crm': ['Follow-up & rebooking', `Card on file, "rebook before you leave", seasonal upsells, win-back texts.`, 5],
    'slow-mobile': ['Fast mobile site', `Rebuilt on Next.js: under 2 seconds on a phone, with booking or ordering built in.`, 0],
    'no-site': ['A site that is also your app', `One build: profile, hours, menu or services, booking or ordering, reviews.`, 0],
    'no-capture': ['Lead capture + text-back', `Form and chat that text you and the customer instantly.`, 2],
  }
  const [title, what, jobIdx] = map[id] || ['Custom workflow', `A workflow shaped to how ${name} runs.`, 0]
  return { title, what, job: c.jobs[jobIdx] }
}

function similar(categoryId: CategoryId, sub: string) {
  const bySub: Record<string, string[]> = { restaurant: ['burger-barn', 'urban-punjab', 'arigato-bato'], smokeshop: ['shopboard'], retail: ['shopboard'], trades: ['shopboard', 'sn-ranch'], landscaper: ['sn-ranch'], realtor: ['bildr'], salon: ['odyssey-vr'], cleaner: ['sn-ranch'], vr: ['odyssey-vr'], ranch: ['sn-ranch'] }
  const ids = bySub[sub] || PROJECTS.filter((p) => p.public).slice(0, 2).map((p) => p.id)
  return ids.filter((id) => PROJECTS.some((p) => p.id === id)).slice(0, 3)
}

/** Deterministic report: works with no API key. Claude (below) rewrites the prose when available. */
export function scriptedReport(b: Business | undefined, site: Site | undefined, facts: Fact[], categoryId: CategoryId, subVertical: string, scenario: string): Report {
  const name = b?.name || site?.title?.split(/\s[|–—:-]\s|\s\|\s/)[0]?.trim().slice(0, 60) || 'Your business'
  const c = CATEGORY_BY_ID[categoryId]
  const scores = scoreFromFacts(facts)
  const ranked = facts.filter((f) => f.severity !== 'good').sort((a, b2) => ({ high: 0, medium: 1, low: 2, good: 3 }[a.severity] - { high: 0, medium: 1, low: 2, good: 3 }[b2.severity]))
  const DEFAULTS: Record<string, string[]> = { places: ['no-ordering', 'few-reviews', 'no-receptionist'], pros: ['no-booking', 'no-receptionist', 'few-reviews'], venues: ['no-booking', 'no-capture', 'few-reviews'] }
  const MAPPED = ['no-booking', 'generic-booking', 'no-ordering', 'third-party-only', 'no-reservations', 'few-reviews', 'mid-rating', 'low-rating', 'recent-negatives', 'review-themes', 'no-receptionist', 'no-crm', 'slow-mobile', 'no-site', 'no-capture']
  const seen = new Set<string>()
  const pool = [...ranked.filter((f) => MAPPED.includes(f.id)), ...DEFAULTS[categoryId].filter((id) => !ranked.some((f) => f.id === id)).map((id) => ({ id, severity: 'medium', area: 'automation', text: 'Not in place yet — standard for this category.' } as Fact))]
  const opportunities = pool.filter((f) => { const k = buildFor(f.id, categoryId, name).title; if (seen.has(k)) return false; seen.add(k); return true }).slice(0, 3).map((f) => {
    const bf = buildFor(f.id, categoryId, name)
    return { title: bf.title, what: bf.what, why: f.text, tier: TIER_FOR[f.id] || 'Starter', impact: IMPACT[f.id] || 'Removes a manual step every day', job: bf.job }
  })
  const insights: string[] = []
  const themes = facts.find((f) => f.id === 'review-themes'); if (themes) insights.push(themes.text)
  if (b?.rating && b.reviewCount) insights.push(`${name} sits at ${b.rating.toFixed(1)}★ across ${b.reviewCount} reviews — ${b.reviewCount < 100 ? 'review volume, not quality, is the lever' : 'volume is strong; protect it with faster replies'}.`)
  if (site?.tech.length) insights.push(`Stack we detected: ${site.tech.filter((t) => !['Meta Pixel', 'Google Analytics'].includes(t)).slice(0, 5).join(', ') || 'custom'}. We integrate rather than replace.`)
  if (b?.attributes.delivery && !site?.hasOrdering) insights.push('Google says you deliver; your site has no way to order. That gap goes straight to marketplaces.')
  const good = facts.filter((f) => f.severity === 'good'); if (good.length) insights.push(`Already working: ${good.map((g) => g.text.replace(/\.$/, '')).join('; ')}.`)
  const proto = { restaurant: ['TableSync', 'Reservations, deposits and a kitchen heads-up'], smokeshop: ['ShopBoard', 'Age-gated ordering, loyalty and live inventory'], vr: ['StationBook', 'Slot booking, deposits, waivers and QR entry'], ranch: ['RanchGate', 'Offline-ready check-in and bulk payments'], plumber: ['JobLine', 'Quote → deposit → job → invoice → review'], landscaper: ['CrewRoute', 'Recurring routes, crew check-ins and card-on-file billing'], realtor: ['OpenDoor Desk', 'Branded sign-in, showing booking and 30-day follow-up'], salon: ['ChairBook', 'One booking page, no-show protection and rebooking'] }[scenario] || ['YourApp', 'Shaped to how you run']
  return {
    businessName: name, categoryId, subVertical,
    headline: scores.overall < 45 ? `${name} is running on phone calls and memory. There's a lot to automate.` : scores.overall < 70 ? `${name} has the basics. The next 20 points come from booking, reviews and follow-up.` : `${name} is in good shape. The opportunity is compounding: agents and a branded app.`,
    summary: `We checked ${name}'s Google profile${site?.ok ? ' and website' : ''} against the six things a ${c.name.toLowerCase().replace(/s$/, '')} app should do. ${opportunities.length} opportunities stand out; the first one alone is usually worth the build.`,
    scores, opportunities, insights: insights.slice(0, 4), similarBuilds: similar(categoryId, subVertical),
    prototype: { appName: `${proto[0]}`, tagline: `${proto[1]} for ${name}.`, scenario, features: c.jobs, screens: [] },
    generatedBy: 'scripted',
  }
}

const SYSTEM = `You are Vbild's senior product strategist writing a short, specific diagnostic for a small-business owner. You are given verified FACTS about their business (from Google and their website) and a draft report. Rewrite ONLY the prose fields so they read like a sharp operator wrote them about THIS business: headline (≤14 words), summary (≤60 words), each opportunity's "what" (≤35 words, concrete, names the business) and "why" (≤25 words, cites the fact), and up to 4 insights (≤30 words each, drawn from the facts and reviews — quote a review fragment where useful). Never invent facts, numbers, or features not supported by the FACTS. Keep tiers, impact strings, scores, job names, prototype and similarBuilds unchanged. Return ONLY the JSON object with the same shape.`

export async function claudeReport(draft: Report, facts: Fact[], b?: Business, site?: Site): Promise<Report> {
  if (!KEY) return draft
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1400, system: SYSTEM, messages: [{ role: 'user', content: `FACTS:\n${facts.map((f) => `- [${f.severity}/${f.area}] ${f.text}${f.evidence ? ` (${f.evidence})` : ''}`).join('\n')}\n\nBUSINESS: ${JSON.stringify({ name: b?.name, types: b?.types?.slice(0, 6), rating: b?.rating, reviews: b?.reviewCount, address: b?.address, recentReviews: b?.reviews?.slice(0, 5).map((x) => `${x.rating}★ ${x.text.slice(0, 200)}`) })}\nSITE: ${JSON.stringify({ title: site?.title, tech: site?.tech, mobileScore: site?.mobileScore })}\n\nDRAFT REPORT:\n${JSON.stringify(draft)}\n\nReturn the rewritten JSON.` }] }),
    })
    if (!r.ok) return draft
    const data = await r.json()
    const raw: string = data.content?.[0]?.text ?? ''
    const m = raw.match(/\{[\s\S]*\}/); if (!m) return draft
    const j = JSON.parse(m[0]) as Partial<Report>
    return { ...draft, headline: j.headline || draft.headline, summary: j.summary || draft.summary, insights: Array.isArray(j.insights) && j.insights.length ? j.insights.slice(0, 4) : draft.insights,
      opportunities: draft.opportunities.map((o, i) => ({ ...o, what: j.opportunities?.[i]?.what || o.what, why: j.opportunities?.[i]?.why || o.why })), generatedBy: 'claude' }
  } catch { return draft }
}
