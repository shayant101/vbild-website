export type ScenarioId = 'restaurant' | 'smokeshop' | 'vr' | 'ranch'

export type Spec = {
  appName: string
  tagline: string
  users: string
  features: string[]
  screens: string[]
  stack: string[]
  scenario: ScenarioId
  tier: 'Starter' | 'Growth' | 'Pro'
  setup: number
  monthly: number
}

export type Scenario = {
  id: ScenarioId
  label: string
  emoji: string
  accent: string
  bizName: string
  owner: string
  pitch: string                       // what the owner "says" first
  interview: { q: string; a: string }[]
  spec: Spec
  files: string[]
  buildLog: string[]
  agencyQuote: string
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  restaurant: {
    id: 'restaurant', label: 'Restaurant', emoji: '🍽️', accent: '#6366f1',
    bizName: 'Marrow Kitchen', owner: 'Dana, owner',
    pitch: 'I run a 60-seat restaurant. Reservations come in by phone, Instagram DMs and a notebook. I lose tables every weekend.',
    interview: [
      { q: 'How do you take reservations today, and where does it break?', a: 'Phone and DMs. Double-bookings on Fridays, no-shows we never charged, and my host spends an hour a day on the notebook.' },
      { q: 'What would a good Friday night look like?', a: 'Every table turned twice, deposits on parties of 6+, and a text to the kitchen when a big party is 10 minutes out.' },
      { q: 'What do you already use?', a: 'Toast for POS, Square for the odd event. I want this to talk to Toast, not replace it.' },
    ],
    spec: {
      appName: 'TableSync', tagline: 'Reservations, deposits and a kitchen heads-up for Marrow Kitchen.',
      users: 'Host stand, owner, kitchen lead',
      features: ['Live floor timeline', 'Party-size deposits (Stripe)', 'No-show fee rules', 'Kitchen SMS heads-up', 'Toast POS sync', 'Nightly ops digest'],
      screens: ['Tonight', 'Book a table', 'Owner dashboard'],
      stack: ['Next.js', 'Supabase', 'Stripe', 'Twilio', 'Toast API'],
      scenario: 'restaurant', tier: 'Growth', setup: 8000, monthly: 299,
    },
    files: ['app/page.tsx', 'app/book/page.tsx', 'app/owner/page.tsx', 'components/FloorTimeline.tsx', 'components/DepositForm.tsx', 'lib/toast.ts', 'lib/sms.ts', 'app/api/reservations/route.ts', 'app/api/webhooks/stripe/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Designing schema: tables, reservations, deposits', 'Generating FloorTimeline with 15-min slots', 'Wiring Stripe deposits for parties ≥ 6', 'Adding Twilio kitchen heads-up (T-10 min)', 'Mapping Toast POS sync job', 'Writing nightly ops digest agent', 'Type-check ✓  Lint ✓  12 tests ✓', 'Deploying to Vercel → tablesync.vbild.app'],
    agencyQuote: '$38K–$171K · 4–13 months',
  },
  smokeshop: {
    id: 'smokeshop', label: 'Smoke shop', emoji: '💨', accent: '#a855f7',
    bizName: 'OC Smoke Shack', owner: 'Ray, owner',
    pitch: 'Two-location smoke shop. I want customers to order on a tablet at the counter, earn points, and I need to know when inventory runs low.',
    interview: [
      { q: 'Walk me through a sale right now.', a: 'Customer points at the wall, we ring it on an old register, loyalty is a punch card. I have no idea what\'s selling until I count shelves.' },
      { q: 'Any rules you have to follow?', a: 'Age verification on every order — 21+. Nothing ships; it\'s counter pickup only.' },
      { q: 'What would make you say this was worth it?', a: 'Points that bring people back, a low-stock alert before I run out of the top 20 SKUs, and both stores on one dashboard.' },
    ],
    spec: {
      appName: 'ShopBoard', tagline: 'Age-gated tablet ordering, loyalty and live inventory for OC Smoke Shack.',
      users: 'Counter staff, repeat customers, owner',
      features: ['21+ age gate', 'Tablet menu & cart', 'Loyalty points', 'Live inventory with low-stock alerts', 'Stripe checkout', 'Two-store dashboard'],
      screens: ['Age gate → Menu', 'Cart & checkout', 'Owner dashboard'],
      stack: ['Next.js', 'Prisma', 'Postgres', 'Stripe', 'Twilio', 'Railway'],
      scenario: 'smokeshop', tier: 'Pro', setup: 25000, monthly: 499,
    },
    files: ['app/page.tsx', 'app/menu/page.tsx', 'app/checkout/page.tsx', 'app/owner/page.tsx', 'components/AgeGate.tsx', 'components/ProductGrid.tsx', 'components/LoyaltyBadge.tsx', 'prisma/schema.prisma', 'app/api/orders/route.ts', 'app/api/inventory/alerts/route.ts', 'app/api/webhooks/stripe/route.ts'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: products, inventory, orders, members, points', 'Generating AgeGate (21+) with DOB check', 'Building ProductGrid with category tabs', 'Loyalty: 1 pt / $1, 100 pts = $5', 'Low-stock alert job (threshold 5 units, SMS)', 'Stripe Terminal + card-not-present checkout', 'Type-check ✓  Lint ✓  18 tests ✓', 'Deploying to Railway → shopboard.vbild.app'],
    agencyQuote: '$80K–$171K · 6–13 months',
  },
  vr: {
    id: 'vr', label: 'VR arena', emoji: '🎮', accent: '#22d3ee',
    bizName: 'Odyssey VR Arena', owner: 'Sam, GM',
    pitch: 'We have 8 VR stations. Bookings are a Google Form and a lot of texting. Groups show up late, and we eat the cost when they don\'t show.',
    interview: [
      { q: 'What does a booking look like end-to-end?', a: 'Form → I text back times → they Venmo a deposit → I write it on the whiteboard → they sign a paper waiver at the door.' },
      { q: 'What goes wrong most?', a: 'No-shows with no deposit, waivers lost, and I can\'t see utilization — I\'m guessing when to add staff.' },
      { q: 'Dream version?', a: 'They pick a slot, pay a deposit, sign the waiver on their phone, get a QR code. I get a dashboard with utilization per station.' },
    ],
    spec: {
      appName: 'StationBook', tagline: 'Slot booking, deposits, digital waivers and QR entry for Odyssey VR Arena.',
      users: 'Players, front desk, GM',
      features: ['8-station slot calendar', 'Deposits (Stripe)', 'Digital waiver (e-sign)', 'QR entry pass', 'Group bookings', 'Utilization dashboard'],
      screens: ['Pick a slot', 'Deposit & waiver', 'GM dashboard'],
      stack: ['Next.js', 'Supabase', 'Stripe', 'qrfy'],
      scenario: 'vr', tier: 'Growth', setup: 8000, monthly: 299,
    },
    files: ['app/page.tsx', 'app/book/[slot]/page.tsx', 'app/waiver/page.tsx', 'app/gm/page.tsx', 'components/SlotGrid.tsx', 'components/WaiverSign.tsx', 'components/QRPass.tsx', 'lib/qr.ts', 'app/api/bookings/route.ts', 'app/api/webhooks/stripe/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: stations, slots, bookings, waivers', 'SlotGrid: 8 stations × 30-min slots', 'Stripe deposit = 25% of booking', 'Waiver e-sign with timestamp + IP', 'QR pass via qrfy dynamic codes', 'GM dashboard: utilization heatmap', 'Type-check ✓  Lint ✓  14 tests ✓', 'Deploying to Vercel → book.odysseyvrarena.com'],
    agencyQuote: '$38K–$120K · 4–9 months',
  },
  ranch: {
    id: 'ranch', label: 'Ranch events', emoji: '🐄', accent: '#22c55e',
    bizName: 'SN Ranch', owner: 'Noor, operator',
    pitch: 'We host a 600-person Eid event on the ranch. Check-in is a printed list and a cash box. Cell signal is bad in the back forty.',
    interview: [
      { q: 'How do guests get in today?', a: 'They say a name, we flip through 20 pages. Payments are cash or Zelle screenshots. It takes 45 minutes to get everyone in.' },
      { q: 'What has to work even if the internet doesn\'t?', a: 'Check-in. If the list is on a phone and the signal drops, we\'re back to paper.' },
      { q: 'What would you want to see the morning after?', a: 'Who came, who paid, what we collected — in one screen I can send to the family.' },
    ],
    spec: {
      appName: 'RanchGate', tagline: 'Offline-ready QR check-in and bulk payments for SN Ranch events.',
      users: 'Gate volunteers, organizers, guests',
      features: ['QR tickets', 'Offline-first guest list', 'Bulk payment capture', 'Family grouping', 'Live headcount', 'Morning-after report'],
      screens: ['Gate check-in', 'Guest list', 'Organizer report'],
      stack: ['Next.js (PWA)', 'Supabase', 'Stripe', 'Netlify'],
      scenario: 'ranch', tier: 'Starter', setup: 3500, monthly: 149,
    },
    files: ['app/page.tsx', 'app/gate/page.tsx', 'app/guests/page.tsx', 'app/report/page.tsx', 'components/QRScanner.tsx', 'components/GuestRow.tsx', 'lib/offline-sync.ts', 'public/manifest.json', 'app/api/checkin/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: events, guests, families, payments', 'PWA manifest + service worker (offline-first)', 'QR scanner with local queue + background sync', 'Bulk payments: one tap per family', 'Live headcount with reconnect merge', 'Morning-after report (CSV + share link)', 'Type-check ✓  Lint ✓  9 tests ✓', 'Deploying to Netlify → snranch-eid2026.netlify.app'],
    agencyQuote: '$30K–$80K · 3–6 months',
  },
}

export const SCENARIO_LIST = Object.values(SCENARIOS)

/** Keyword match for free-text input when live mode is unavailable. */
export function guessScenario(text: string): ScenarioId {
  const t = text.toLowerCase()
  if (/vr|arcade|gaming|station|escape|bowling|laser/.test(t)) return 'vr'
  if (/smoke|vape|tobacco|dispensary|shop|retail|store|inventory|loyalty/.test(t)) return 'smokeshop'
  if (/ranch|farm|event|wedding|festival|check-in|checkin|guest/.test(t)) return 'ranch'
  return 'restaurant'
}
