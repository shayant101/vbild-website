/**
 * Command-center detail per project: what has actually shipped (grouped), the product
 * pieces that make it up, and which vbild-ops registry ids feed its change-request queue.
 * Internal only — never rendered on the public site.
 */
export type FeatureGroup = { title: string; items: string[] }
export type Piece = { label: string; href?: string; note?: string }
export type ProjectDetail = {
  opsIds: string[]                 // vbild-ops `projects.id` values (SMS change requests + registry)
  delivered: FeatureGroup[]
  pieces: Piece[]
  money?: 'odyssey'               // which live data adapter to render
  contacts?: { name: string; role: string; channel: string }[]
  rules?: string[]
}

export const PROJECT_DETAIL: Record<string, ProjectDetail> = {
  'odyssey-vr': {
    opsIds: ['odyssey-booking', 'odyssey-website'],
    money: 'odyssey',
    rules: [
      'Production + real money. Always ask Shayan before any change.',
      'Money / refund / Stripe / DNS changes are RED — never automated.',
      'Payouts: Vbild requests, Shayan approves in Mercury. The merchant has no payout button.',
    ],
    contacts: [{ name: 'Odyssey VR owner', role: 'Merchant', channel: 'SMS change requests → vbild-ops queue' }],
    delivered: [
      { title: 'Customer-facing', items: ['Birthday-party booking with zones, players, extra hours & add-ons', 'Drop-in VR passes', 'Corporate-events lead form', 'Movie-night reservations', 'Memberships (Stripe subscriptions)', 'Gift cards', 'Promo & referral codes', 'Digital waiver (token link, IP + UA audit)', 'Deposit now / balance later checkout (25% deposit, 8.75% tax)', 'Waitlist for full slots'] },
      { title: 'Owner admin', items: ['Dashboard with revenue chart & stat cards', 'Bookings table + detail drawer + print work order', 'Calendar with blocked dates / slots', 'Customers, gift cards, promo codes, referrals, upsells, movie nights', 'Campaigns', 'Reports incl. Settlement tab (read-only payouts)'] },
      { title: 'Automations (12 crons)', items: ['Charge balances when due', 'Reminders & review requests / follow-ups', 'Abandoned-checkout recovery (3 touches)', 'Birthday re-booking (email + SMS)', 'Lapsed-customer win-back', 'Auto-complete past bookings', 'Weekly settlement reminder (Wed)', 'Mercury sync (every 6h) · Disputes sync (daily) · Merchant update digest (hourly)'] },
      { title: 'Money plumbing', items: ['Stripe webhooks → payments ledger (gross / fee / net)', 'Refunds & reschedule fees as ledger rows', 'Disputes + merchant adjustments (chargeback & fee)', 'Remittances with Mercury transaction links', 'payout_requests (Mercury approval requests, one active per week)'] },
    ],
    pieces: [
      { label: 'Booking app (prod)', href: 'https://book.odysseyvrarena.com', note: 'Next.js on Vercel' },
      { label: 'Marketing site', href: 'https://odysseyvrarena.com' },
      { label: 'Owner admin', href: 'https://book.odysseyvrarena.com/admin' },
      { label: 'Settlement report (merchant view)', href: 'https://book.odysseyvrarena.com/admin/reports?tab=settlement' },
      { label: 'Repo', href: 'https://github.com/shayant101/odyssey-vr-nextjs' },
      { label: 'Vercel project', href: 'https://vercel.com/shayant101s-projects/odyssey-vr-nextjs', note: 'prj_65LE6M5kYQDppwnCohze3G4IgF7y' },
      { label: 'Supabase (prod DB)', href: 'https://supabase.com/dashboard/project/pzcycdvxdkghttbdgzuf', note: 'vbild_cc role = read + payout_requests only' },
      { label: 'Stripe', href: 'https://dashboard.stripe.com', note: 'Vbild platform account; 95% remitted weekly' },
      { label: 'Mercury (payout approvals)', href: 'https://app.mercury.com', note: 'Recipient "Odyssey VR" · ACH' },
    ],
  },
  'innowi-tooling': {
    opsIds: ['innowi-site-manager'],
    delivered: [
      { title: 'Agents', items: ['Blog writer (ISO / restaurant audiences, SEO + CTA + pre-publish checklist)', 'Business-card → partner-lead pipeline (WSAA)'] },
      { title: 'Content & programs', items: ['Elavon referral-partner program materials', 'WordPress → Next.js site manager (pilot)'] },
    ],
    pieces: [
      { label: 'innowi.com', href: 'https://innowi.com' },
      { label: 'Site manager Supabase', href: 'https://supabase.com/dashboard/project/bkwnugmcgypbochzyckx' },
    ],
  },
}

export function detailFor(id: string): ProjectDetail {
  return PROJECT_DETAIL[id] ?? { opsIds: [id], delivered: [], pieces: [] }
}
