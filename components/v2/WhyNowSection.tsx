import FadeIn from '../FadeIn'
import market from '@/lib/data/market.json'

const pick = (id: string) => market.demand.find((d) => d.id === id)!
const src = (id: string) => (market.sources as Record<string, { title: string; url: string }>)[id]

export default function WhyNowSection() {
  const stats = [
    { d: pick('agency-cost'), head: 'What agencies charge', body: 'Median custom app build on Clutch. Average project runs ~13 months. Most small businesses never get a quote back.' },
    { d: pick('chaos'), head: 'How often it works', body: 'Share of software projects that finish on time, on budget, and on spec (Standish CHAOS). The rest overrun or get cancelled.' },
    { d: pick('ai-adoption'), head: 'Who\'s ready to buy', body: `US small businesses already using AI regularly — up from ${pick('ai-adoption').prior}. They want software that fits; they can't afford the old way of getting it.` },
  ]
  const q = market.quotes[1]
  return (
    <section id="why-now" className="whynow">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Why now</span>
            <h2 className="section-title">
              Small businesses were priced out of custom software.<br />
              <span className="grad-text">AI just changed the price.</span>
            </h2>
          </div>
        </FadeIn>
        <div className="whynow-grid">
          {stats.map((s, i) => (
            <FadeIn key={s.head} delay={i * 90}>
              <div className="whynow-card">
                <div className="whynow-num">{s.d.value}</div>
                <h3>{s.head}</h3>
                <p>{s.body}</p>
                <a className="whynow-src" href={src(s.d.source).url} target="_blank" rel="noreferrer">{src(s.d.source).title} ↗</a>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={200}>
          <blockquote className="whynow-quote">
            <p>&ldquo;{q.text}&rdquo;</p>
            <div className="whynow-quote-by">— {q.who} · <a href={src(q.source).url} target="_blank" rel="noreferrer">source ↗</a></div>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  )
}
