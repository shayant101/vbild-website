'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HeroCanvas from '../HeroCanvas'
import MagneticButton from '../MagneticButton'
import Hero3DLoader from '../Hero3DLoader'
import { TYPEWRITER_WORDS } from '@/lib/data/categories'
import ScanBox from '@/components/scan/ScanBox'

const WORDS = TYPEWRITER_WORDS

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
          Paste your Google Business Profile or website. In 30 seconds you&apos;ll see what to automate, what we&apos;d build, and a prototype with your name on it.
        </p>

        <div className="hero-scan"><ScanBox placeholder="Google Maps link, website, or business name" /></div>

        <div className="hero-actions" style={{ marginTop: '1.4rem' }}>
          <MagneticButton href="#demo" className="btn-ghost">▶ Or watch a 60-second build</MagneticButton>
        </div>

        <Link href="/new-world" className="hero-new-world-link">
          <span className="hero-nw-orb" />
          Enter the New World
          <span className="hero-nw-arrow">→</span>
        </Link>

        <ul className="hero-proof">
          <li><b>5</b> apps live</li>
          <li><b>3</b> categories · <b>14</b> verticals</li>
          <li><b>3–21</b> days to ship</li>
          <li><b>100%</b> code ownership</li>
        </ul>
      </div>
    </section>
  )
}
