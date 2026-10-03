import Link from 'next/link'
import FadeIn from '../FadeIn'
import LiveDemo from '../demo/LiveDemo'

export default function DemoSection() {
  return (
    <section id="demo" className="demo-section">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Live demo</span>
            <h2 className="section-title">
              Don&apos;t read about it.<br />
              <span className="grad-text">Watch it ship.</span>
            </h2>
            <p className="section-sub">
              Pick a business. Vbild interviews the owner, writes the spec, builds, and deploys a working prototype you can click through — in about a minute, right here.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={120}>
          <LiveDemo compact />
          <div className="demo-section-foot">
            <Link href="/demo">Open the full-screen presenter version →</Link>
            <span>No sign-up. Works without an API key. Press 1–4 to switch businesses.</span>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
