export type ScenarioId = 'restaurant' | 'smokeshop' | 'vr' | 'ranch' | 'plumber' | 'landscaper' | 'realtor' | 'salon'
export type CategoryKey = 'places' | 'pros' | 'venues'

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
  category: CategoryKey
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
    id: 'restaurant', category: 'places', label: 'Restaurant', emoji: '🍽️', accent: '#6366f1',
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
    id: 'smokeshop', category: 'places', label: 'Smoke shop', emoji: '💨', accent: '#a855f7',
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
    id: 'vr', category: 'venues', label: 'VR arena', emoji: '🎮', accent: '#22d3ee',
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
    id: 'ranch', category: 'venues', label: 'Ranch events', emoji: '🐄', accent: '#22c55e',
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
  plumber: {
    id: 'plumber', category: 'pros', label: 'Plumber', emoji: '🔧', accent: '#22c55e',
    bizName: 'Reyes Plumbing & Heating', owner: 'Marco, owner',
    pitch: 'Two trucks, me and one tech. I quote by text, chase deposits on Venmo, and invoice from a notes app at 10pm. Half my reviews never get posted.',
    interview: [
      { q: 'Walk me through a job from first call to getting paid.', a: 'Call or Thumbtack lead → I drive out → quote on a text → they say yes → we do it → I invoice days later → I chase it. Deposits almost never happen.' },
      { q: 'Where does money leak?', a: 'Leads I pay $40 for and never close, no-shows on the first visit, and invoices that sit for 3 weeks. And I never ask for the review.' },
      { q: 'What would a good week look like?', a: 'Quote goes out the same hour with a deposit link, the calendar fills itself, the invoice sends when the job closes, and a review request goes out that night.' },
    ],
    spec: {
      appName: 'JobLine', tagline: 'Quote → deposit → job → invoice → review for Reyes Plumbing & Heating.',
      users: 'Owner, field tech, customers',
      features: ['Quote with deposit link', 'Calendar & route for 2 trucks', 'Job photos & notes', 'Invoice on close (Tap to Pay)', 'Automatic review request', 'AI receptionist for missed calls'],
      screens: ['Today\'s jobs', 'Quote & deposit', 'Owner dashboard'],
      stack: ['Next.js', 'Supabase', 'Stripe', 'Twilio', 'Google Maps'],
      scenario: 'plumber', tier: 'Growth', setup: 8000, monthly: 299,
    },
    files: ['app/page.tsx', 'app/jobs/[id]/page.tsx', 'app/quote/[id]/page.tsx', 'app/owner/page.tsx', 'components/JobCard.tsx', 'components/QuoteBuilder.tsx', 'components/DepositLink.tsx', 'lib/routes.ts', 'lib/sms.ts', 'app/api/quotes/route.ts', 'app/api/webhooks/stripe/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: customers, jobs, quotes, invoices, reviews', 'QuoteBuilder with line items + 30% deposit link', 'Two-truck calendar with drive-time routing', 'Invoice auto-sends on job close · Tap to Pay', 'Review request SMS 2 hours after payment', 'AI receptionist: missed call → text back → booking', 'Type-check ✓  Lint ✓  16 tests ✓', 'Deploying to Vercel → jobline.vbild.app'],
    agencyQuote: '$40K–$120K · 4–9 months',
  },
  landscaper: {
    id: 'landscaper', category: 'pros', label: 'Landscaper', emoji: '🌿', accent: '#84cc16',
    bizName: 'Greenline Lawn & Landscape', owner: 'Tasha, owner',
    pitch: 'Three crews, 140 weekly accounts. Routes live in my head, customers pay whenever, and I lose a day a week to scheduling texts.',
    interview: [
      { q: 'How do customers get on the schedule today?', a: 'They text me. I move things around in a spreadsheet and text the crews. If it rains, I redo the whole week by hand.' },
      { q: 'How do you get paid?', a: 'Monthly invoices by email. About a third pay late. I don\'t have card-on-file for anyone.' },
      { q: 'What would make Monday mornings easy?', a: 'Routes built for me, crews see their day on a phone, rain pushes everything automatically, and recurring customers just get charged.' },
    ],
    spec: {
      appName: 'CrewRoute', tagline: 'Recurring routes, crew check-ins and card-on-file billing for Greenline Lawn & Landscape.',
      users: 'Owner, 3 crew leads, 140 customers',
      features: ['Recurring route builder', 'Crew app with check-in/out', 'Rain-day reschedule', 'Card-on-file auto-billing', 'Before/after photos to customer', 'Upsell prompts (aeration, mulch)'],
      screens: ['Route board', 'Crew day', 'Customer portal'],
      stack: ['Next.js (PWA)', 'Supabase', 'Stripe', 'Mapbox', 'Twilio'],
      scenario: 'landscaper', tier: 'Growth', setup: 8000, monthly: 299,
    },
    files: ['app/page.tsx', 'app/crew/[id]/page.tsx', 'app/portal/page.tsx', 'components/RouteBoard.tsx', 'components/CrewDay.tsx', 'components/PhotoProof.tsx', 'lib/routing.ts', 'lib/billing.ts', 'app/api/routes/route.ts', 'app/api/billing/run/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: accounts, routes, visits, crews, invoices', 'RouteBoard: 140 accounts → 3 crews by drive time', 'Crew PWA with GPS check-in and photo proof', 'Rain-day: shift week, notify 140 customers in one tap', 'Stripe card-on-file, auto-bill on visit complete', 'Upsell prompts by season', 'Type-check ✓  Lint ✓  15 tests ✓', 'Deploying to Vercel → crewroute.vbild.app'],
    agencyQuote: '$50K–$130K · 5–10 months',
  },
  realtor: {
    id: 'realtor', category: 'pros', label: 'Real estate team', emoji: '🏡', accent: '#f59e0b',
    bizName: 'Harbor & Vale Group', owner: 'Priya, team lead',
    pitch: 'Four-agent team. The brokerage CRM is fine for compliance, but open-house leads go into a paper sign-in sheet and follow-up depends on whoever remembers.',
    interview: [
      { q: 'What happens to a lead from an open house?', a: 'Paper sheet, maybe typed into the CRM two days later, one text, then nothing. We lose most of them to whoever follows up first.' },
      { q: 'What does the brokerage already cover?', a: 'MLS, e-sign, transaction compliance. Not our brand, not our follow-up, not a client portal.' },
      { q: 'What would you want on the kitchen counter at the next open house?', a: 'A tablet sign-in under our brand that texts the listing, books a showing, and drips follow-ups for 30 days without us touching it.' },
    ],
    spec: {
      appName: 'OpenDoor Desk', tagline: 'Branded open-house sign-in, showing booking and 30-day follow-up for Harbor & Vale Group.',
      users: '4 agents, buyers, sellers',
      features: ['Tablet sign-in (branded)', 'Instant listing text + photos', 'Showing booking', '30-day follow-up drip', 'Seller portal with visit stats', 'Sync to brokerage CRM'],
      screens: ['Open-house sign-in', 'Lead follow-up', 'Seller report'],
      stack: ['Next.js', 'Supabase', 'Twilio', 'Resend', 'Follow Up Boss API'],
      scenario: 'realtor', tier: 'Starter', setup: 3500, monthly: 199,
    },
    files: ['app/page.tsx', 'app/signin/[listing]/page.tsx', 'app/leads/page.tsx', 'app/seller/[id]/page.tsx', 'components/SignInKiosk.tsx', 'components/DripTimeline.tsx', 'lib/drip.ts', 'lib/fub.ts', 'app/api/leads/route.ts', 'app/api/cron/drip/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: listings, visitors, showings, drips', 'SignInKiosk: name + phone + pre-approved? in 15 seconds', 'Instant text with listing photos + showing link', '30-day drip: day 0, 2, 7, 14, 30 — pauses on reply', 'Seller report: visits, repeat visitors, feedback', 'Sync contacts to brokerage CRM nightly', 'Type-check ✓  Lint ✓  12 tests ✓', 'Deploying to Vercel → desk.harborvale.com'],
    agencyQuote: '$30K–$80K · 3–6 months',
  },
  salon: {
    id: 'salon', category: 'pros', label: 'Salon', emoji: '✂️', accent: '#ec4899',
    bizName: 'Studio Nine Hair', owner: 'Dev, owner-stylist',
    pitch: 'Six chairs, four booth renters. Everyone books on a different app, no-shows cost me a day a month, and I can\'t see the whole room.',
    interview: [
      { q: 'How does a client book today?', a: 'Instagram DM, text, or one of three booking apps depending on the stylist. I find out about no-shows when the chair is empty.' },
      { q: 'What do you already pay for?', a: 'Square for cards, one stylist is on GlossGenius, one on Booksy. Nothing talks to anything.' },
      { q: 'What would you want?', a: 'One booking page for the whole studio under my brand, card on file with a no-show fee, rebook before they leave, and a view of every chair.' },
    ],
    spec: {
      appName: 'ChairBook', tagline: 'One branded booking page, no-show protection and rebooking for Studio Nine Hair.',
      users: 'Owner, 6 stylists (incl. 4 renters), clients',
      features: ['Studio-wide booking page', 'Card on file + no-show fee', 'Rebook-before-you-leave', 'Per-chair split payouts', 'Formula & photo notes', 'Review request after visit'],
      screens: ['Book a chair', 'Stylist day', 'Owner room view'],
      stack: ['Next.js', 'Supabase', 'Stripe Connect', 'Twilio'],
      scenario: 'salon', tier: 'Growth', setup: 8000, monthly: 299,
    },
    files: ['app/page.tsx', 'app/book/page.tsx', 'app/stylist/[id]/page.tsx', 'app/owner/page.tsx', 'components/ChairPicker.tsx', 'components/NoShowPolicy.tsx', 'components/RebookPrompt.tsx', 'lib/payouts.ts', 'app/api/bookings/route.ts', 'app/api/webhooks/stripe/route.ts', 'supabase/schema.sql'],
    buildLog: ['Reading spec → 6 features, 3 screens', 'Schema: chairs, stylists, clients, bookings, formulas', 'ChairPicker: any stylist, any service, one page', 'Card on file + $25 no-show fee with 24h reminder', 'Stripe Connect: renter payouts split at checkout', 'Rebook prompt at checkout (6 weeks default)', 'Review request 3 hours after visit', 'Type-check ✓  Lint ✓  14 tests ✓', 'Deploying to Vercel → chairbook.vbild.app'],
    agencyQuote: '$40K–$100K · 4–8 months',
  },
}

export const SCENARIO_LIST = Object.values(SCENARIOS)
export const SCENARIO_GROUPS: { key: CategoryKey; label: string; line: string; ids: ScenarioId[] }[] = [
  { key: 'places', label: 'Places', line: 'Run the counter.', ids: ['restaurant', 'smokeshop'] },
  { key: 'pros', label: 'Pros', line: 'Run the calendar.', ids: ['plumber', 'landscaper', 'realtor', 'salon'] },
  { key: 'venues', label: 'Venues', line: 'Run the door.', ids: ['vr', 'ranch'] },
]


/** Keyword match for free-text input when live mode is unavailable. */
export function guessScenario(text: string): ScenarioId {
  const t = text.toLowerCase()
  if (/plumb|hvac|electric|handyman|roof|paint|remodel|contractor|repair/.test(t)) return 'plumber'
  if (/landscap|lawn|mow|tree|yard|garden|snow|pool service|pressure wash/.test(t)) return 'landscaper'
  if (/real estate|realtor|broker|listing|open house|agent/.test(t)) return 'realtor'
  if (/salon|hair|barber|stylist|nail|spa|lash|brow|tattoo/.test(t)) return 'salon'
  if (/vr|arcade|gaming|station|escape|bowling|laser/.test(t)) return 'vr'
  if (/smoke|vape|tobacco|dispensary|shop|retail|store|inventory|loyalty/.test(t)) return 'smokeshop'
  if (/ranch|farm|event|wedding|festival|check-in|checkin|guest/.test(t)) return 'ranch'
  return 'restaurant'
}
