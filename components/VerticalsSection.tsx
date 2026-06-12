import FadeIn from './FadeIn'
import TiltCard from './TiltCard'

const VERTICALS = [
  { icon: '🍽️', title: 'Restaurants', desc: 'POS sync, digital menus, reservations, daily digest.' },
  { icon: '💨', title: 'Smoke Shops', desc: 'Tablet POS, age-gate, loyalty, inventory alerts.' },
  { icon: '🎮', title: 'Gaming Venues', desc: 'Station booking, deposits, waivers, leaderboards.' },
  { icon: '🐄', title: 'Ranches & Events', desc: 'Guest QR check-in, bulk payments, offline-ready.' },
  { icon: '📅', title: 'Booking Venues', desc: 'Online booking, reminders, client portal, deposits.' },
  { icon: '🤖', title: 'AI Agents', desc: 'Automate ops, digest reports, smart alerts.', soon: true },
]

export default function VerticalsSection() {
  return (
    <section id="verticals">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Verticals</span>
            <h2 className="section-title">
              Built for the businesses<br />
              <span className="grad-text">that make the world run.</span>
            </h2>
            <p className="section-sub">
              Every industry has its own quirks. We don&apos;t force a generic app on you — we
              build for how your business actually operates.
            </p>
          </div>
        </FadeIn>

        <div className="verticals-grid">
          {VERTICALS.map((v, i) => (
            <FadeIn key={v.title} delay={i * 80}>
              <TiltCard className="vertical-card">
                <span className="vert-icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
                {v.soon && <span className="badge-soon">Coming Soon</span>}
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
