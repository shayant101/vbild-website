import Link from 'next/link'
import FadeIn from '../FadeIn'

export default function FounderSection() {
  return (
    <section id="founder" className="founder">
      <div className="container">
        <div className="founder-inner">
          <FadeIn>
            <div className="founder-card">
              <div className="founder-avatar">ST</div>
              <div>
                <h3>Shayan Toor</h3>
                <p className="founder-role">Founder &amp; CEO, Vbild · Chief Growth Officer, Innowi</p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="founder-text">
              <span className="section-label">Built by an operator</span>
              <h2 className="section-title">Vbild comes from inside the businesses it serves.</h2>
              <p>
                Shayan runs growth at Innowi, a restaurant-kiosk company that lives in the same payments and POS ecosystem Vbild&apos;s customers do.
                He has shipped five production apps for restaurants, a smoke shop, a VR arena and a working ranch, built AI tooling that runs inside Innowi&apos;s sales and content teams, and stood up a five-person AI developer cohort in Lahore to add delivery capacity.
              </p>
              <ul className="founder-facts">
                <li>Delaware C-corp, incorporated Sept 2025</li>
                <li>Member of Anthropic&apos;s Claude for Startups</li>
                <li>Mentor, Ember AI founding cohort</li>
                <li>Las Vegas · Southern California · Lahore</li>
              </ul>
              <div className="founder-links">
                <a href="https://www.linkedin.com/in/ssttoor" target="_blank" rel="noreferrer">LinkedIn ↗</a>
                <Link href="/investors">For investors →</Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
