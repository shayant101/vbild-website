import type { Metadata } from 'next'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import market from '@/lib/data/market.json'
import { PROJECTS } from '@/lib/data/portfolio'
import './investors.css'

export const metadata: Metadata = {
  title: 'Investors — Vbild',
  description: 'Vbild builds custom software for small businesses with AI, priced like SaaS. Pre-seed overview: market, model, traction, and the ask.',
  robots: { index: false, follow: false },
}

type Src = { title: string; url: string }
const SRC = market.sources as Record<string, Src>
const money = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}K`
const num = (n: number) => n.toLocaleString('en-US')
const d = (id: string) => market.demand.find((x) => x.id === id)!
const v = (id: string) => market.vcNorms.find((x) => x.id === id)!

export default function InvestorsPage() {
  const t = market.tamSamSom
  const live = market.company.traction.liveApps
  const building = PROJECTS.filter((p) => p.status === 'building' || p.status === 'pilot').length
  const core = market.smbCounts.filter((c) => ['indep-restaurants', 'smoke-shops', 'amusement', 'event-venues'].includes(c.id))
  const adj = market.smbCounts.filter((c) => ['gyms', 'auto', 'dental'].includes(c.id))

  return (
    <>
      <NavBar />
      <main className="inv">
        {/* hero */}
        <section className="inv-hero">
          <div className="container">
            <FadeIn>
              <div className="inv-badges">
                <span className="inv-badge">{market.company.raise.type} · {money(market.company.raise.min)}–{money(market.company.raise.max)} · {market.company.raise.instrument}</span>
                <span className="inv-badge soft">Member of Claude for Startups</span>
                <span className="inv-badge soft">{market.company.incorporated}</span>
              </div>
              <h1>Custom software for small businesses.<br /><span className="grad-text">Built by AI. Priced like SaaS.</span></h1>
              <p className="inv-lede">
                Agencies quote independent restaurants, shops and venues {d('agency-cost').range} and ~13 months for the software they need, so most never buy it. Vbild interviews the owner, writes the spec, and ships a working app they own in days, for $3,500–$25,000 plus $99–$499 a month. The margins of software, sold as a service.
              </p>
              <div className="inv-actions">
                <a className="btn-primary" href="mailto:shayan.s.toor@gmail.com?subject=Vbild%20pre-seed%20%E2%80%94%20deck%20request">Request the deck</a>
                <a className="btn-ghost" href="https://cal.com/shayan-vbild/discovery-call" target="_blank" rel="noreferrer">Book 20 minutes with the founder</a>
                <Link className="btn-ghost" href="/demo">Watch the live demo</Link>
              </div>
            </FadeIn>
            <FadeIn delay={120}>
              <div className="inv-kpis">
                <div><b>{live}</b><span>apps in production</span></div>
                <div><b>{building}</b><span>in build / pilot</span></div>
                <div><b>5</b><span>verticals served</span></div>
                <div><b>3–21</b><span>days to ship, so far</span></div>
                <div><b>${num(market.company.acv.blended)}</b><span>blended ACV</span></div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* thesis */}
        <section className="inv-section">
          <div className="container inv-two">
            <FadeIn>
              <div>
                <span className="section-label">Thesis</span>
                <h2 className="section-title">Sell the work, not the tool.</h2>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="inv-prose">
                <p><b>Small businesses were never the customer.</b> {num(36200000)} US small businesses exist; custom software has only ever been built for the ones that could pay six figures and wait a year. Vertical SaaS filled part of the gap, but Toast, Square and Mindbody fit the average business, not yours.</p>
                <p><b>AI collapsed the cost of building.</b> What took an agency team months is now days with Claude in the loop and a senior engineer reviewing. a16z: &ldquo;{market.quotes[2].text}&rdquo; That is this market.</p>
                <p><b>DIY builders prove demand, not the solution.</b> Lovable ({d('lovable').value}) shows owners want their own software. But {d('vibe-abandon').value} of vibe-coded projects never reach production: owners don&apos;t want to build, host and maintain. They want it done. Sequoia: &ldquo;{market.quotes[1].text}&rdquo;</p>
                <p><b>Our wedge is operators, not developers.</b> The founder runs growth at a restaurant-kiosk company and sells into the same payments and POS ecosystem daily. Every build so far came from that network.</p>
                <div className="inv-cites">{['a16z-2026', 'sequoia-2026', 'techcrunch-2026', 'fuzen-2026'].map((k) => <a key={k} href={SRC[k].url} target="_blank" rel="noreferrer">{SRC[k].title} ↗</a>)}</div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* market */}
        <section className="inv-section alt">
          <div className="container">
            <FadeIn>
              <div className="text-center">
                <span className="section-label">Market</span>
                <h2 className="section-title">A bottoms-up market, not a top-down one.</h2>
                <p className="section-sub">Business counts from Census, SBA, Technomic and USDA × a blended ${num(t.acv)} annual contract value (setup amortized over three years plus subscription). Every input is listed below.</p>
              </div>
            </FadeIn>
            <div className="inv-tss">
              <FadeIn><div className="inv-circle tam"><small>TAM</small><b>{money(t.tam.value)}</b><span>{t.tam.label}</span><em>{num(t.tam.businesses)} businesses · {money(t.tam.upper)} {t.tam.upperLabel}</em></div></FadeIn>
              <FadeIn delay={80}><div className="inv-circle sam"><small>SAM</small><b>{money(t.sam.value)}</b><span>{t.sam.label}</span><em>{num(t.sam.businesses)} businesses · up to {money(t.sam.upper)} unfiltered</em></div></FadeIn>
              <FadeIn delay={160}><div className="inv-circle som"><small>SOM · year 3</small><b>{money(t.som[1].revenue)}</b><span>{t.som[1].customers} customers at ${num(t.som[1].acv)} ACV (base case)</span><em>{money(t.som[0].revenue)} conservative · {money(t.som[2].revenue)} aggressive</em></div></FadeIn>
            </div>
            <FadeIn delay={120}>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead><tr><th>Segment</th><th>US businesses</th><th>Year</th><th>Source</th></tr></thead>
                  <tbody>
                    <tr className="inv-th"><td colSpan={4}>Core verticals (SAM base)</td></tr>
                    {core.map((c) => <tr key={c.id}><td>{c.label}{c.note && <i title={c.note}> *</i>}</td><td>{num(c.value)}</td><td>{c.year}</td><td><a href={SRC[c.source].url} target="_blank" rel="noreferrer">{SRC[c.source].title}</a></td></tr>)}
                    <tr className="inv-th"><td colSpan={4}>Adjacent local-service verticals (TAM expansion)</td></tr>
                    {adj.map((c) => <tr key={c.id}><td>{c.label}</td><td>{num(c.value)}</td><td>{c.year}</td><td><a href={SRC[c.source].url} target="_blank" rel="noreferrer">{SRC[c.source].title}</a></td></tr>)}
                  </tbody>
                </table>
                <p className="inv-note">* Composite counts combine several sources; no clean Census count exists for VR arcades or ranch event venues. Salons (1.06M, mostly booth renters) are excluded from the base TAM. SOM assumes {t.som[1].customers} customers by year three, under 0.2% of SAM, roughly one quarter of what Toast adds in a single quarter.</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* model */}
        <section className="inv-section">
          <div className="container">
            <FadeIn>
              <div className="text-center">
                <span className="section-label">Business model</span>
                <h2 className="section-title">Setup fee funds the build. Subscription compounds.</h2>
              </div>
            </FadeIn>
            <div className="inv-tiers">
              {market.company.pricing.map((p, i) => (
                <FadeIn key={p.tier} delay={i * 80}>
                  <div className="inv-tier">
                    <small>{p.tier}</small>
                    <b>${num(p.setup)}</b>
                    <span>+ ${p.monthlyLow === p.monthlyHigh ? p.monthlyLow : `${p.monthlyLow}–${p.monthlyHigh}`}/mo</span>
                    <em>ACV ≈ ${num([market.company.acv.starter, market.company.acv.growth, market.company.acv.pro][i])}</em>
                  </div>
                </FadeIn>
              ))}
            </div>
            <FadeIn delay={200}>
              <div className="inv-model-notes">
                <div><h4>Unit economics</h4><p>Blended ACV ${num(market.company.acv.blended)} at a {market.company.acv.mix} tier mix. Setup fees cover delivery cost on day one; subscription (hosting, support, agents) is the recurring base. Target gross margin 70%+ as AI share of delivery rises and the Lahore AI-developer cohort absorbs capacity. <i>Target, not yet audited.</i></p></div>
                <div><h4>Willingness to pay is proven</h4><p>Toast runs {d('toast-arr').value} ARR and locations. Owner.com passed {d('owner-arr').value} ARR selling independents a $249–$499/mo website. Vbild&apos;s $99–$499/mo sits inside the band small businesses already pay, with custom software instead of a template.</p></div>
                <div><h4>From done-for-you to self-serve</h4><p>Every build adds to a shared primitive library (lists, calendars, payments, QR, waivers, age-gates, alerts). The <Link href="/new-world">Living Interface</Link> is the productized core; Bildr is the self-serve front door. Services today, platform margins tomorrow.</p></div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* competition */}
        <section className="inv-section alt">
          <div className="container">
            <FadeIn>
              <div className="text-center">
                <span className="section-label">Why Vbild wins</span>
                <h2 className="section-title">Done-for-you, custom, AI-speed, SaaS-priced.</h2>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="inv-quad">
                <div className="inv-q"><small>DIY AI builders</small><b>Lovable · Bolt · Replit · Base44</b><p>$20–$50/mo, but the owner builds, debugs, hosts and maintains. ~60% of projects never ship. Great signal for demand; wrong buyer.</p></div>
                <div className="inv-q"><small>Agencies &amp; freelancers</small><b>Clutch median $171K · ~13 months</b><p>Custom, but priced for enterprises. 31% of projects finish on time, budget and scope (Standish).</p></div>
                <div className="inv-q"><small>Vertical SaaS</small><b>Toast · Square · Mindbody</b><p>Polished and rigid: one vertical, no custom workflows, $70–$2,000+/mo stacks. Proves the budget exists.</p></div>
                <div className="inv-q win"><small>Vbild</small><b>Custom · days · $3.5K–$25K + $99–$499/mo</b><p>We interview, spec, build and run it. Owner gets software shaped to the business and owns the code. Distribution through the payments/POS channel the founder already works in.</p></div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* gtm + ask */}
        <section className="inv-section">
          <div className="container inv-two">
            <FadeIn>
              <div>
                <span className="section-label">Go-to-market</span>
                <h2 className="section-title">Channels we already stand in.</h2>
                <ul className="inv-list">
                  <li><b>Payments &amp; POS ecosystem.</b> Founder is CGO at Innowi (restaurant kiosks); relationships with ISOs and processors (e.g. Elavon referral partners) reach thousands of merchants who already buy monthly software.</li>
                  <li><b>Bildr self-serve intake.</b> A 5-minute AI interview on vbild.ai produces a spec and prototype, then hands a qualified lead to sales. Zero-touch top of funnel.</li>
                  <li><b>Programmatic-SEO restaurant sites.</b> Low-ticket entry product (Starter tier) that converts to apps and agents.</li>
                  <li><b>Lahore AI-developer cohort.</b> Five function-specific AI developers on a 30/60/90 plan; delivery capacity that scales with demand at a fraction of US cost.</li>
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="inv-ask">
                <span className="section-label">The ask</span>
                <h3>{money(market.company.raise.min)}–{money(market.company.raise.max)} pre-seed on a post-money SAFE</h3>
                <p className="inv-ask-sub">Market context: median post-money cap for $250K–$1M rounds was {v('safe-cap').value} in 2025; {v('ai-share').value} of pre-seed dollars went to AI in H1 2026 (Carta). Terms discussed directly with the founder.</p>
                <h4>Proposed use of funds · 18–24 months</h4>
                <div className="inv-uof">
                  <div style={{ ['--w' as string]: '45%' }}><span>Delivery &amp; engineering</span><b>45%</b></div>
                  <div style={{ ['--w' as string]: '25%' }}><span>Go-to-market (channel, Bildr, content)</span><b>25%</b></div>
                  <div style={{ ['--w' as string]: '20%' }}><span>Platform (Living Interface, agents)</span><b>20%</b></div>
                  <div style={{ ['--w' as string]: '10%' }}><span>Ops &amp; buffer</span><b>10%</b></div>
                </div>
                <h4>Milestones this round funds</h4>
                <ul className="inv-ms">
                  <li>100 paying businesses across 5 verticals</li>
                  <li>$500K ARR run-rate with 70%+ gross margin</li>
                  <li>Self-serve Bildr → prototype → paid build without a sales call</li>
                  <li>Agent catalog sold as add-ons to every live app</li>
                </ul>
                <div className="inv-actions">
                  <a className="btn-primary" href="mailto:shayan.s.toor@gmail.com?subject=Vbild%20pre-seed">Email the founder</a>
                  <a className="btn-ghost" href="https://cal.com/shayan-vbild/discovery-call" target="_blank" rel="noreferrer">Book a call</a>
                </div>
                <p className="inv-fine">Allocation and milestones are the founder&apos;s plan, not commitments. Market figures are cited to primary sources where available; see the deck for the full source list. Not an offer to sell securities.</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* sources */}
        <section className="inv-section alt inv-sources">
          <div className="container">
            <h4>Sources</h4>
            <ol>{Object.values(SRC).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ol>
            <p className="inv-note">Data as of {market.asOf}.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
