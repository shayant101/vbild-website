'use client'

import { useState } from 'react'
import type { Spec } from './scenarios'

type Props = { spec: Spec; screen: number; setScreen: (n: number) => void; onToast: (msg: string) => void }

/* ───────────── Plumber: JobLine ───────────── */
export function PlumberApp({ spec, screen, setScreen, onToast }: Props) {
  const [jobs, setJobs] = useState([
    { t: '8:00', name: 'Nguyen · water heater', s: 'done', amt: 1450 }, { t: '10:30', name: 'Ortiz · leak under sink', s: 'enroute', amt: 320 },
    { t: '1:00', name: 'Baker · re-pipe quote', s: 'quote', amt: 0 }, { t: '3:30', name: 'Open slot', s: 'open', amt: 0 },
  ])
  const [lines, setLines] = useState([{ n: 'Re-pipe kitchen + bath', p: 4200 }, { n: 'Permit & inspection', p: 350 }])
  const [sent, setSent] = useState(false)
  const total = lines.reduce((s, l) => s + l.p, 0)
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Quote · Baker</span></div>
        <div className="ma-body">
          <div className="ma-list">
            {lines.map((l, i) => <div key={i} className="ma-li"><span>{l.n}</span><em>${l.p.toLocaleString()}</em></div>)}
            <button className="ma-mini" style={{ alignSelf: 'flex-start' }} onClick={() => setLines((ls) => [...ls, { n: 'Water heater flush', p: 180 }])}>+ Add line item</button>
          </div>
          <div className="ma-card acc">
            <b>Total ${total.toLocaleString()} · deposit ${(total * 0.3).toLocaleString()}</b>
            <p>Customer taps the link, pays 30% with Apple Pay, and the job lands on the calendar.</p>
            {!sent ? <button className="ma-btn" onClick={() => { setSent(true); onToast('Quote texted · deposit link live') }}>Text quote with deposit link</button>
              : <button className="ma-btn" onClick={() => { setJobs((js) => js.map((j) => j.s === 'open' ? { t: j.t, name: 'Baker · re-pipe (deposit ✓)', s: 'booked', amt: total } : j)); setScreen(0); onToast('Deposit $1,365 captured · job scheduled') }}>Simulate: customer pays deposit</button>}
          </div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Today</button>
        </div>
      </div>
    )
  }
  if (screen === 2) {
    const booked = jobs.filter((j) => j.s !== 'open')
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Owner</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>${booked.reduce((s, j) => s + j.amt, 0).toLocaleString()}</b><span>booked today</span></div><div><b>2</b><span>invoices sent</span></div><div><b>4.9★</b><span>31 reviews</span></div></div>
          <div className="ma-lbl">Missed-call receptionist</div>
          <div className="ma-card"><p>“Hi, this is Reyes Plumbing — sorry we missed you. Is this an emergency, or can I book you for tomorrow 9–11?” · 3 calls answered while you were under a sink.</p></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Today</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>{spec.appName}</b><span>Today · 2 trucks</span></div>
      <div className="ma-body">
        <div className="ma-list">
          {jobs.map((j, i) => (
            <div key={i} className={`ma-li ${j.s === 'done' ? 'seated' : j.s === 'booked' ? 'booked' : j.s === 'open' ? 'open' : j.s === 'quote' ? 'deposit' : ''}`}>
              <span className="ma-t">{j.t}</span><span>{j.name}</span>
              <em>{j.s === 'done' ? <button className="ma-mini" onClick={() => onToast('Invoice $1,450 sent · review request at 8pm')}>Send invoice</button> : j.s === 'quote' ? <button className="ma-mini" onClick={() => setScreen(1)}>Build quote</button> : j.s === 'enroute' ? 'en route' : j.s}</em>
            </div>
          ))}
        </div>
        <div className="ma-row">
          <button className="ma-btn" onClick={() => setScreen(1)}>New quote</button>
          <button className="ma-btn ghost" onClick={() => setScreen(2)}>Owner</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Landscaper: CrewRoute ───────────── */
export function LandscaperApp({ spec, screen, setScreen, onToast }: Props) {
  const [stops, setStops] = useState([
    { n: 'Alder Ct · weekly mow', crew: 'A', done: true }, { n: 'Maple Dr · weekly mow', crew: 'A', done: true }, { n: 'Hillside HOA · hedges', crew: 'B', done: false },
    { n: 'Pine St · aeration (upsell ✓)', crew: 'B', done: false }, { n: 'Lakeview · mulch', crew: 'C', done: false },
  ])
  const [rain, setRain] = useState(false)
  const done = stops.filter((s) => s.done).length
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Crew B · today</span></div>
        <div className="ma-body">
          <div className="ma-list">
            {stops.filter((s) => s.crew === 'B').map((s, i) => (
              <div key={i} className={`ma-li ${s.done ? 'seated' : ''}`}><span>{s.n}</span>
                <em>{s.done ? 'done ✓' : <button className="ma-mini" onClick={() => { setStops((ss) => ss.map((x) => x.n === s.n ? { ...x, done: true } : x)); onToast('Checked out · photos sent · card billed $85') }}>Check out + photo</button>}</em></div>
            ))}
          </div>
          <div className="ma-card"><p>GPS check-in at 9:12. Before/after photos go to the customer and the invoice charges their card on file automatically.</p></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Route board</button>
        </div>
      </div>
    )
  }
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Customer portal · Pine St</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>Thu</b><span>next visit</span></div><div><b>$85</b><span>per visit · auto</span></div><div><b>12</b><span>photos</span></div></div>
          <div className="ma-card acc"><b>Fall aeration + overseed · $240</b><p>Recommended for your lawn this month.</p><button className="ma-btn" onClick={() => onToast('Upsell accepted · added to next visit')}>Add to next visit</button></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Route board</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>{spec.appName}</b><span className={rain ? 'ma-off' : ''}>{rain ? 'rain day · rescheduled' : `${done}/${stops.length} stops done`}</span></div>
      <div className="ma-body">
        <div className="ma-list">
          {stops.map((s, i) => <div key={i} className={`ma-li ${s.done ? 'seated' : ''}`}><span className="ma-t">Crew {s.crew}</span><span>{s.n}</span><em>{s.done ? 'done ✓' : rain ? 'moved → Fri' : 'queued'}</em></div>)}
        </div>
        <div className="ma-row">
          <button className="ma-btn" onClick={() => setScreen(1)}>Open Crew B</button>
          <button className="ma-btn ghost" onClick={() => setScreen(2)}>Customer portal</button>
          <button className="ma-link" onClick={() => { setRain((r) => !r); onToast(rain ? 'Schedule restored' : 'Rain day: 140 customers texted, routes shifted to Friday') }}>{rain ? 'Undo rain day' : 'Simulate rain day'}</button>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Realtor: OpenDoor Desk ───────────── */
export function RealtorApp({ spec, screen, setScreen, onToast }: Props) {
  const [leads, setLeads] = useState([{ n: 'Jordan M.', ph: '…4821', pre: true, step: 'Day 2 text' }, { n: 'Alicia R.', ph: '…0932', pre: false, step: 'Day 0 listing sent' }])
  const [name, setName] = useState('')
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Leads · 14 Harbor Ln</span></div>
        <div className="ma-body">
          <div className="ma-list">
            {leads.map((l, i) => <div key={i} className={`ma-li ${l.pre ? 'seated' : 'deposit'}`}><span>{l.n} <span className="ma-muted">{l.ph}</span></span><em>{l.pre ? 'pre-approved · ' : ''}{l.step}</em></div>)}
          </div>
          <div className="ma-card"><p>Drip: day 0 listing + photos · day 2 “still thinking about Harbor Ln?” · day 7 comps · day 14 open-house invite · day 30 check-in. Pauses the moment they reply.</p></div>
          <button className="ma-btn" onClick={() => onToast('Showing booked · Sat 11:00 · synced to brokerage CRM')}>Book a showing for Jordan</button>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Sign-in kiosk</button>
        </div>
      </div>
    )
  }
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Seller report</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>{leads.length + 9}</b><span>visitors</span></div><div><b>3</b><span>repeat</span></div><div><b>2</b><span>showings booked</span></div></div>
          <div className="ma-card"><p>Feedback themes: “love the light”, “kitchen dated”. Suggested: stage the kitchen, hold price one more week.</p></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Sign-in kiosk</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>Harbor &amp; Vale</b><span>Open house · 14 Harbor Ln</span></div>
      <div className="ma-body center">
        <div className="ma-big" style={{ fontSize: '1.6rem' }}>Welcome in.</div>
        <p className="ma-muted">Sign in and we&apos;ll text you the listing and photos.</p>
        <input className="ma-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="ma-row">
          <button className="ma-btn" disabled={!name.trim()} onClick={() => { setLeads((ls) => [{ n: name.trim(), ph: '…' + String(1000 + ls.length * 137).slice(-4), pre: false, step: 'Day 0 listing sent' }, ...ls]); setName(''); onToast('Listing texted · 30-day follow-up started') }}>Sign in</button>
          <button className="ma-btn ghost" onClick={() => setScreen(1)}>Leads ({leads.length})</button>
        </div>
        <button className="ma-link" onClick={() => setScreen(2)}>Seller report →</button>
      </div>
    </div>
  )
}

/* ───────────── Salon: ChairBook ───────────── */
export function SalonApp({ spec, screen, setScreen, onToast }: Props) {
  const [stylist, setStylist] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [booked, setBooked] = useState(2)
  const stylists = ['Dev', 'Mia', 'Jonah', 'Ren']
  if (screen === 1) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Mia · today</span></div>
        <div className="ma-body">
          <div className="ma-list">
            <div className="ma-li seated"><span className="ma-t">10:00</span><span>Sam · balayage</span><em>done</em></div>
            <div className="ma-li booked"><span className="ma-t">1:00</span><span>Lena · cut + gloss</span><em><button className="ma-mini" onClick={() => onToast('Rebooked for Nov 24 · card on file')}>Rebook 6 wks</button></em></div>
            <div className="ma-li deposit"><span className="ma-t">3:30</span><span>Chris · color</span><em>reminder sent · card ✓</em></div>
          </div>
          <div className="ma-card"><p>Formula notes: Lena — 7N + 8G, 20 vol, 35 min. Photo from last visit attached.</p></div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Book a chair</button>
        </div>
      </div>
    )
  }
  if (screen === 2) {
    return (
      <div className="ma">
        <div className="ma-bar"><b>{spec.appName}</b><span>Owner · room view</span></div>
        <div className="ma-body">
          <div className="ma-stats"><div><b>{booked + 10}</b><span>bookings today</span></div><div><b>$75</b><span>no-show fees mo.</span></div><div><b>4/6</b><span>chairs busy</span></div></div>
          <div className="ma-lbl">Renter payouts (Stripe Connect)</div>
          <div className="ma-list">{['Mia · $412', 'Jonah · $290', 'Ren · $355'].map((r) => <div key={r} className="ma-li"><span>{r}</span><em>paid tonight</em></div>)}</div>
          <button className="ma-btn ghost" onClick={() => setScreen(0)}>← Book a chair</button>
        </div>
      </div>
    )
  }
  return (
    <div className="ma">
      <div className="ma-bar"><b>Studio Nine</b><span>Book a chair</span></div>
      <div className="ma-body">
        <div className="ma-lbl">Stylist</div>
        <div className="ma-row">{stylists.map((s) => <button key={s} className={`ma-pill${stylist === s ? ' on' : ''}`} onClick={() => setStylist(s)}>{s}</button>)}</div>
        <div className="ma-lbl">Thursday</div>
        <div className="ma-row">{['10:00', '11:30', '2:00', '4:30'].map((t) => <button key={t} className={`ma-pill${slot === t ? ' on' : ''}`} onClick={() => setSlot(t)}>{t}</button>)}</div>
        <div className="ma-card acc"><b>Cut + gloss · $140</b><p>Card on file holds your spot. $25 no-show fee, reminder 24h before.</p>
          <button className="ma-btn" disabled={!stylist || !slot} onClick={() => { setBooked((b) => b + 1); onToast(`Booked ${stylist} ${slot} · card on file`) }}>Book with card on file</button></div>
        <div className="ma-row"><button className="ma-btn ghost" onClick={() => setScreen(1)}>Stylist day</button><button className="ma-btn ghost" onClick={() => setScreen(2)}>Owner</button></div>
      </div>
    </div>
  )
}
