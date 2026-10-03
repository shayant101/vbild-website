import FadeIn from '../FadeIn'
import TiltCard from '../TiltCard'
import { publicProjects, STATUS_LABEL } from '@/lib/data/portfolio'

export default function WorkSection() {
  const projects = publicProjects()
  return (
    <section id="portfolio">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Our work</span>
            <h2 className="section-title">
              Real apps. Real businesses.<br />
              <span className="grad-text">Shipped, not mocked.</span>
            </h2>
            <p className="section-sub">Every build below is in production or in active delivery for a paying business. Clients who prefer anonymity are shown by vertical only.</p>
          </div>
        </FadeIn>
        <div className="portfolio-grid">
          {projects.map((p, i) => (
            <FadeIn key={p.id} delay={i * 80}>
              <TiltCard className="port-card">
                <div className="port-img">
                  <div className="port-img-bg" style={{ background: `linear-gradient(135deg, ${p.accent}22 0%, ${p.accent}66 100%)` }} />
                  <span className="port-emoji">{p.emoji}</span>
                  <span className="port-tag">{p.vertical}</span>
                  <span className={`port-status ${p.status}`}>{STATUS_LABEL[p.status]}{p.daysToShip ? ` · ${p.daysToShip}d` : ''}</span>
                </div>
                <div className="port-body">
                  <h3>{p.name}</h3>
                  <p className="port-client">{p.client}</p>
                  <p>{p.summary}</p>
                  <div className="port-feats">{p.features.slice(0, 4).map((f) => <span className="port-feat" key={f}>{f}</span>)}</div>
                  {p.links?.live ? (
                    <a href={p.links.live} className="port-link" target="_blank" rel="noreferrer">Open live app ↗</a>
                  ) : (
                    <a href="#cta" className="port-link">Build something similar →</a>
                  )}
                </div>
              </TiltCard>
            </FadeIn>
          ))}
          <FadeIn delay={projects.length * 80}>
            <TiltCard className="port-card">
              <div className="port-img">
                <div className="port-img-bg" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }} />
                <span className="port-emoji">✦</span>
                <span className="port-tag">Your business</span>
              </div>
              <div className="port-body">
                <h3>Something we haven&apos;t built yet</h3>
                <p className="port-client">Any vertical · any stack</p>
                <p>Describe it in the demo above or in a 5-minute Bildr interview. You&apos;ll get a spec and a clickable prototype before we ever talk pricing.</p>
                <div className="port-feats"><span className="port-feat">Free scoping</span><span className="port-feat">Spec in minutes</span><span className="port-feat">You own the code</span></div>
                <a href="/start" className="port-link">Start a 5-minute interview →</a>
              </div>
            </TiltCard>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
