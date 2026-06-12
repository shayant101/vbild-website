import FadeIn from './FadeIn'

const STEPS = [
  {
    num: '01',
    title: 'Tell us what you need',
    desc: 'Fill out the form or email us. We scope your app in a free 30-minute call — no obligation, no upsell.',
  },
  {
    num: '02',
    title: 'We design & build with AI',
    desc: 'Our AI-assisted process produces production-ready code in days. You review and approve at every stage.',
  },
  {
    num: '03',
    title: 'You go live',
    desc: 'We deploy to Vercel or Netlify, set up your custom domain, and hand you full source code ownership.',
  },
  {
    num: '04',
    title: 'We keep it running',
    desc: 'Monthly support, security patches, and feature requests — we\'re your ongoing dev team at SaaS pricing.',
  },
]

export default function HowSection() {
  return (
    <section id="how">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">How It Works</span>
            <h2 className="section-title">
              From idea to live app<br />
              <span className="grad-text">in under two weeks.</span>
            </h2>
          </div>
        </FadeIn>

        <div className="steps-wrap">
          {STEPS.map((s, i) => (
            <FadeIn key={s.num} delay={i * 100}>
              <div className="step-card">
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
