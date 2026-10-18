import type { Business, Fact, Site } from './types'
import type { CategoryId } from '@/lib/data/categories'

const F = (id: string, severity: Fact['severity'], area: Fact['area'], text: string, evidence?: string): Fact => ({ id, severity, area, text, evidence })

/** Map Google place types → Vbild category + sub-vertical. */
export function classify(b: Business | undefined, site?: Site): { categoryId: CategoryId; subVertical: string; scenario: string } {
  const t = [(b?.primaryType || ''), ...(b?.types || []), (site?.title || ''), (site?.description || '')].join(' ').toLowerCase()
  const has = (re: RegExp) => re.test(t)
  if (has(/plumb|hvac|electric|roof|contractor|handyman|remodel|paint|garage|appliance_repair|pest/)) return { categoryId: 'pros', subVertical: 'trades', scenario: 'plumber' }
  if (has(/landscap|lawn|tree|snow|pool_service|pressure/)) return { categoryId: 'pros', subVertical: 'landscaper', scenario: 'landscaper' }
  if (has(/real_estate|realtor|realty|broker|property/)) return { categoryId: 'pros', subVertical: 'realtor', scenario: 'realtor' }
  if (has(/salon|barber|beauty|spa|nail|hair|lash|brow|tattoo|massage/)) return { categoryId: 'pros', subVertical: 'salon', scenario: 'salon' }
  if (has(/clean|janitor|maid/)) return { categoryId: 'pros', subVertical: 'cleaner', scenario: 'landscaper' }
  if (has(/escape|arcade|amusement|virtual|vr|laser|bowling|trampoline|axe|karting|climb|entertainment_center/)) return { categoryId: 'venues', subVertical: 'vr', scenario: 'vr' }
  if (has(/ranch|farm|wedding|event_venue|banquet|venue|hall|park|camp/)) return { categoryId: 'venues', subVertical: 'ranch', scenario: 'ranch' }
  if (has(/smoke|vape|tobacco|hookah|dispensary|cbd/)) return { categoryId: 'places', subVertical: 'smokeshop', scenario: 'smokeshop' }
  if (has(/restaurant|cafe|coffee|bakery|bar|pizza|food|diner|grill|kitchen|taco|sushi|bbq|deli|meal/)) return { categoryId: 'places', subVertical: 'restaurant', scenario: 'restaurant' }
  if (has(/store|shop|retail|boutique|liquor|grocery|market/)) return { categoryId: 'places', subVertical: 'retail', scenario: 'smokeshop' }
  return { categoryId: 'places', subVertical: 'restaurant', scenario: 'restaurant' }
}

const PAIN_WORDS: [string, RegExp][] = [
  ['wait times', /\bwait(ed|ing)?\b|long line|took forever/i], ['phone unanswered', /no (one )?answer|never (picked|answered)|voicemail|couldn'?t reach/i],
  ['booking friction', /book(ing)?|reservation|appointment|schedul/i], ['no-shows / cancellations', /cancel|no.?show|rescheduled/i],
  ['pricing confusion', /overcharg|hidden fee|price|expensive/i], ['slow service', /slow|understaffed|short.?staffed/i], ['online ordering', /order(ed)? online|app|website/i],
]

export function detect(b: Business | undefined, site: Site | undefined, categoryId: CategoryId): Fact[] {
  const f: Fact[] = []
  // ── Presence ──
  if (!b) f.push(F('no-gbp', 'high', 'presence', 'We could not match a Google Business Profile.', 'Most local searches start on Google Maps; a profile is the first thing we would fix.'))
  if (b && !b.website && !site?.ok) f.push(F('no-site', 'high', 'presence', 'No website linked from the Google profile.', 'Customers who search you by name land on Maps with nowhere to go next.'))
  if (site && !site.ok) f.push(F('site-down', 'high', 'presence', `Your website did not load when we checked (${site.url}).`))
  if (site?.ok && !site.https) f.push(F('no-https', 'medium', 'presence', 'Website is not served over HTTPS.', 'Browsers flag it "Not secure"; payments and forms are riskier.'))
  if (b && (b.photos ?? 0) < 5) f.push(F('few-photos', 'low', 'presence', `Only ${b.photos ?? 0} photos on the Google profile.`, 'Profiles with 10+ photos get noticeably more direction requests.'))
  if (b && (!b.hours || b.hours.length === 0)) f.push(F('no-hours', 'medium', 'presence', 'Hours are missing from the Google profile.'))
  if (site?.ok && !site.hasSchema) f.push(F('no-schema', 'low', 'presence', 'No structured data (schema.org) on the site.', 'Google and AI assistants read it to show hours, menu, and booking links.'))
  if (site?.ok && site.socials.length === 0) f.push(F('no-social-links', 'low', 'presence', 'No Instagram / Facebook links found on the site.'))

  // ── Bookings / ordering ──
  const wantsBooking = categoryId === 'pros' || categoryId === 'venues'
  const wantsOrdering = categoryId === 'places'
  if (wantsBooking && b && !site?.hasBooking) f.push(F('no-booking', 'high', 'bookings', 'No online booking found — customers have to call or text.', 'Every booking that happens outside business hours is currently lost or delayed.'))
  if (wantsOrdering && site?.ok && !site.hasOrdering && site.thirdPartyOrdering.length === 0) f.push(F('no-ordering', 'high', 'bookings', 'No online ordering on your own site.', 'Phone-only ordering caps volume at whoever is free to answer.'))
  if (wantsOrdering && site && site.thirdPartyOrdering.length > 0 && !site.hasOrdering) f.push(F('third-party-only', 'high', 'bookings', `Ordering only through ${site.thirdPartyOrdering.join(' / ')} — no first-party ordering.`, 'Marketplaces take 15–30% and keep the customer relationship.'))
  if (categoryId === 'places' && b?.attributes.reservable === false) f.push(F('no-reservations', 'medium', 'bookings', 'Google shows no reservations accepted.'))
  if (site?.ok && !site.hasContactForm && !site.hasChat) f.push(F('no-capture', 'medium', 'bookings', 'No contact form or chat on the site — the only path is a phone call.'))
  if (site?.ok && site.tech.some((t) => ['Calendly', 'Acuity'].includes(t))) f.push(F('generic-booking', 'medium', 'bookings', `Booking runs on ${site.tech.find((t) => ['Calendly', 'Acuity'].includes(t))} — generic, no deposits, no reminders in your brand.`))
  if (site?.ok && site.hasBooking) f.push(F('has-booking', 'good', 'bookings', `Online booking is present (${site.tech.filter((t) => !['Meta Pixel', 'Google Analytics'].includes(t)).slice(0, 3).join(', ') || 'custom'}).`))
  if (site?.ok && site.hasOrdering) f.push(F('has-ordering', 'good', 'bookings', 'First-party online ordering is live.'))

  // ── Reviews ──
  if (b?.rating !== undefined) {
    if (b.rating < 4.0) f.push(F('low-rating', 'high', 'reviews', `Google rating is ${b.rating.toFixed(1)} on ${b.reviewCount ?? 0} reviews.`, 'Below 4.0, roughly half of searchers skip a local business.'))
    else if (b.rating < 4.5) f.push(F('mid-rating', 'medium', 'reviews', `Google rating is ${b.rating.toFixed(1)} on ${b.reviewCount ?? 0} reviews.`, 'A systematic review request after every visit typically lifts this within a quarter.'))
    else f.push(F('strong-rating', 'good', 'reviews', `Strong ${b.rating.toFixed(1)} rating on ${b.reviewCount ?? 0} reviews.`))
    if ((b.reviewCount ?? 0) < 50) f.push(F('few-reviews', 'medium', 'reviews', `Only ${b.reviewCount ?? 0} reviews — volume is what moves ranking in the map pack.`, 'No automatic review request is in place.'))
  }
  if (b?.reviews?.length) {
    const txt = b.reviews.map((r) => r.text).join(' ')
    const themes = PAIN_WORDS.filter(([, re]) => re.test(txt)).map(([n]) => n)
    const neg = b.reviews.filter((r) => r.rating <= 3)
    if (neg.length) f.push(F('recent-negatives', 'medium', 'reviews', `${neg.length} of the ${b.reviews.length} most recent reviews are 3 stars or below.`, neg[0].text.slice(0, 160)))
    if (themes.length) f.push(F('review-themes', 'medium', 'reviews', `Recent reviews mention: ${themes.slice(0, 3).join(', ')}.`, 'These are the exact workflows an app removes.'))
  }

  // ── Automation ──
  if (site?.ok && !site.hasPixel && !site.hasAnalytics) f.push(F('no-tracking', 'low', 'automation', 'No analytics or pixel — no way to know what the website is doing for you.'))
  if (site?.ok && !site.tech.includes('Mailchimp') && !site.tech.includes('HubSpot')) f.push(F('no-crm', 'medium', 'automation', 'No email/SMS follow-up tool detected.', 'Repeat visits and rebookings are left to memory.'))
  if (b && !b.reviews.some((r) => r.ownerReplied)) f.push(F('no-review-replies', 'low', 'automation', 'No owner replies visible on recent reviews.', 'An agent can draft replies for approval in your voice.'))
  if (!site?.hasChat) f.push(F('no-receptionist', 'medium', 'automation', 'Missed calls and after-hours messages have no automatic reply.', 'An AI receptionist texts back, qualifies, and books.'))

  // ── Speed ──
  if (site?.mobileScore !== undefined) {
    if (site.mobileScore < 50) f.push(F('slow-mobile', 'high', 'speed', `Mobile speed score ${site.mobileScore}/100${site.lcpSeconds ? ` · largest content loads in ${site.lcpSeconds}s` : ''}.`, 'Most local traffic is mobile; slow pages lose the tap.'))
    else if (site.mobileScore < 80) f.push(F('ok-mobile', 'medium', 'speed', `Mobile speed score ${site.mobileScore}/100.`))
    else f.push(F('fast-mobile', 'good', 'speed', `Mobile speed score ${site.mobileScore}/100 — fast.`))
  }
  if (site?.ok && site.tech.some((t) => ['Wix', 'GoDaddy', 'WordPress'].includes(t))) f.push(F('builder-site', 'low', 'speed', `Site runs on ${site.tech.find((t) => ['Wix', 'GoDaddy', 'WordPress'].includes(t))}.`, 'Fine for brochure pages; limits what can be built on top.'))
  return f
}

export function scoreFromFacts(facts: Fact[]) {
  const areas: Fact['area'][] = ['presence', 'bookings', 'reviews', 'automation', 'speed']
  const s: Record<string, number> = {}
  for (const a of areas) {
    let v = 78
    for (const x of facts.filter((f) => f.area === a)) v += x.severity === 'high' ? -28 : x.severity === 'medium' ? -14 : x.severity === 'low' ? -6 : +10
    s[a] = Math.max(8, Math.min(98, v))
  }
  const overall = Math.round((s.presence + s.bookings * 1.4 + s.reviews + s.automation * 1.2 + s.speed * 0.6) / 5.2)
  return { presence: s.presence, bookings: s.bookings, reviews: s.reviews, automation: s.automation, speed: s.speed, overall }
}
