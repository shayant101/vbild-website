import FadeIn from './FadeIn'

const CARDS = [
  { icon: '⚡', title: 'Done-for-you today', desc: 'We build custom apps for your business this week.' },
  { icon: '🧩', title: 'Platform tomorrow', desc: 'A self-serve builder so you can ship updates yourself.' },
  { icon: '🤖', title: 'AI agents in every SMB', desc: 'Automated ops, smart alerts, and AI assistants built in.' },
  { icon: '🌍', title: 'Any vertical, anywhere', desc: 'We expand to every industry that needs custom software.' },
]

export default function VisionSection() {
  return (
    <section id="vision">
      <div className="vision-bg-glow" />
      <div className="container">
        <div className="vision-inner">
          <FadeIn>
            <span className="section-label">Our Vision</span>
            <h2 className="section-title">
              We&apos;re building the{' '}
              <span className="grad-text">Wix for business apps.</span>
            </h2>
            <p className="section-sub">
              Today we build custom for you. Tomorrow, you build yourself on our platform. The
              end goal: every small business in the world runs on software made for them.
            </p>
          </FadeIn>

          <div className="vision-cards">
            {CARDS.map((c, i) => (
              <FadeIn key={c.title} delay={i * 90}>
                <div className="vis-card">
                  <div className="vis-icon">{c.icon}</div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
