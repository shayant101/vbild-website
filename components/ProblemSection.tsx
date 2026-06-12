import FadeIn from './FadeIn'

const CARDS = [
  {
    icon: '💸',
    title: 'Agencies quote $30K–$100K',
    desc: 'Enterprise dev shops build beautiful software — but their pricing is built for enterprise clients, not the family business down the street.',
  },
  {
    icon: '⏳',
    title: '6–18 months to ship',
    desc: 'By the time a traditional agency delivers, the market has moved, the season is over, or you\'ve already lost customers to a competitor who moved faster.',
  },
  {
    icon: '🔒',
    title: 'No-code tools hit a ceiling',
    desc: 'Bubble, Glide, and AppSheet get you started. But age-gates, real-time inventory sync, QR check-in, and custom logic? You hit the wall fast.',
  },
  {
    icon: '🤷',
    title: 'Off-the-shelf doesn\'t fit',
    desc: 'Toast, Square, Mindbody — all built for the average business. Your smoke shop with an age-gate, your ranch with QR waivers, needs something custom.',
  },
]

export default function ProblemSection() {
  return (
    <section id="problem">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">The Problem</span>
            <h2 className="section-title">
              Small businesses deserve great software.<br />
              <span className="grad-text">They just can&apos;t afford agency prices.</span>
            </h2>
            <p className="section-sub">
              The same apps restaurants and venues use to run their business exist — they just cost
              $50K and take six months to build. Until now.
            </p>
          </div>
        </FadeIn>

        <div className="problem-grid">
          {CARDS.map((c, i) => (
            <FadeIn key={c.title} delay={i * 100}>
              <div className="problem-card">
                <div className="problem-card-top" />
                <span className="problem-icon">{c.icon}</span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
