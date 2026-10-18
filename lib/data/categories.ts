/**
 * Vbild taxonomy — three categories, one sentence shape.
 *   Places  · businesses with a counter  · "Run the counter."
 *   Pros    · businesses with a calendar · "Run the calendar."
 *   Venues  · businesses with a door     · "Run the door."
 */
export type CategoryId = 'places' | 'pros' | 'venues'
export type SubVertical = { id: string; label: string; plural: string; demo?: string; example?: string }
export type Category = {
  id: CategoryId; name: string; noun: string; line: string; promise: string; who: string
  jobs: string[]; subs: SubVertical[]; accent: string; image: string; imageAlt: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'places', name: 'Places', noun: 'counter', line: 'Run the counter.',
    promise: 'Custom apps for businesses with a counter: ordering, inventory and loyalty shaped to how your place actually runs.',
    who: 'Restaurants, cafés, smoke shops, bottle shops, boutiques and any business a customer walks into.',
    jobs: ['Tablet & kiosk ordering', 'Reservations & waitlist', 'Inventory with low-stock alerts', 'Loyalty & rewards', 'POS sync (Toast, Square, Clover)', 'Nightly ops digest'],
    subs: [
      { id: 'restaurant', label: 'Restaurant', plural: 'restaurants', demo: 'restaurant', example: 'burger-barn' },
      { id: 'cafe', label: 'Café & bakery', plural: 'cafés' },
      { id: 'smokeshop', label: 'Smoke shop', plural: 'smoke shops', demo: 'smokeshop', example: 'shopboard' },
      { id: 'retail', label: 'Boutique & bottle shop', plural: 'shops' },
    ],
    accent: '#6366f1', image: '/categories/places.jpg', imageAlt: 'A restaurant counter with a tablet ordering screen',
  },
  {
    id: 'pros', name: 'Pros', noun: 'calendar', line: 'Run the calendar.',
    promise: 'Custom apps for businesses with a calendar: quotes, booking, deposits and invoices shaped to how you actually work.',
    who: 'Plumbers, electricians, HVAC, landscapers, remodelers, cleaners, real estate agents, stylists — anyone whose business is their schedule and their truck, chair or listing.',
    jobs: ['Quote → deposit in one link', 'Online booking & routes', 'Branded client portal', 'Invoices & Tap to Pay', 'Automatic review requests', 'AI receptionist & follow-ups'],
    subs: [
      { id: 'trades', label: 'Plumber · HVAC · electrician', plural: 'plumbers', demo: 'plumber' },
      { id: 'landscaper', label: 'Landscaper & lawn care', plural: 'landscapers', demo: 'landscaper' },
      { id: 'remodeler', label: 'Remodeler · roofer · painter', plural: 'contractors' },
      { id: 'cleaner', label: 'Cleaning company', plural: 'cleaners' },
      { id: 'realtor', label: 'Real estate agent & team', plural: 'realtors', demo: 'realtor' },
      { id: 'salon', label: 'Stylist · barber · salon', plural: 'salons', demo: 'salon' },
    ],
    accent: '#22c55e', image: '/categories/pros.jpg', imageAlt: 'A contractor checking a job calendar on a phone beside a work truck',
  },
  {
    id: 'venues', name: 'Venues', noun: 'door', line: 'Run the door.',
    promise: 'Custom apps for businesses with a door: slots, tickets, waivers and check-in shaped to how your space actually fills.',
    who: 'VR arenas, arcades, escape rooms, ranches, event spaces, studios and any business that sells time in a place.',
    jobs: ['Slot & station booking', 'Deposits & no-show fees', 'Digital waivers', 'QR tickets & check-in', 'Offline-ready gate', 'Utilization dashboard'],
    subs: [
      { id: 'vr', label: 'VR arena & arcade', plural: 'VR arenas', demo: 'vr', example: 'odyssey-vr' },
      { id: 'ranch', label: 'Ranch & event venue', plural: 'ranches', demo: 'ranch', example: 'sn-ranch' },
      { id: 'escape', label: 'Escape room & FEC', plural: 'escape rooms' },
      { id: 'studio', label: 'Studio & rental space', plural: 'studios' },
    ],
    accent: '#a855f7', image: '/categories/venues.jpg', imageAlt: 'A venue entrance with a QR check-in stand',
  },
]
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>
export const TYPEWRITER_WORDS = ['restaurant', 'plumber', 'VR arena', 'salon', 'smoke shop', 'landscaper', 'ranch', 'realtor', 'café', 'cleaning company', 'escape room', 'contractor']

export type Tier = { id: string; name: string; setup: number; monthly: number; monthlyLabel?: string; badge?: string; who: string; features: string[]; selfServe?: boolean; featured?: boolean }
export const TIERS: Tier[] = [
  { id: 'solo', name: 'Solo', setup: 0, monthly: 29, badge: 'Self-serve · new', who: 'One person, one calendar', selfServe: true, features: ['Booking page & quote link', 'Deposits & invoices, Tap to Pay', 'Branded client portal', 'Automatic review requests', 'Live in 5 minutes', 'Upgrade to a custom build anytime'] },
  { id: 'starter', name: 'Starter', setup: 3500, monthly: 149, monthlyLabel: '$99–$199', who: 'Single-focus custom app', features: ['Single-focus app', 'Mobile-optimized UI', 'Vercel or Netlify deploy', '1 payment integration', '30-day support'] },
  { id: 'growth', name: 'Growth', setup: 8000, monthly: 299, who: 'Multi-feature app + dashboard', featured: true, features: ['Multi-feature app', 'Custom domain setup', 'Admin dashboard', 'Stripe + SMS', 'QR / waivers / notifications', '3-month priority support'] },
  { id: 'pro', name: 'Pro', setup: 25000, monthly: 499, who: 'Full platform + agents', features: ['Full-stack platform', 'AI agents', 'Multi-user roles', 'Custom integrations', 'Merchant dashboard', '12-month SLA'] },
]
