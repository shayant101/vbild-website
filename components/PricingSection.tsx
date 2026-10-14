import FadeIn from './FadeIn'
import TiltCard from './TiltCard'

import { TIERS } from '@/lib/data/categories'

const PLANS = TIERS.map((t) => ({ tier: t.name, price: t.setup === 0 ? '0' : t.setup.toLocaleString(), mo: t.monthlyLabel ?? `$${t.monthly}`, build: t.selfServe ? 'No build fee · self-serve' : 'One-time build fee', featured: Boolean(t.featured), badge: t.badge ?? (t.featured ? 'Most Popular' : undefined), features: t.features, solo: Boolean(t.selfServe) }))

export default function PricingSection() {
  return (
    <section id="pricing">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Pricing</span>
            <h2 className="section-title">
              Transparent pricing.<br />
              <span className="grad-text">No agency surprises.</span>
            </h2>
            <p className="section-sub">
              Start on Solo in five minutes, or get a custom build: one-time fee plus a simple monthly for hosting, support and updates. No contracts.
            </p>
          </div>
        </FadeIn>

        <div className="pricing-grid">
          {PLANS.map((p, i) => (
            <FadeIn key={p.tier} delay={i * 100}>
              <TiltCard className={`price-card${p.featured ? ' featured' : ''}${p.solo ? ' solo' : ''}`}>
                <div className="price-card-bar" />
                {p.badge && <span className="price-badge">{p.badge}</span>}
                <div className="price-tier">{p.tier}</div>
                <div className="price-amount">
                  <sup>$</sup>{p.price}
                </div>
                <div className="price-mo">{p.mo}/month</div>
                <div className="price-build">+ {p.build}</div>
                <div className="price-div" />
                <ul className="price-features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href={p.solo ? "/for/pros#demo" : "#cta"} className="price-cta">{p.solo ? "Start free in 5 min" : "Get Started"}</a>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
