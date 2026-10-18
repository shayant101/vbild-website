import type { CategoryId } from '@/lib/data/categories'

export type InputKind = 'gbp' | 'website' | 'name'

export type Business = {
  placeId?: string
  name: string
  website?: string
  phone?: string
  address?: string
  types: string[]
  primaryType?: string
  rating?: number
  reviewCount?: number
  priceLevel?: string
  hours?: string[]
  openNow?: boolean
  attributes: Record<string, boolean | undefined>   // reservable, delivery, takeout, curbside, dineIn, servesX...
  reviews: { rating: number; text: string; when?: string; ownerReplied?: boolean }[]
  photos?: number
  mapsUrl?: string
}

export type Site = {
  url: string
  ok: boolean
  title?: string
  description?: string
  https: boolean
  tech: string[]            // detected vendors/widgets
  hasBooking: boolean
  hasOrdering: boolean
  thirdPartyOrdering: string[]
  hasContactForm: boolean
  hasChat: boolean
  hasPixel: boolean
  hasAnalytics: boolean
  hasSchema: boolean
  mobileScore?: number      // PageSpeed 0–100
  lcpSeconds?: number
  wordCount: number
  phoneOnPage?: string
  emails: string[]
  socials: string[]
}

export type Fact = {
  id: string
  severity: 'high' | 'medium' | 'low' | 'good'
  area: 'presence' | 'bookings' | 'reviews' | 'automation' | 'speed'
  text: string
  evidence?: string
}

export type Opportunity = {
  title: string
  what: string               // what Vbild would build
  why: string                // tied to a fact
  tier: 'Solo' | 'Starter' | 'Growth' | 'Pro'
  impact: string             // range + citation
  job: string                // one of the category's six jobs
}

export type Report = {
  businessName: string
  categoryId: CategoryId
  subVertical: string
  headline: string
  summary: string
  scores: { presence: number; bookings: number; reviews: number; automation: number; speed: number; overall: number }
  opportunities: Opportunity[]
  insights: string[]          // special insights (from reviews etc.)
  similarBuilds: string[]     // portfolio ids
  prototype: { appName: string; tagline: string; scenario: string; features: string[]; screens: string[] }
  generatedBy: 'claude' | 'scripted'
}

export type Scan = {
  id: string
  input: string
  inputKind: InputKind
  status: 'queued' | 'running' | 'done' | 'error'
  mode: 'live' | 'scripted'
  business?: Business
  site?: Site
  facts: Fact[]
  report?: Report
  score?: number
  error?: string
  createdAt: string
  completedAt?: string
  unlocked?: boolean
}
