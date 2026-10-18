import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import ScanBox from '@/components/scan/ScanBox'
import { CATEGORIES } from '@/lib/data/categories'

export const metadata: Metadata = {
  title: 'Vbild Scan — paste your Google profile, see the app we\'d build',
  description: 'Free 30-second analysis of any small business: what to automate, what app to build, what we\'ve built for businesses like yours. No sign-up.',
  openGraph: { title: 'Vbild Scan', description: 'Paste your Google Business Profile. See the app we\'d build for you.', url: 'https://vbild.ai/scan', siteName: 'Vbild', type: 'website' },
}

export default function ScanLanding() {
  return (
    <>
      <NavBar />
      <main className="scan-landing">
        <section className="scan-hero">
          <div className="container">
            <FadeIn>
              <span className="hero-badge"><span className="pulse-dot" />Free · 30 seconds · no sign-up</span>
              <h1>Paste your Google Business Profile.<br /><span className="grad-text">See the app we&apos;d build for you.</span></h1>
              <p className="scan-lede">We read your Google profile, your website, your reviews and your speed, then show you exactly what to automate, what it would cost, and what we&apos;ve built for businesses like yours. With a working prototype.</p>
              <ScanBox />
            </FadeIn>
          </div>
        </section>
        <section className="scan-how">
          <div className="container">
            <div className="scan-steps">
              {[['1', 'We read', 'Google profile, website, recent reviews, mobile speed, and the tools you already use.'], ['2', 'We diagnose', '30 rules check presence, bookings or ordering, reviews, automation and speed. No guesses.'], ['3', 'We show', 'Your score, the three things to build, what they\'d cost, and a prototype with your name on it.']].map(([n, t, d]) => (
                <div key={n} className="scan-step"><span>{n}</span><b>{t}</b><p>{d}</p></div>
              ))}
            </div>
            <div className="scan-cats">
              {CATEGORIES.map((c) => <div key={c.id} className="scan-cat" style={{ ['--acc' as string]: c.accent }}><b>{c.name}</b><span>{c.line}</span><small>{c.subs.map((s) => s.label).join(' · ')}</small></div>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
