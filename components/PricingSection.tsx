import FadeIn from './FadeIn'
import TiltCard from './TiltCard'

const PLANS = [
  {
    tier: 'Starter',
    price: '3,500',
    mo: '$99–$199',
    build: 'One-time build fee',
    featured: false,
    features: [
      'Single-focus app',
      'Mobile-optimized UI',
      'Netlify or Vercel deploy',
      '1 payment integration',
      '30-day support',
    ],
  },
  {
    tier: 'Growth',
    price: '8,000',
    mo: '$299',
    build: 'One-time build fee',
    featured: true,
    badge: 'Most Popular',
    features: [
      'Multi-feature app',
      'Custom domain setup',
      'Admin dashboard',
      'Stripe + SMS',
      'QR / waivers / notifications',
      '3-month priority support',
    ],
  },
  {
    tier: 'Pro',
    price: '25,000',
    mo: '$499',
    build: 'One-time build fee',
    featured: false,
    features: [
      'Full-stack platform',
      'AI agents',
      'Multi-user roles',
      'Custom integrations',
      'Merchant dashboard',
      '12-month SLA',
    ],
  },
]

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
              One-time build fee + a simple monthly for hosting, support, and updates. No
              contracts. Cancel anytime.
            </p>
          </div>
        </FadeIn>

        <div className="pricing-grid">
          {PLANS.map((p, i) => (
            <FadeIn key={p.tier} delay={i * 100}>
              <TiltCard className={`price-card${p.featured ? ' featured' : ''}`}>
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
                <a href="#cta" className="price-cta">Get Started</a>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
