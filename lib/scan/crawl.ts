import type { Site } from './types'

const TECH: [string, RegExp][] = [
  ['Toast', /toasttab\.com/i], ['Square', /squareup\.com|square\.site|squarespace-ordering/i], ['Clover', /clover\.com/i], ['Shopify', /cdn\.shopify|myshopify/i],
  ['Wix', /wix\.com|wixstatic/i], ['Squarespace', /squarespace\.com|sqsp/i], ['WordPress', /wp-content|wp-includes/i], ['GoDaddy', /godaddy|secureserver/i],
  ['Mindbody', /mindbodyonline/i], ['Vagaro', /vagaro\.com/i], ['Booksy', /booksy\.com/i], ['GlossGenius', /glossgenius/i], ['Fresha', /fresha\.com/i],
  ['Jobber', /getjobber\.com|jobber\.com/i], ['Housecall Pro', /housecallpro/i], ['ServiceTitan', /servicetitan/i], ['Calendly', /calendly\.com/i], ['Acuity', /acuityscheduling/i],
  ['OpenTable', /opentable\.com/i], ['Resy', /resy\.com/i], ['Yelp Reservations', /yelp\.com\/reservations/i], ['Tock', /exploretock/i],
  ['DoorDash', /doordash\.com/i], ['Uber Eats', /ubereats\.com/i], ['Grubhub', /grubhub\.com/i], ['ChowNow', /chownow/i], ['Owner.com', /owner\.com/i], ['Popmenu', /popmenu/i],
  ['Stripe', /js\.stripe\.com/i], ['PayPal', /paypal\.com\/sdk/i], ['HubSpot', /hs-scripts|hubspot/i], ['Intercom', /intercom\.io|intercomcdn/i], ['Tidio', /tidio/i], ['Drift', /drift\.com/i],
  ['Meta Pixel', /connect\.facebook\.net\/.*fbevents|fbq\(/i], ['Google Analytics', /googletagmanager|gtag\(|google-analytics/i], ['Mailchimp', /mailchimp|list-manage/i],
  ['Eventbrite', /eventbrite/i], ['FareHarbor', /fareharbor/i], ['Peek', /peek\.com|bookpeek/i], ['Rezdy', /rezdy/i], ['Xola', /xola\.com/i],
]
const BOOKING = ['Mindbody', 'Vagaro', 'Booksy', 'GlossGenius', 'Fresha', 'Jobber', 'Housecall Pro', 'ServiceTitan', 'Calendly', 'Acuity', 'OpenTable', 'Resy', 'Yelp Reservations', 'Tock', 'FareHarbor', 'Peek', 'Rezdy', 'Xola', 'Eventbrite']
const ORDERING = ['Toast', 'Square', 'Clover', 'ChowNow', 'Owner.com', 'Popmenu', 'Shopify']
const THIRD = ['DoorDash', 'Uber Eats', 'Grubhub']

export async function crawlSite(url: string): Promise<Site> {
  const base: Site = { url, ok: false, https: url.startsWith('https://'), tech: [], hasBooking: false, hasOrdering: false, thirdPartyOrdering: [], hasContactForm: false, hasChat: false, hasPixel: false, hasAnalytics: false, hasSchema: false, wordCount: 0, emails: [], socials: [] }
  let html = ''
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 9000)
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; VbildScan/1.0; +https://vbild.ai/scan)' } })
    clearTimeout(t)
    base.ok = r.ok; base.https = r.url.startsWith('https://')
    html = (await r.text()).slice(0, 600_000)
  } catch { return base }
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  base.title = html.match(/<title[^>]*>([^<]{1,200})/i)?.[1]?.trim()
  base.description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})/i)?.[1]
  base.wordCount = text.split(' ').filter(Boolean).length
  base.tech = TECH.filter(([, re]) => re.test(html)).map(([n]) => n)
  base.hasBooking = base.tech.some((t) => BOOKING.includes(t)) || /book (now|online|an appointment)|schedule (now|online)|reserve (a table|now)/i.test(html)
  base.hasOrdering = base.tech.some((t) => ORDERING.includes(t)) || /order online|start (your )?order/i.test(html)
  base.thirdPartyOrdering = base.tech.filter((t) => THIRD.includes(t))
  base.hasContactForm = /<form[\s\S]{0,2000}(email|phone|message)/i.test(html)
  base.hasChat = base.tech.some((t) => ['Intercom', 'Tidio', 'Drift', 'HubSpot'].includes(t)) || /tawk\.to|crisp\.chat|livechat/i.test(html)
  base.hasPixel = base.tech.includes('Meta Pixel')
  base.hasAnalytics = base.tech.includes('Google Analytics')
  base.hasSchema = /application\/ld\+json/i.test(html)
  base.phoneOnPage = html.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)?.[0]
  base.emails = Array.from(new Set((html.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).filter((e) => !/\.(png|jpg|svg|webp)$/i.test(e)))).slice(0, 3)
  base.socials = Array.from(new Set((html.match(/https?:\/\/(www\.)?(instagram|facebook|tiktok|yelp)\.com\/[\w.\-/]+/gi) || []))).slice(0, 5)
  // PageSpeed (free, no key needed at low volume; key optional)
  try {
    const psKey = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.GOOGLE_PLACES_API_KEY
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 25000)
    const ps = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${psKey ? `&key=${psKey}` : ''}`, { signal: ctrl.signal })
    clearTimeout(t)
    if (ps.ok) {
      const j = await ps.json()
      base.mobileScore = Math.round((j.lighthouseResult?.categories?.performance?.score ?? 0) * 100)
      const lcp = j.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue
      if (lcp) base.lcpSeconds = Math.round(lcp / 100) / 10
    }
  } catch { /* speed is optional */ }
  return base
}
