import FadeIn from './FadeIn'

const NODES = [
  { cls: 'on1', color: '#6366f1', label: 'AI Builder' },
  { cls: 'on2', color: '#a855f7', label: 'React + Next.js' },
  { cls: 'on3', color: '#22d3ee', label: 'Stripe Payments' },
  { cls: 'on4', color: '#10b981', label: 'QR + Waivers' },
  { cls: 'on5', color: '#6366f1', label: 'SMS Alerts' },
  { cls: 'on6', color: '#f59e0b', label: '⚡ Live in Days' },
  { cls: 'on7', color: '#a855f7', label: 'Admin Dashboard' },
]

export default function SolutionSection() {
  return (
    <section id="solution">
      <div className="container">
        <div className="solution-inner">
          <FadeIn>
            <div>
              <span className="section-label">The Solution</span>
              <h2 className="section-title">
                AI-built apps.<br />
                <span className="grad-text">Agency quality at SaaS prices.</span>
              </h2>
              <p className="section-sub">
                Vbild uses AI to compress what took agencies months into days — without cutting
                corners on design, logic, or reliability.
              </p>

              <ul className="solution-points">
                <li>
                  <span className="sol-check">✓</span>
                  <p>
                    <strong>Custom-built for your vertical</strong> — not a generic template.
                    Smoke shop age-gates, ranch QR waivers, venue booking deposits.
                  </p>
                </li>
                <li>
                  <span className="sol-check">✓</span>
                  <p>
                    <strong>Live in ~10 days</strong> — we scope, design, and deploy while most
                    agencies are still writing proposals.
                  </p>
                </li>
                <li>
                  <span className="sol-check">✓</span>
                  <p>
                    <strong>Priced like SaaS, not agencies</strong> — starting at $3,500 build + a
                    simple monthly. No $100K surprise invoices.
                  </p>
                </li>
                <li>
                  <span className="sol-check">✓</span>
                  <p>
                    <strong>You own the code</strong> — full source delivery, hosted on Vercel or
                    Netlify. No vendor lock-in.
                  </p>
                </li>
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="orbit-wrap">
              <div className="orbit-ring orbit-ring-1" />
              <div className="orbit-ring orbit-ring-2" />
              <div className="orbit-center">Vbild</div>
              {NODES.map((n) => (
                <div key={n.cls} className={`orbit-node ${n.cls}`}>
                  <span className="nd" style={{ background: n.color }} />
                  {n.label}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
