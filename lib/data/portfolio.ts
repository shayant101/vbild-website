/**
 * Vbild portfolio — single source of truth for the admin portal,
 * the public Work section, and the investor materials.
 *
 * `public: true` means the name/URL may appear on the marketing site.
 * Everything else is admin-only.
 *
 * Upgrade path: this file maps 1:1 to a `projects` table (see docs/ADMIN.md).
 */

export type ProjectStatus = 'live' | 'building' | 'pilot' | 'concept' | 'internal'
export type Tier = 'Starter' | 'Growth' | 'Pro' | 'Internal' | 'R&D'

export type Project = {
  id: string
  name: string
  client: string            // public-safe label
  vertical: string
  status: ProjectStatus
  tier: Tier
  summary: string
  features: string[]
  stack: string[]
  links?: { live?: string; repo?: string; docs?: string }
  public: boolean
  owner: string
  started: string           // YYYY-MM
  shipped?: string          // YYYY-MM
  daysToShip?: number       // flagged if estimate
  estimate?: boolean        // true → numbers are estimates, verify before external use
  mrr?: number              // $/mo, verify before external use
  accent: string
  emoji: string
  agents?: string[]         // ids from agents.ts
}

export const PROJECTS: Project[] = [
  {
    id: 'shopboard',
    name: 'ShopBoard',
    client: 'OC Smoke Shack',
    vertical: 'Smoke shop',
    status: 'live',
    tier: 'Pro',
    summary:
      'Tablet ordering + owner dashboard for a smoke shop: age-gated menu, loyalty points, live inventory, Stripe checkout and SMS receipts.',
    features: ['Tablet POS', 'Age verification', 'Loyalty', 'Inventory sync', 'Stripe', 'Twilio SMS'],
    stack: ['Next.js', 'Prisma', 'Postgres', 'Stripe', 'Twilio', 'Cloudinary', 'Railway'],
    links: { repo: 'https://github.com/shayant01/shopboard' },
    public: true,
    owner: 'Shayan',
    started: '2026-04',
    shipped: '2026-05',
    daysToShip: 21,
    estimate: true,
    accent: '#6366f1',
    emoji: '💨',
    agents: ['ops-digest'],
  },
  {
    id: 'sn-ranch',
    name: 'SN Ranch Events',
    client: 'SN Ranch',
    vertical: 'Ranch / event venue',
    status: 'live',
    tier: 'Starter',
    summary:
      'Event check-in and payments app for a working ranch: QR tickets, offline-ready guest list, bulk payment capture for Eid 2026.',
    features: ['QR check-in', 'Guest list', 'Bulk payments', 'Offline-ready', 'Admin view'],
    stack: ['Next.js', 'Supabase', 'Netlify'],
    links: { live: 'https://snranch-eid2026.netlify.app' },
    public: true,
    owner: 'Shayan',
    started: '2026-05',
    shipped: '2026-05',
    daysToShip: 9,
    estimate: true,
    accent: '#22c55e',
    emoji: '🐄',
  },
  {
    id: 'odyssey-vr',
    name: 'Odyssey VR Booking',
    client: 'Odyssey VR Arena',
    vertical: 'VR / gaming venue',
    status: 'building',
    tier: 'Growth',
    summary:
      'Station booking for a VR arena: time-slot calendar, deposits, digital waivers, QR entry via dynamic codes, owner dashboard.',
    features: ['Slot booking', 'Deposits', 'Digital waivers', 'QR entry', 'Owner dashboard'],
    stack: ['Next.js', 'Supabase', 'Stripe', 'qrfy'],
    links: { live: 'https://odysseyvrarena.com' },
    public: true,
    owner: 'Shayan',
    started: '2026-06',
    accent: '#a855f7',
    emoji: '🎮',
  },
  {
    id: 'innowi-tooling',
    name: 'Innowi Growth Tooling',
    client: 'Innowi (restaurant kiosks)',
    vertical: 'Restaurant tech / payments',
    status: 'live',
    tier: 'Internal',
    summary:
      'AI tooling built for Innowi: blog writer for the restaurant-tech audience, WSAA business-card → partner-pipeline agent, Elavon referral-partner program materials.',
    features: ['Blog writer agent', 'Lead pipeline agent', 'Partner CRM (planned)', 'Referral program docs'],
    stack: ['Claude', 'Next.js', 'Hermes Agent', 'WordPress → Next.js'],
    public: false,
    owner: 'Shayan',
    started: '2026-08',
    accent: '#f59e0b',
    emoji: '🍽️',
    agents: ['blog-writer', 'card-pipeline'],
  },
  {
    id: 'ai-factory',
    name: 'AI Factory (Lahore)',
    client: 'Innowi / Vbild',
    vertical: 'Talent & delivery',
    status: 'pilot',
    tier: 'Internal',
    summary:
      'Five-person AI developer cohort in Lahore, one per function (Marketing, Sales, Finance, HR, Special Projects). Each builds department-specific agents and dashboards on a 30/60/90-day plan.',
    features: ['5 AI developers', 'Dept-specific agents', '30/60/90 reviews', 'Delivery capacity for Vbild builds'],
    stack: ['Claude Code', 'Cowork', 'Next.js', 'Supabase'],
    public: false,
    owner: 'Shayan',
    started: '2026-09',
    accent: '#ec4899',
    emoji: '🏭',
  },
  {
    id: 'superapp',
    name: 'Living Interface (SuperApp)',
    client: 'Vbild R&D',
    vertical: 'Platform',
    status: 'concept',
    tier: 'R&D',
    summary:
      'One set of primitives (list, calendar, payments, QR, alerts, stats, age-gate) that reshapes itself per business. The productized core behind every Vbild build — live as the /new-world demo.',
    features: ['8 shared primitives', 'Per-vertical layouts', 'Agent hooks', 'Self-serve later'],
    stack: ['Next.js', 'Framer Motion', 'Claude'],
    links: { live: 'https://vbild.ai/new-world' },
    public: true,
    owner: 'Shayan',
    started: '2026-06',
    accent: '#22d3ee',
    emoji: '🧬',
  },
  {
    id: 'bildr',
    name: 'Bildr Voice Intake',
    client: 'Vbild',
    vertical: 'Platform',
    status: 'live',
    tier: 'R&D',
    summary:
      '5-minute voice/text interview that turns a business owner\'s idea into a PRD and a clickable prototype (8 archetypes), then emails the sales team.',
    features: ['Voice interview', 'PRD generation', '8 prototype archetypes', 'Sales handoff email'],
    stack: ['Next.js', 'Claude Sonnet', 'Deepgram', 'Nodemailer'],
    links: { live: 'https://vbild.ai/start' },
    public: true,
    owner: 'Shayan',
    started: '2026-06',
    shipped: '2026-06',
    daysToShip: 3,
    accent: '#6366f1',
    emoji: '🎙️',
    agents: ['bildr-interviewer', 'prd-generator'],
  },
  {
    id: 'burger-barn',
    name: 'Burger Barn pSEO Site',
    client: 'Burger Barn (San Jose)',
    vertical: 'Restaurant',
    status: 'live',
    tier: 'Starter',
    summary:
      'Programmatic-SEO restaurant website migrated from WordPress to Next.js. Pilot for the pSEO website line.',
    features: ['pSEO pages', 'Menu', 'Local landing pages', 'WordPress migration'],
    stack: ['Next.js', 'Vercel'],
    public: false,
    owner: 'Shayan',
    started: '2026-07',
    shipped: '2026-08',
    accent: '#ef4444',
    emoji: '🍔',
    agents: ['pseo-builder'],
  },
  {
    id: 'urban-punjab',
    name: 'Urban Punjab Site',
    client: 'The Urban Punjab (Garden Grove)',
    vertical: 'Restaurant',
    status: 'building',
    tier: 'Starter',
    summary: 'Second pSEO restaurant website; content tree + build brief delivered Aug 2026.',
    features: ['pSEO pages', 'Menu', 'Catering', 'Local landing pages'],
    stack: ['Next.js', 'Vercel'],
    public: false,
    owner: 'Shayan',
    started: '2026-08',
    accent: '#f97316',
    emoji: '🍛',
    agents: ['pseo-builder'],
  },
  {
    id: 'arigato-bato',
    name: 'Arigato Bato Social',
    client: 'Arigato Bato (Bellflower)',
    vertical: 'Restaurant',
    status: 'live',
    tier: 'Starter',
    summary: 'Social media content engine for a hibachi restaurant — Instagram carousels and captions.',
    features: ['Carousel generation', 'Caption writing', 'Posting calendar'],
    stack: ['Claude', 'Canva'],
    public: false,
    owner: 'Shayan',
    started: '2026-07',
    accent: '#14b8a6',
    emoji: '🍣',
    agents: ['social-content'],
  },
]

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: 'Live',
  building: 'In build',
  pilot: 'Pilot',
  concept: 'R&D',
  internal: 'Internal',
}

export function publicProjects() {
  return PROJECTS.filter((p) => p.public)
}
