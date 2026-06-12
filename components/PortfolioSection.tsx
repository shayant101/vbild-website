import FadeIn from './FadeIn'
import TiltCard from './TiltCard'

const PROJECTS = [
  {
    emoji: '💨',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    tag: 'Smoke Shop',
    title: 'Retail Ordering Platform',
    desc: 'Full-featured tablet POS with age verification, loyalty points, and real-time inventory sync.',
    feats: ['Tablet POS', 'Age-Gate', 'Inventory', 'Stripe'],
  },
  {
    emoji: '🐄',
    bg: 'linear-gradient(135deg, #052e16 0%, #166534 100%)',
    tag: 'Events',
    title: 'Event & Guest Management',
    desc: 'QR-based check-in, bulk payment processing, and offline-ready guest management for large events.',
    feats: ['QR Check-In', 'Real-time', 'Bulk Payments', 'Offline-ready'],
  },
  {
    emoji: '🎮',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    tag: 'Entertainment',
    title: 'Venue Booking System',
    desc: 'Station booking with automated deposits, digital waivers, and an owner dashboard.',
    feats: ['Booking Flow', 'Deposits', 'Waivers', 'Dashboard'],
  },
  {
    emoji: '🍽️',
    bg: 'linear-gradient(135deg, #2d1515 0%, #7f1d1d 100%)',
    tag: 'Restaurant',
    title: 'Restaurant Operations Agent',
    desc: 'AI agent that syncs with POS, sends daily digests, and alerts staff to anomalies in real time.',
    feats: ['AI Agent', 'POS Sync', 'Daily Digest', 'Alerts'],
  },
  {
    emoji: '📅',
    bg: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 100%)',
    tag: 'Services',
    title: 'Booking & Scheduling App',
    desc: 'Online booking with automated reminders, client portal, and deposit collection via Stripe.',
    feats: ['Online Booking', 'Reminders', 'Client Portal', 'Deposits'],
  },
  {
    emoji: '🏪',
    bg: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
    tag: 'Custom',
    title: "Something We Haven't Built Yet",
    desc: "Your business is unique. Tell us what you need and we'll scope it out — for free.",
    feats: ['Any Stack', 'Any Vertical', 'Any Scale'],
    link: true,
  },
]

export default function PortfolioSection() {
  return (
    <section id="portfolio">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Our Work</span>
            <h2 className="section-title">
              Real apps. Real businesses.<br />
              <span className="grad-text">Zero client names disclosed.</span>
            </h2>
            <p className="section-sub">
              We protect our clients&apos; competitive edge. What you see here is real work — just
              anonymized.
            </p>
          </div>
        </FadeIn>

        <div className="portfolio-grid">
          {PROJECTS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 80}>
              <TiltCard className="port-card">
                <div className="port-img">
                  <div className="port-img-bg" style={{ background: p.bg }} />
                  <span className="port-emoji">{p.emoji}</span>
                  <span className="port-tag">{p.tag}</span>
                </div>
                <div className="port-body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <div className="port-feats">
                    {p.feats.map((f) => (
                      <span className="port-feat" key={f}>{f}</span>
                    ))}
                  </div>
                  {p.link ? (
                    <a href="#cta" className="port-link">Let&apos;s talk →</a>
                  ) : (
                    <a href="#cta" className="port-link">Build something similar →</a>
                  )}
                </div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
