import type { Business, InputKind } from './types'

const KEY = process.env.GOOGLE_PLACES_API_KEY
const FIELDS = 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,types,primaryType,rating,userRatingCount,priceLevel,regularOpeningHours,currentOpeningHours,reviews,photos,googleMapsUri,reservable,delivery,takeout,curbsidePickup,dineIn,servesBreakfast,servesLunch,servesDinner,outdoorSeating,goodForGroups'

export function classifyInput(raw: string): { kind: InputKind; value: string } {
  const v = raw.trim()
  if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|g\.page\/|goo\.gl\/maps|share\.google|business\.google/i.test(v)) return { kind: 'gbp', value: v }
  if (/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v)) return { kind: 'website', value: v.startsWith('http') ? v : `https://${v}` }
  return { kind: 'name', value: v }
}

export function placesConfigured() { return Boolean(KEY) }

async function placesFetch(path: string, init: RequestInit, fieldMask: string) {
  const r = await fetch(`https://places.googleapis.com/v1/${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': KEY!, 'X-Goog-FieldMask': fieldMask, ...(init.headers || {}) },
  })
  if (!r.ok) throw new Error(`Places ${path} ${r.status}: ${(await r.text()).slice(0, 200)}`)
  return r.json()
}

/** Follow a short Maps link to get the long URL (contains the name / place id). */
async function expand(url: string) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 VbildScan' } })
    return r.url || url
  } catch { return url }
}

function nameFromMapsUrl(url: string): string | null {
  const m = url.match(/\/maps\/place\/([^/]+)/)
  if (m) return decodeURIComponent(m[1]).replace(/\+/g, ' ')
  const q = url.match(/[?&]q=([^&]+)/)
  if (q) return decodeURIComponent(q[1]).replace(/\+/g, ' ')
  return null
}

function toBusiness(p: Record<string, unknown>): Business {
  const g = (k: string) => p[k] as never
  const rev = ((p.reviews as Array<Record<string, unknown>>) || []).map((r) => ({
    rating: Number(r.rating || 0),
    text: String((r.text as { text?: string })?.text || (r.originalText as { text?: string })?.text || ''),
    when: String(r.relativePublishTimeDescription || ''),
  }))
  return {
    placeId: String(p.id || ''),
    name: String((p.displayName as { text?: string })?.text || ''),
    website: p.websiteUri as string | undefined,
    phone: p.nationalPhoneNumber as string | undefined,
    address: p.formattedAddress as string | undefined,
    types: (p.types as string[]) || [],
    primaryType: p.primaryType as string | undefined,
    rating: p.rating as number | undefined,
    reviewCount: p.userRatingCount as number | undefined,
    priceLevel: p.priceLevel as string | undefined,
    hours: ((p.regularOpeningHours as { weekdayDescriptions?: string[] })?.weekdayDescriptions) || [],
    openNow: (p.currentOpeningHours as { openNow?: boolean })?.openNow,
    attributes: { reservable: g('reservable'), delivery: g('delivery'), takeout: g('takeout'), curbsidePickup: g('curbsidePickup'), dineIn: g('dineIn'), outdoorSeating: g('outdoorSeating'), goodForGroups: g('goodForGroups') },
    reviews: rev,
    photos: ((p.photos as unknown[]) || []).length,
    mapsUrl: p.googleMapsUri as string | undefined,
  }
}

/** Resolve any input to a Business via Google Places (new API). Throws if not configured. */
export async function resolveBusiness(kind: InputKind, value: string): Promise<Business> {
  if (!KEY) throw new Error('GOOGLE_PLACES_API_KEY not set')
  let query = value
  if (kind === 'gbp') {
    const long = await expand(value)
    const cid = long.match(/[?&]cid=(\d+)/)?.[1]
    const name = nameFromMapsUrl(long)
    if (!name && !cid) throw new Error('Could not read a business from that Maps link')
    query = name || value
  }
  if (kind === 'website') {
    const host = new URL(value).hostname.replace(/^www\./, '')
    query = host.split('.')[0].replace(/[-_]/g, ' ')
  }
  const data = await placesFetch('places:searchText', { method: 'POST', body: JSON.stringify({ textQuery: query, maxResultCount: 3 }) }, FIELDS.split(',').map((f) => `places.${f}`).join(','))
  const places = (data.places as Array<Record<string, unknown>>) || []
  if (!places.length) throw new Error(`No Google Business Profile found for "${query}"`)
  // prefer a result whose website matches when we started from a website
  let pick = places[0]
  if (kind === 'website') {
    const host = new URL(value).hostname.replace(/^www\./, '')
    pick = places.find((p) => String(p.websiteUri || '').includes(host)) || places[0]
  }
  return toBusiness(pick)
}
