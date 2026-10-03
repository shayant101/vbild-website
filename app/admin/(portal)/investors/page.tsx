import market from '@/lib/data/market.json'

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`

export default function InvestorRoom() {
  const t = market.company.traction
  return (
    <>
      <div className="admin-head">
        <div><h1>Investor room</h1><p>Internal view of the numbers behind /investors and the deck. Yellow = verify before sending externally.</p></div>
        <a className="chip on" href="/investors" target="_blank">Public investors page ↗</a>
      </div>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Raise</div><div className="kpi-value">{fmt(market.company.raise.min)}–{fmt(market.company.raise.max)}</div><div className="kpi-sub">{market.company.raise.type} · {market.company.raise.instrument}</div></div>
        <div className="kpi"><div className="kpi-label">Blended ACV</div><div className="kpi-value">${market.company.acv.blended.toLocaleString()}</div><div className="kpi-sub">mix {market.company.acv.mix}</div></div>
        <div className="kpi"><div className="kpi-label">TAM</div><div className="kpi-value">{fmt(market.tamSamSom.tam.value)}</div><div className="kpi-sub">{market.tamSamSom.tam.label}</div></div>
        <div className="kpi"><div className="kpi-label">SAM</div><div className="kpi-value">{fmt(market.tamSamSom.sam.value)}</div><div className="kpi-sub">{market.tamSamSom.sam.label}</div></div>
      </div>
      <div className="detail-grid">
        <div className="panel">
          <h3>Company metrics to confirm</h3>
          <dl className="kv">
            <div><dt>Paying customers</dt><dd>{t.payingCustomers.value ?? '—'}<span className="verify">VERIFY</span></dd></div>
            <div><dt>MRR</dt><dd>{t.mrr.value ?? '—'}<span className="verify">VERIFY</span></dd></div>
            <div><dt>Pipeline</dt><dd>{t.pipeline.value ?? '—'}<span className="verify">VERIFY</span></dd></div>
            <div><dt>Median days to ship</dt><dd>{t.medianDaysToShip.value}<span className="verify">VERIFY</span></dd></div>
            <div><dt>Live apps</dt><dd>{t.liveApps}</dd></div>
            <div><dt>In build</dt><dd>{t.inBuild}</dd></div>
          </dl>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>Edit <code>lib/data/market.json</code> → <code>company.traction</code> and the deck + /investors update together.</p>
        </div>
        <div className="panel">
          <h3>SOM scenarios (year 3)</h3>
          <ul>
            {market.tamSamSom.som.map((s) => <li key={s.scenario}><b>{s.scenario}</b>&nbsp;· {s.customers} customers × ${s.acv.toLocaleString()} = {fmt(s.revenue)} run-rate ({fmt(s.subArr)} subscription ARR)</li>)}
          </ul>
        </div>
      </div>
    </>
  )
}
