import Link from 'next/link'
import market from '@/lib/data/market.json'

const fmt = (n: number) => `$${(n / 1e9).toFixed(1)}B`

export default function InvestorStrip() {
  return (
    <div className="inv-strip">
      <div className="container inv-strip-inner">
        <span className="inv-strip-dot" />
        <span>Raising a <b>{market.company.raise.type.toLowerCase()}</b> round · {fmt(market.tamSamSom.tam.value)} US TAM across local-business verticals</span>
        <Link href="/investors">Investor overview →</Link>
      </div>
    </div>
  )
}
