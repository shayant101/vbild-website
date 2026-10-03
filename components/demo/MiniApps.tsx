'use client'

import { Fragment, useMemo, useState } from 'react'
import type { Spec } from './scenarios'

type Props = { spec: Spec; screen: number; setScreen: (n: number) => void; onToast: (msg: string) => void }

/* ───────────── Restaurant: TableSync ───────────── */
export function RestaurantApp({ spec, screen, setScreen, onToast }: Props) {
  const [tables, setTables] = useState([
    { t: '5:30', name: 'Alvarez ×2', s: 'seated' }, { t: '6:00', name: 'Chen ×4', s: 'seated' }, { t: '6:15', name: 'Okafor ×6', s: 'deposit' },
    { t: '7:00', name: 'Open', s: 'open' }, { t: '7:30', name: 'Patel ×8', s: 'deposit' }, { t: '8:00', name: 'Open', s: 'open' },
  ])
  const [party, setParty] = useState(6)
  const [confirm, setConfirm] = useState(false)
  const booked = tables.filter((x) => x.s !== 'open').length
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Book a table</span></div>
        <div className="ma-body">
          <div className="ma-lbl">Party size</div>
          <div className="ma-row">{[2, 4, 6, 8].map((n) => <button key={n} className={`ma-pill${party === n ? ' on' : ''}`} onClick={() => setParty(n)}>{n}</button>)}</div>
          <div className="ma-lbl">Tonight</div>
          <div className="ma-row">{['7:00', '7:15', '8:00', '8:30'].map((t) => <button key={t} className="ma-pill" onClick={() => setConfirm(true)}>{t}</button>)}</div>
          {confirm && (
            <div className="ma-card acc">
              <b>{party >= 6 ? `Deposit required: $${party * 10}` : 'No deposit needed'}</b>
              <p>{party >= 6 ? 'Parties of 6+ hold with a card. Refunded at seating.' : 'We\'ll text a reminder 2 hours before.'}</p>
              <button className="ma-btn" onClick={() => {
                setTables((ts) => { const i = ts.findIndex((x) => x.s === 'open'); if (i < 0) return ts; return ts.map((x, j) => j === i ? { t: x.t, name: `Walk-in ×${party}`, s: party >= 6 ? 'deposit' : 'booked' } : x) })
                setConfirm(false); setScreen(0); onToast(party >= 6 ? 'Deposit captured · kitchen heads-up at T-10' : 'Reservation confirmed · SMS sent')
              }}>
                {party >= 6 ? 'Pay deposit & book' : 'Book table'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Owner</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>{booked}/6</b><span>tables tonight</span></div><div><b>$140</b><span>deposits held</span></div><div><b>0</b><span>no-shows</span></div></div>
          <div className="ma-lbl">Nightly digest</div>
          <div className="ma-card"><p>Covers up 18% vs last Friday. Two parties of 8 at 7:30 — kitchen heads-up scheduled 7:20. Toast sync OK.</p></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Back to floor</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>{spec.appName}</b><span>Tonight · {spec.scenario === 'restaurant' ? 'Fri' : ''}</span></div>
      <div className="ma-body">
        <div className="ma-list">
          {tables.map((x, i) => (
            <div key={i} className={`ma-li ${x.s}`}><span className="ma-t">{x.t}</span><span>{x.name}</span><em>{x.s === 'open' ? 'open' : x.s === 'deposit' ? 'deposit ✓' : x.s}</em></div>
          ))}
        </div>
        <div className="ma-row">
          <button className="ma-btn" onClick={() => setScreen(1)}>+ Book a table</button>
          <button className="ma-btn ghost" onClick={() => setScreen(2)}>Owner view</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Smoke shop: ShopBoard ───────────── */
export function SmokeShopApp({ spec, screen, setScreen, onToast }: Props) {
  const [verified, setVerified] = useState(false)
  const [cart, setCart] = useState<string[]>([])
  const [pts, setPts] = useState(240)
  const items = useMemo(() => [
    { n: 'Glass pipe — 5"', p: 24, stock: 12 }, { n: 'Rolling papers', p: 4, stock: 3 }, { n: 'Grinder 4pc', p: 18, stock: 7 }, { n: 'Disposable vape', p: 22, stock: 2 }, { n: 'Hemp wraps', p: 6, stock: 40 }, { n: 'Torch lighter', p: 15, stock: 9 },
  ], [])
  const total = cart.reduce((s, n) => s + (items.find((i) => i.n === n)?.p ?? 0), 0)
  if (!verified) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Age verification</span></div>
        <div className="ma-body center">
          <div className="ma-big">21+</div>
          <p className="ma-muted">Scan ID or confirm date of birth to continue.</p>
          <button className="ma-btn" onClick={() => { setVerified(true); onToast('ID verified · 21+') }}>Scan ID</button>
        </div>
      </div>
    )
  }
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Owner · 2 stores</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>$1,284</b><span>today</span></div><div><b>61</b><span>orders</span></div><div><b>2</b><span>low stock</span></div></div>
          <div className="ma-lbl">Low-stock alerts</div>
          <div className="ma-list">
            {items.filter((i) => i.stock <= 3).map((i) => <div key={i.n} className="ma-li deposit"><span>{i.n}</span><em>{i.stock} left · SMS sent</em></div>)}
          </div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Back to menu</button>
        </div>
      </div>
    )
  }
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Cart</span></div>
        <div className="ma-body">
          <div className="ma-list">{cart.length === 0 ? <p className="ma-muted">Cart is empty.</p> : cart.map((n, i) => <div key={i} className="ma-li"><span>{n}</span><em>${items.find((x) => x.n === n)?.p}</em></div>)}</div>
          <div className="ma-card acc"><b>Total ${total}</b><p>Earn {total} points · you have {pts}</p>
            <button className="ma-btn" disabled={!cart.length} onClick={() => { setPts((p) => p + total); setCart([]); setScreen(0); onToast(`Paid $${total} · +${total} pts`) }}>Pay with card</button></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Keep shopping</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>{spec.appName}</b><span>⭐ {pts} pts</span></div>
      <div className="ma-body">
        <div className="ma-grid">
          {items.map((i) => (
            <button key={i.n} className="ma-prod" onClick={() => { setCart((c) => [...c, i.n]); onToast(`Added ${i.n}`) }}>
              <span className="ma-prod-n">{i.n}</span><span className="ma-prod-p">${i.p}</span>{i.stock <= 3 && <span className="ma-low">low</span>}
            </button>
          ))}
        </div>
        <div className="ma-row">
          <button className="ma-btn" onClick={() => setScreen(1)}>Cart ({cart.length}) · ${total}</button>
          <button className="ma-btn ghost" onClick={() => setScreen(2)}>Owner</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── VR arena: StationBook ───────────── */
export function VRApp({ spec, screen, setScreen, onToast }: Props) {
  const [slot, setSlot] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const [booked, setBooked] = useState<string[]>(['S2·6:00', 'S5·6:30', 'S1·7:00'])
  const slots = ['6:00', '6:30', '7:00', '7:30']
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Deposit & waiver</span></div>
        <div className="ma-body">
          <div className="ma-card"><b>{slot ?? 'Station · time'}</b><p>45-min session · 4 players · $120 · deposit $30</p></div>
          <div className="ma-card" style={{ borderStyle: 'dashed' }}>
            <p className="ma-muted">I understand VR play involves physical movement and I accept the venue rules.</p>
            <button className={`ma-btn ${signed ? 'ghost' : ''}`} onClick={() => { setSigned(true); onToast('Waiver signed · timestamped') }}>{signed ? 'Signed ✓' : 'Sign with finger'}</button>
          </div>
          <button className="ma-btn" disabled={!signed} onClick={() => { if (slot) setBooked((b) => [...b, slot.replace(' ', '·')]); setScreen(2); onToast('Deposit $30 captured · QR pass sent') }}>Pay $30 deposit</button>
        </div>
      </div>
    )
  }
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>GM dashboard</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>{Math.round((booked.length / 32) * 100 + 40)}%</b><span>utilization</span></div><div><b>{booked.length}</b><span>bookings</span></div><div><b>$90</b><span>deposits</span></div></div>
          <div className="ma-lbl">Your QR pass</div>
          <div className="ma-qr" aria-hidden>{Array.from({ length: 49 }).map((_, i) => <i key={i} style={{ opacity: ((i * 7) % 5) > 1 ? 1 : 0.15 }} />)}</div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Back to slots</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>{spec.appName}</b><span>Pick a slot</span></div>
      <div className="ma-body">
        <div className="ma-slotgrid">
          <div />{slots.map((t) => <div key={t} className="ma-sh">{t}</div>)}
          {['S1', 'S2', 'S3', 'S4', 'S5'].map((s) => (
            <Fragment key={s}>
              <div className="ma-sh">{s}</div>
              {slots.map((t) => { const k = `${s}·${t}`; const taken = booked.includes(k); const on = slot === `${s} ${t}`
                return <button key={k} disabled={taken} className={`ma-slot${taken ? ' taken' : ''}${on ? ' on' : ''}`} onClick={() => setSlot(`${s} ${t}`)} /> })}
            </Fragment>
          ))}
        </div>
        <button className="ma-btn" disabled={!slot} onClick={() => setScreen(1)}>{slot ? `Book ${slot} →` : 'Select a slot'}</button>
      </div>
    </div>
  )
}

/* ───────────── Ranch: RanchGate ───────────── */
export function RanchApp({ spec, screen, setScreen, onToast }: Props) {
  const [guests, setGuests] = useState([
    { n: 'Ahmed family ×5', paid: true, in: true }, { n: 'Siddiqui ×3', paid: true, in: false }, { n: 'Khan ×7', paid: false, in: false }, { n: 'Rahman ×2', paid: true, in: false }, { n: 'Malik ×4', paid: false, in: false },
  ])
  const [offline, setOffline] = useState(false)
  const [queue, setQueue] = useState(0)
  const checkedIn = guests.filter((g) => g.in).reduce((s, g) => s + Number(g.n.split('×')[1]), 0)
  const collected = guests.filter((g) => g.paid).reduce((s, g) => s + Number(g.n.split('×')[1]) * 25, 0)
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Organizer report</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>{checkedIn}</b><span>checked in</span></div><div><b>${collected}</b><span>collected</span></div><div><b>{guests.filter((g) => !g.paid).length}</b><span>unpaid</span></div></div>
          <div className="ma-card"><p>Share link copied for the family group. CSV export ready. {queue > 0 ? `${queue} offline check-ins synced.` : 'All check-ins synced.'}</p></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Back to gate</button>
        </div>
      </div>
    )
  }
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Guest list</span></div>
        <div className="ma-body">
          <div className="ma-list">
            {guests.map((g, i) => (
              <div key={g.n} className={`ma-li ${g.in ? 'seated' : g.paid ? 'deposit' : ''}`}>
                <span>{g.n}</span>
                <em>{g.in ? 'in ✓' : <button className="ma-mini" onClick={() => { setGuests((gs) => gs.map((x, j) => j === i ? { ...x, in: true, paid: true } : x)); if (offline) setQueue((q) => q + 1); onToast(g.paid ? 'Checked in' : 'Collected $' + Number(g.n.split('×')[1]) * 25 + ' · checked in') }}>{g.paid ? 'Check in' : 'Collect & check in'}</button>}</em>
              </div>
            ))}
          </div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Gate</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>{spec.appName}</b><span className={offline ? 'ma-off' : ''}>{offline ? `offline · ${queue} queued` : 'online'}</span></div>
      <div className="ma-body center">
        <div className="ma-scan"><div className="ma-scanline" /></div>
        <p className="ma-muted">Point at a guest&apos;s QR ticket</p>
        <div className="ma-row">
          <button className="ma-btn" onClick={() => { const i = guests.findIndex((g) => !g.in); if (i >= 0) { setGuests((gs) => gs.map((x, j) => j === i ? { ...x, in: true, paid: true } : x)); if (offline) setQueue((q) => q + 1); onToast(`${guests[i].n} checked in${offline ? ' (queued)' : ''}`) } }}>Simulate scan</button>
          <button className="ma-btn ghost" onClick={() => setScreen(1)}>Guest list</button>
        </div>
        <button className="ma-link" onClick={() => { setOffline((o) => !o); if (offline) { onToast(`Back online · ${queue} synced`); setQueue(0) } else onToast('Signal lost · working offline') }}>{offline ? 'Restore signal' : 'Simulate lost signal'}</button>
        <button className="ma-link" onClick={() => setScreen(2)}>Organizer report →</button>
      </div>
    </div>
  )
}

export function MiniApp(props: Props) {
  switch (props.spec.scenario) {
    case 'smokeshop': return <SmokeShopApp {...props} />
    case 'vr': return <VRApp {...props} />
    case 'ranch': return <RanchApp {...props} />
    default: return <RestaurantApp {...props} />
  }
}
