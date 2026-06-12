import FadeIn from './FadeIn'

export default function PaySection() {
  return (
    <section id="pay">
      <div className="container">
        <FadeIn>
          <div className="pay-banner">
            <div className="pay-banner-inner">
              <div>
                <span className="section-label">Ready to Start?</span>
                <h2 className="pay-title">
                  Pay securely.<br />
                  <span className="grad-text">Start building immediately.</span>
                </h2>
                <p className="pay-sub">
                  Already scoped your project with us? Pay your build deposit directly via Stripe
                  to kick off your build — no invoice delays, no wire transfers.
                </p>
                <ul className="pay-checks">
                  <li>✓ Encrypted &amp; PCI-compliant via Stripe</li>
                  <li>✓ Immediate build kickoff on receipt</li>
                  <li>✓ Not ready yet? <a href="#cta">Get a free scope call first →</a></li>
                </ul>
              </div>

              <div className="pay-card">
                <span className="pay-card-icon">💳</span>
                <span className="pay-card-label">Secure Payment</span>
                <span className="pay-card-note">Powered by Stripe</span>
                <a
                  href="https://buy.stripe.com/3cIdR95n5amdaOO7Hsf7i00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pay-btn"
                >
                  Pay via Stripe →
                </a>
                <span className="pay-secure">🔒 256-bit SSL encrypted</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
