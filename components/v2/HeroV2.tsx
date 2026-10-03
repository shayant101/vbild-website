'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HeroCanvas from '../HeroCanvas'
import MagneticButton from '../MagneticButton'
import Hero3DLoader from '../Hero3DLoader'

const WORDS = ['restaurant', 'smoke shop', 'VR arena', 'ranch', 'booking venue', 'small business']

export default function HeroV2() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const target = WORDS[wordIndex]
    if (!deleting && displayed.length < target.length) timeoutRef.current = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 85)
    else if (!deleting && displayed.length === target.length) timeoutRef.current = setTimeout(() => setDeleting(true), 2000)
    else if (deleting && displayed.length > 0) timeoutRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45)
    else if (deleting && displayed.length === 0) { setDeleting(false); setWordIndex((i) => (i + 1) % WORDS.length) }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [displayed, deleting, wordIndex])

  return (
    <section id="hero">
      <div className="hero-glow-1" />
      <div className="hero-glow-2" />
      <HeroCanvas />
      <div className="hero-3d-wrap" aria-hidden><Hero3DLoader /></div>

      <div className="hero-content">
        <div className="hero-badge">
          <span className="pulse-dot" />
          Member of Claude for Startups · Delaware C-corp
        </div>

        <h1 className="hero-headline">
          <span className="line1">Custom apps for your</span>
          <span className="line2"><span className="type-target">{displayed}</span><span className="type-cursor" /></span>
          <span className="line1">built by AI in days.</span>
        </h1>

        <p className="hero-sub">
          We interview the owner, write the spec, and ship a working app you own — the kind agencies quote
          $38K–$171K and a year for — from $3,500 plus a simple monthly.
        </p>

        <div className="hero-actions">
          <MagneticButton href="#demo" className="btn-primary">▶ Watch a 60-second build</MagneticButton>
          <MagneticButton href="https://cal.com/shayan-vbild/discovery-call" className="btn-ghost">Book a build call</MagneticButton>
        </div>

        <Link href="/new-world" className="hero-new-world-link">
          <span className="hero-nw-orb" />
          Enter the New World
          <span className="hero-nw-arrow">→</span>
        </Link>

        <ul className="hero-proof">
          <li><b>5</b> apps live</li>
          <li><b>5</b> verticals</li>
          <li><b>3–21</b> days to ship</li>
          <li><b>100%</b> code ownership</li>
        </ul>
      </div>
    </section>
  )
}
