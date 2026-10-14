import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import LiveDemo from '@/components/demo/LiveDemo'
import { CATEGORIES, CATEGORY_BY_ID, TIERS, type CategoryId } from '@/lib/data/categories'
import { PROJECTS } from '@/lib/data/portfolio'
import type { ScenarioId } from '@/components/demo/scenarios'

export function generateStaticParams() { return CATEGORIES.map((c) => ({ category: c.id })) }

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const c = CATEGORY_BY_ID[category as CategoryId]
  if (!c) return {}
  return { title: `Custom apps for ${c.name} — ${c.line} | Vbild`, description: c.promise, openGraph: { title: `Vbild for ${c.name}`, description: c.promise, url: `https://vbild.ai/for/${c.id}` } }
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const c = CATEGORY_BY_ID[category as CategoryId]
  if (!c) notFound()
  const examples = PROJECTS.filter((p) => c.subs.some((s) => s.example === p.id))
  const firstDemo = c.subs.find((s) => s.demo)?.demo as ScenarioId | undefined
  const others = CATEGORIES.filter((x) => x.id !== c.id)
  return (
    <>
      <NavBar />
      <main className="catpage" style={{ ['--acc' as string]: c.accent }}>
        <section className="catpage-hero">
          <div className="catpage-hero-img" style={{ backgroundImage: `url(${c.image})` }} role="img" aria-label={c.imageAlt} />
          <div className="container catpage-hero-inner">
            <FadeIn>
              <span className="section-label">Vbild for {c.name}</span>
              <h1>{c.line}<br /><span className="grad-text">Custom apps for {c.name === 'Pros' ? 'the trades, agents and stylists' : c.name === 'Places' ? 'restaurants and shops' : 'arenas, ranches and event spaces'}.</span></h1>
              <p className="catpage-lede">{c.promise}</p>
              <div className="hero-actions">
                <a href="#demo" className="btn-primary">▶ Watch a {c.name.toLowerCase()} app get built</a>
                <a href="https://cal.com/shayan-vbild/discovery-call" className="btn-ghost" target="_blank" rel="noreferrer">Book a build call</a>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="catpage-jobs">
          <div className="container">
            <FadeIn><div className="text-center"><span className="section-label">What the app does</span><h2 className="section-title">Six jobs, shaped to your {c.noun}.</h2></div></FadeIn>
            <div className="jobs-grid">
              {c.jobs.map((j, i) => <FadeIn key={j} delay={i * 60}><div className="job-card"><span>{String(i + 1).padStart(2, '0')}</span><b>{j}</b></div></FadeIn>)}
            </div>
            <FadeIn delay={200}>
              <div className="subs-row">
                <span className="subs-label">Built for</span>
                {c.subs.map((s) => <span key={s.id} className="sub-chip">{s.label}</span>)}
                <span className="sub-chip more">+ anything with a {c.noun}</span>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="demo" className="demo-section">
          <div className="container">
            <FadeIn><div className="text-center"><span className="section-label">Live demo</span><h2 className="section-title">Watch it ship for a {c.name.toLowerCase().replace(/s$/, '')}.</h2></div></FadeIn>
            <FadeIn delay={100}><LiveDemo compact autoStart={firstDemo} /></FadeIn>
          </div>
        </section>

        {examples.length > 0 && (
          <section className="catpage-examples">
            <div className="container">
              <FadeIn><div className="text-center"><span className="section-label">Shipped</span><h2 className="section-title">Real {c.name.toLowerCase()} we&apos;ve built for.</h2></div></FadeIn>
              <div className="ex-grid">
                {examples.map((p, i) => (
                  <FadeIn key={p.id} delay={i * 80}>
                    <div className="ex-card"><span className="ex-emoji">{p.emoji}</span><div><b>{p.name}</b><small>{p.client} · {p.vertical}</small><p>{p.summary}</p>{p.links?.live && <a href={p.links.live} target="_blank" rel="noreferrer">Open live app ↗</a>}</div></div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="catpage-pricing">
          <div className="container">
            <FadeIn><div className="text-center"><span className="section-label">Pricing</span><h2 className="section-title">Same four plans for every {c.noun}.</h2><p className="section-sub">{c.id === 'pros' ? 'Start on Solo in five minutes. Upgrade to a custom build when the calendar outgrows it.' : 'One-time build fee plus a simple monthly. No contracts.'}</p></div></FadeIn>
            <div className="tiers-row">
              {TIERS.map((t) => (
                <div key={t.id} className={`tier-mini${t.featured ? ' featured' : ''}${t.selfServe ? ' solo' : ''}`}>
                  {t.badge && <span className="tier-badge">{t.badge}</span>}
                  <small>{t.name}</small>
                  <b>{t.setup === 0 ? '$0 setup' : `$${t.setup.toLocaleString()}`}</b>
                  <span>+ {t.monthlyLabel ?? `$${t.monthly}`}/mo</span>
                  <em>{t.who}</em>
                </div>
              ))}
            </div>
            <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
              <Link href="/#pricing" className="btn-ghost">Full pricing →</Link>
            </div>
          </div>
        </section>

        <section className="catpage-others">
          <div className="container">
            <div className="others-row">
              <span>Not a {c.noun} business?</span>
              {others.map((o) => <Link key={o.id} href={`/for/${o.id}`} style={{ ['--acc' as string]: o.accent }}><b>{o.name}</b> {o.line}</Link>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
