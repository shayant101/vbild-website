'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { label: 'Demo', href: '/#demo' },
  { label: 'Work', href: '/#portfolio' },
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Investors', href: '/investors' },
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
          <ThemeToggle />
          <Link href="/new-world" className="nav-new-world">
            <span className="nav-nw-dot" />
            New World
          </Link>
          <a href="https://cal.com/shayan-vbild/discovery-call" className="nav-cta" target="_blank" rel="noreferrer">Book a call</a>
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
        <a href="https://cal.com/shayan-vbild/discovery-call" onClick={() => setMenuOpen(false)}>Book a call</a>
      </div>
    </>
  )
}
