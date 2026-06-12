'use client'

import { useState } from 'react'
import FadeIn from './FadeIn'

export default function CTASection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="cta">
      <div className="cta-glow" />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <span className="section-label">Get Started</span>
          <h2 className="section-title">
            Ready to build your app?<br />
            <span className="grad-text">Let&apos;s talk — free scoping call.</span>
          </h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>
            Drop your email and we&apos;ll reach out within one business day to schedule your
            free 30-minute scoping call. No sales pressure, no commitment.
          </p>

          {status === 'success' ? (
            <p style={{ marginTop: '2.5rem', color: 'var(--green)', fontWeight: 700, fontSize: '1.05rem' }}>
              ✅ Got it! We&apos;ll be in touch within one business day.
            </p>
          ) : (
            <form className="cta-form" onSubmit={handleSubmit}>
              <input
                className="cta-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending…' : "Let's talk →"}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.8rem' }}>
              Something went wrong. Email us directly at{' '}
              <a href="mailto:hello@vbild.ai" style={{ color: 'var(--indigo)' }}>hello@vbild.ai</a>
            </p>
          )}

          <p className="cta-note">No spam. No sales decks. Just a conversation.</p>
        </FadeIn>
      </div>
    </section>
  )
}
