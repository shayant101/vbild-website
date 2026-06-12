'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Verticals', href: '#verticals' },
  { label: 'Work', href: '#portfolio' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Pay', href: '#pay' },
]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <span className="nav-logo">Vbild</span>
        <ul className="nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <Link href="/new-world" className="nav-new-world">
            <span className="nav-nw-dot" />
            New World
          </Link>
          <a href="#cta" className="nav-cta">Get Started</a>
        </div>
        <button
          className="hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
        <Link href="/new-world" className="mobile-new-world" onClick={() => setMenuOpen(false)}>
          ✦ New World
        </Link>
        <a href="#cta" onClick={() => setMenuOpen(false)}>Get Started</a>
      </div>
    </>
  )
}
