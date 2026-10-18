import FadeIn from './FadeIn'

const STEPS = [
  {
    num: '01',
    title: 'Talk to Bildr for 5 minutes',
    desc: 'Our AI interviewer asks what you do and where it breaks, then drafts a spec and a clickable prototype on the spot. A human call follows if you want one.',
  },
  {
    num: '02',
    title: 'We build with Claude, you review daily',
    desc: 'Spec → schema → screens → integrations, generated and reviewed by our engineers. Builds so far have shipped in 3–21 days.',
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
