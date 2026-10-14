import Link from 'next/link'
import FadeIn from '../FadeIn'
import { CATEGORIES } from '@/lib/data/categories'

export default function CategoriesSection() {
  return (
    <section id="verticals" className="cats">
      <div className="container">
        <FadeIn>
          <div className="text-center">
            <span className="section-label">Who it&apos;s for</span>
            <h2 className="section-title">
              Three kinds of business.<br />
              <span className="grad-text">One way of building.</span>
            </h2>
            <p className="section-sub">Every business runs on a counter, a calendar, or a door. We build the app that runs yours.</p>
          </div>
        </FadeIn>
        <div className="cats-grid">
          {CATEGORIES.map((c, i) => (
            <FadeIn key={c.id} delay={i * 90}>
              <Link href={`/for/${c.id}`} className="cat-card" style={{ ['--acc' as string]: c.accent }}>
                <div className="cat-img" style={{ backgroundImage: `url(${c.image})` }} role="img" aria-label={c.imageAlt} />
                <div className="cat-body">
                  <div className="cat-head"><h3>{c.name}</h3><span>{c.line}</span></div>
                  <p>{c.who}</p>
                  <ul>{c.subs.map((s) => <li key={s.id}>{s.label}</li>)}</ul>
                  <span className="cat-link">See apps for {c.name.toLowerCase()} →</span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
