'use client'

import { useEffect, useRef, useState } from 'react'
import HeroCanvas from './HeroCanvas'
import MagneticButton from './MagneticButton'
import Hero3DLoader from './Hero3DLoader'

const WORDS = ['restaurant', 'smoke shop', 'gaming venue', 'ranch event', 'booking venue', 'business']

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const target = WORDS[wordIndex]

    if (!deleting && displayed.length < target.length) {
      timeoutRef.current = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 90)
    } else if (!deleting && displayed.length === target.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), 2200)
    } else if (deleting && displayed.length > 0) {
      timeoutRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 55)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setWordIndex((i) => (i + 1) % WORDS.length)
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [displayed, deleting, wordIndex])

  return (
    <section id="hero">
      <div className="hero-glow-1" />
      <div className="hero-glow-2" />
      <HeroCanvas />

      {/* 3D orb — right-side accent */}
      <div className="hero-3d-wrap" aria-hidden>
        <Hero3DLoader />
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <span className="pulse-dot" />
          AI-First · SMB-Focused · Live in Days
        </div>

        <h1 className="hero-headline">
          <span className="line1">Apps for every</span>
          <span className="line2">
            <span className="type-target">{displayed}</span>
            <span className="type-cursor" />
          </span>
        </h1>

        <p className="hero-sub">
          Custom business apps that agencies quote $50K for — built by AI in days, priced like
          SaaS. Built for the businesses that make the world run.
        </p>

        <div className="hero-actions">
          <MagneticButton href="#cta" className="btn-primary">Get Your App Built</MagneticButton>
          <MagneticButton href="#portfolio" className="btn-ghost">See Live Work ↓</MagneticButton>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">~10</span>
            <span className="stat-label">Days to Launch</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">90%</span>
            <span className="stat-label">Less than Agencies</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">6+</span>
            <span className="stat-label">Industries Served</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">$0</span>
            <span className="stat-label">Discovery Fee</span>
          </div>
        </div>
      </div>
    </section>
  )
}
