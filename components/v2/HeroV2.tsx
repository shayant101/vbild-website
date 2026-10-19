'use client'

import HeroCanvas from '../HeroCanvas'
import Hero3DLoader from '../Hero3DLoader'
import ScanBox from '@/components/scan/ScanBox'

export default function HeroV2() {
  return (
    <section id="hero" className="hero-v3">
      <div className="hero-glow-1" />
      <div className="hero-glow-2" />
      <HeroCanvas />
      <div className="hero-3d-wrap" aria-hidden><Hero3DLoader /></div>

      <div className="hero-content">
        <div className="hero-badge"><span className="pulse-dot" />Free · 30 seconds · no sign-up</div>
        <h1 className="hero-headline hero-headline-v3">
          See the app we&apos;d build<br />for <span className="grad-text">your business.</span>
        </h1>
        <p className="hero-sub">Paste your Google Business Profile or website. We read it and show you what to automate, what it costs, and a prototype with your name on it.</p>
        <div className="hero-scan"><ScanBox placeholder="Google Maps link, website, or business name" /></div>
        <p className="hero-under">Custom apps for restaurants, shops, trades, salons and venues · from $39/mo · built in days, not months.</p>
      </div>
    </section>
  )
}
