import { classifyInput, placesConfigured, resolveBusiness } from './resolve'
import { crawlSite } from './crawl'
import { classify, detect, scoreFromFacts } from './detectors'
import { claudeReport, scriptedReport } from './report'
import { newId, recentScanForPlace, saveScan } from './db'
import type { Business, Scan, Site } from './types'

/** Run a full scan. Never throws for "soft" failures — degrades to whatever data it could get. */
export async function runScan(raw: string, ipHash?: string): Promise<Scan> {
  const { kind, value } = classifyInput(raw)
  const scan: Scan = { id: newId('scan'), input: raw.trim(), inputKind: kind, status: 'running', mode: placesConfigured() ? 'live' : 'scripted', facts: [], createdAt: new Date().toISOString() }
  await saveScan(scan, ipHash)
  try {
    let business: Business | undefined
    let site: Site | undefined
    if (placesConfigured()) {
      try { business = await resolveBusiness(kind, value) } catch (e) { if (kind !== 'website') throw e }
      if (business?.placeId) { const cached = await recentScanForPlace(business.placeId); if (cached?.report) return cached }
    }
    const siteUrl = kind === 'website' ? value : business?.website
    if (siteUrl) site = await crawlSite(siteUrl)
    if (!business && kind === 'name' && !placesConfigured()) {
      // scripted mode with a plain name: synthesize a minimal business so the flow still demonstrates
      business = { name: value, types: [], attributes: {}, reviews: [] }
    }
    const { categoryId, subVertical, scenario } = classify(business, site)
    const facts = detect(business, site, categoryId)
    const draft = scriptedReport(business, site, facts, categoryId, subVertical, scenario)
    const report = await claudeReport(draft, facts, business, site)
    const score = scoreFromFacts(facts).overall
    Object.assign(scan, { business, site, facts, report, score, status: 'done', completedAt: new Date().toISOString() })
  } catch (e) {
    Object.assign(scan, { status: 'error', error: e instanceof Error ? e.message : 'Scan failed', completedAt: new Date().toISOString() })
  }
  await saveScan(scan, ipHash)
  return scan
}
