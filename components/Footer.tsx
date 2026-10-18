import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <span className="footer-logo">Vbild</span>
      <p>© 2026 Vbild Inc. · Building apps for the businesses that make the world run.</p>
      <ul className="footer-links">
        <li><Link href="/demo">Demo</Link></li>
        <li><Link href="/#portfolio">Work</Link></li>
        <li><Link href="/#pricing">Pricing</Link></li>
        <li><Link href="/investors">Investors</Link></li>
        <li><Link href="/admin">Team</Link></li>
        <li><a href="mailto:hello@vbild.ai">hello@vbild.ai</a></li>
      </ul>
    </footer>
  )
}
