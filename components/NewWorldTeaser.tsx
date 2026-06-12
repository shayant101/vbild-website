'use client'

import Link from 'next/link'

export default function NewWorldTeaser() {
  return (
    <section id="new-world-teaser">
      <div className="container">
        <div className="nwt-inner">

          {/* ── Left: copy ── */}
          <div className="nwt-text">
            <span className="section-label">The New World</span>
            <h2 className="nwt-headline">
              Same primitives.<br />
              Different software.<br />
              <span className="grad-text2">Yours.</span>
            </h2>
            <p className="nwt-sub">
              AI didn&apos;t just speed up development — it changed what
              software can be. Living, adaptive interfaces that know your
              business. Built in days, not months. And owned by you.
            </p>
            <Link href="/new-world" className="nwt-cta">
              <span className="nwt-cta-orb" />
              Enter the New World
              <span className="nwt-cta-arrow">→</span>
            </Link>
          </div>

          {/* ── Right: mini app preview ── */}
          <div className="nwt-preview" aria-hidden>
            <div className="nwt-frame">
              {/* title bar */}
              <div className="nwt-frame-bar">
                <span className="nwt-dot red" />
                <span className="nwt-dot amber" />
                <span className="nwt-dot green" />
                <span className="nwt-bar-title">your.app</span>
              </div>
              {/* nav */}
              <div className="nwt-frame-nav">
                <span className="nwt-nav-pill active">Dashboard</span>
                <span className="nwt-nav-pill">Guests</span>
                <span className="nwt-nav-pill">Payments</span>
                <span className="nwt-nav-pill">Reports</span>
              </div>
              {/* stats row */}
              <div className="nwt-stats-row">
                <div className="nwt-sc"><span className="nwt-sc-num">342</span><span className="nwt-sc-lbl">Bookings</span></div>
                <div className="nwt-sc"><span className="nwt-sc-num">$18k</span><span className="nwt-sc-lbl">Revenue</span></div>
                <div className="nwt-sc"><span className="nwt-sc-num">97%</span><span className="nwt-sc-lbl">Satisfaction</span></div>
              </div>
              {/* animated progress bar */}
              <div className="nwt-prog-wrap">
                <div className="nwt-prog-fill" />
              </div>
              {/* booking rows */}
              <div className="nwt-rows">
                <div className="nwt-row"><span className="nwt-row-dot cyan"/>Table 4 &middot; Dinner for 6<span className="nwt-badge ok">Confirmed</span></div>
                <div className="nwt-row"><span className="nwt-row-dot purple"/>Table 7 &middot; Anniversary<span className="nwt-badge pending">Pending</span></div>
                <div className="nwt-row"><span className="nwt-row-dot indigo"/>Private &middot; Corp event<span className="nwt-badge ok">Confirmed</span></div>
              </div>
              {/* ambient glow */}
              <div className="nwt-frame-glow" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
