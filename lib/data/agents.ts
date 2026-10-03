/**
 * Agents stream — every agent built across the Vbild account.
 * Packaged as reusable units the admin team can see, trigger, and (later) sell.
 */

export type AgentStatus = 'production' | 'beta' | 'prototype' | 'planned'

export type Agent = {
  id: string
  name: string
  oneLiner: string
  status: AgentStatus
  trigger: string           // what starts it
  inputs: string[]
  outputs: string[]
  model: string
  project?: string          // id from portfolio.ts
  runsPerMonth?: number     // illustrative, verify before external use
  estimate?: boolean
  sellable: boolean         // could be packaged for customers
  accent: string
  emoji: string
}

export const AGENTS: Agent[] = [
  {
    id: 'bildr-interviewer',
    name: 'Bildr Interviewer',
    oneLiner: 'Runs a 5-turn discovery interview with a business owner by voice or text.',
    status: 'production',
    trigger: 'Visitor starts /start',
    inputs: ['Voice (Deepgram)', 'Text'],
    outputs: ['Transcript', 'Qualified lead'],
    model: 'Claude Sonnet 4.6',
    project: 'bildr',
    sellable: true,
    accent: '#6366f1',
    emoji: '🎙️',
  },
  {
    id: 'prd-generator',
    name: 'PRD Generator',
    oneLiner: 'Turns an interview transcript into a structured PRD and picks a prototype archetype.',
    status: 'production',
    trigger: 'Interview complete',
    inputs: ['Transcript'],
    outputs: ['PRD JSON', 'Prototype (3 screens)', 'Sales email'],
    model: 'Claude Sonnet 4.6',
    project: 'bildr',
    sellable: true,
    accent: '#a855f7',
    emoji: '📐',
  },
  {
    id: 'ops-digest',
    name: 'Restaurant Ops Digest',
    oneLiner: 'Reads POS data nightly, sends a plain-English digest and flags anomalies.',
    status: 'beta',
    trigger: 'Nightly cron',
    inputs: ['POS export', 'Inventory'],
    outputs: ['Daily digest', 'Anomaly alerts (SMS)'],
    model: 'Claude Haiku 4.5',
    project: 'shopboard',
    sellable: true,
    accent: '#f59e0b',
    emoji: '📊',
  },
  {
    id: 'blog-writer',
    name: 'Innowi Blog Writer',
    oneLiner: 'Writes, fact-checks and packages restaurant-tech blog posts for two audiences (ISOs, operators).',
    status: 'production',
    trigger: 'Topic brief',
    inputs: ['Topic', 'Audience', 'Sources'],
    outputs: ['Post', 'SEO meta', 'CTA', 'Pre-publish checklist'],
    model: 'Claude Opus 5',
    project: 'innowi-tooling',
    sellable: true,
    accent: '#ef4444',
    emoji: '✍️',
  },
  {
    id: 'card-pipeline',
    name: 'Business Card → Pipeline',
    oneLiner: 'Reads conference business cards into a partner database and drafts first-touch outreach.',
    status: 'prototype',
    trigger: 'Photo upload',
    inputs: ['Card photos'],
    outputs: ['Contact records', 'Outreach drafts', 'Pipeline stage'],
    model: 'Claude Sonnet 4.6 (vision) / Hermes Agent',
    project: 'innowi-tooling',
    sellable: true,
    accent: '#0ea5e9',
    emoji: '🪪',
  },
  {
    id: 'pseo-builder',
    name: 'pSEO Site Builder',
    oneLiner: 'Generates a programmatic-SEO restaurant site from a content tree and brand assets.',
    status: 'production',
    trigger: 'Content tree (xlsx) + assets',
    inputs: ['Menu', 'Locations', 'Brand kit'],
    outputs: ['Next.js site', 'Local landing pages', 'Sitemap'],
    model: 'Claude Opus 5',
    project: 'burger-barn',
    sellable: true,
    accent: '#22c55e',
    emoji: '🗺️',
  },
  {
    id: 'social-content',
    name: 'Social Content Engine',
    oneLiner: 'Plans a posting calendar and produces carousels + captions in the owner\'s voice.',
    status: 'production',
    trigger: 'Weekly',
    inputs: ['Menu photos', 'Promos'],
    outputs: ['Carousels', 'Captions', 'Calendar'],
    model: 'Claude Sonnet 4.6',
    project: 'arigato-bato',
    sellable: true,
    accent: '#14b8a6',
    emoji: '📸',
  },
  {
    id: 'deploy-watchdog',
    name: 'Deploy Watchdog',
    oneLiner: 'Watches every Vercel deploy, reads failing build logs, fixes the cause and redeploys.',
    status: 'production',
    trigger: 'Git push',
    inputs: ['Vercel events', 'Build logs'],
    outputs: ['Fix commit', 'Status report'],
    model: 'Claude (Cowork)',
    sellable: false,
    accent: '#64748b',
    emoji: '🛡️',
  },
  {
    id: 'proposal-builder',
    name: 'Proposal Builder',
    oneLiner: 'Turns a discovery call into a scoped, priced proposal on Vbild tiers.',
    status: 'planned',
    trigger: 'Call transcript',
    inputs: ['Transcript', 'Tier pricing'],
    outputs: ['Proposal PDF', 'Deposit invoice'],
    model: 'Claude Sonnet 4.6',
    sellable: false,
    accent: '#8b5cf6',
    emoji: '📄',
  },
  {
    id: 'dept-agents',
    name: 'Department Agents (AI Factory)',
    oneLiner: 'Five function-specific agents (Marketing, Sales, Finance, HR, Special Projects) built by the Lahore cohort.',
    status: 'prototype',
    trigger: 'Varies by department',
    inputs: ['Dept data'],
    outputs: ['Dashboards', 'Automations'],
    model: 'Claude Code',
    project: 'ai-factory',
    sellable: true,
    accent: '#ec4899',
    emoji: '🏭',
  },
]

export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  production: 'Production',
  beta: 'Beta',
  prototype: 'Prototype',
  planned: 'Planned',
}
