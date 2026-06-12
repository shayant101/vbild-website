'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/* ─── types ───────────────────────────────────────────────────── */
type Rect = [number, number, number, number] // [left%, top%, width%, height%]

type CompSpec = {
  r: Rect
  v: string
  t: string
} | null

type Layout = {
  nav: CompSpec
  list: CompSpec
  calendar: CompSpec
  payment: CompSpec
  alert: CompSpec
  stats: CompSpec
  qr: CompSpec
  agegate: CompSpec
}

type Persona = {
  id: string
  chip: string
  app: string
  biz: string
  accent: string
  caption: string
  layout: Layout
}

/* ─── data ────────────────────────────────────────────────────── */
const PERSONAS: Persona[] = [
  {
    id: 'ranch', chip: 'Ranch owner', app: 'RanchOS', biz: 'Whitfield Ranch', accent: '#8b5cf6',
    caption: '<b>Reshaped for a ranch.</b> Guest list takes the floor, QR check-in steps forward, bulk payments sit one tap away — offline-ready for the back forty.',
    layout: {
      nav:      { r: [0, 0, 17, 100], v: 'sidebar',  t: 'RanchOS' },
      list:     { r: [19, 4, 43, 60], v: 'rows',      t: 'Guest List — Fall Roundup' },
      calendar: { r: [19, 68, 43, 28], v: 'strip',    t: 'Event Day' },
      qr:       { r: [64, 4, 34, 48],  v: 'qr',       t: 'QR Check-In' },
      payment:  { r: [64, 56, 34, 40], v: 'paycard',  t: 'Bulk Payments' },
      alert: null, stats: null, agegate: null,
    },
  },
  {
    id: 'resto', chip: 'Restaurant manager', app: 'TableSync', biz: 'Marrow Kitchen', accent: '#6366f1',
    caption: '<b>Reshaped for a restaurant.</b> The same list becomes tonight\'s reservation timeline, inventory alerts surface, and the daily digest docks itself in the corner.',
    layout: {
      nav:      { r: [0, 0, 100, 12], v: 'topbar',   t: 'TableSync' },
      list:     { r: [2, 16, 60, 50], v: 'timeline',  t: 'Tonight — Reservations' },
      alert:    { r: [2, 70, 60, 26], v: 'ticker',    t: 'Ops Digest' },
      stats:    { r: [64, 16, 34, 26], v: 'stats',    t: 'Tonight at a Glance' },
      calendar: { r: [64, 46, 34, 24], v: 'mini',     t: 'Covers This Week' },
      payment:  { r: [64, 74, 34, 22], v: 'paylines', t: 'Checks' },
      qr: null, agegate: null,
    },
  },
  {
    id: 'smoke', chip: 'Smoke shop clerk', app: 'ShopPilot', biz: 'Cloud 9 Smoke Co.', accent: '#7c3aed',
    caption: '<b>Reshaped for a smoke shop.</b> The list unfolds into a product grid with loyalty badges, the age-gate stands guard up front, and a POS keypad grows where the calendar used to be.',
    layout: {
      nav:      { r: [0, 90, 100, 10], v: 'tabs',    t: 'ShopPilot' },
      list:     { r: [2, 4, 56, 82],   v: 'grid',    t: 'Products — Floor Stock' },
      agegate:  { r: [60, 4, 38, 18],  v: 'gate',    t: 'Age Verification' },
      payment:  { r: [60, 26, 38, 46], v: 'keypad',  t: 'Point of Sale' },
      alert:    { r: [60, 76, 38, 10], v: 'bar',     t: 'Inventory' },
      calendar: null, stats: null, qr: null,
    },
  },
  {
    id: 'venue', chip: 'Venue operator', app: 'VenueFlow', biz: 'Aurora Studios', accent: '#818cf8',
    caption: '<b>Reshaped for a booking venue.</b> The calendar expands into a station grid, bookings queue on the right, deposits collect themselves, reminders go out without being asked.',
    layout: {
      nav:      { r: [0, 0, 17, 100],  v: 'sidebar',  t: 'VenueFlow' },
      calendar: { r: [19, 4, 50, 70],  v: 'slots',    t: 'Stations — Today' },
      list:     { r: [71, 4, 27, 44],  v: 'rows2',    t: 'Upcoming' },
      payment:  { r: [71, 52, 27, 28], v: 'paycard2', t: 'Deposits' },
      alert:    { r: [71, 84, 27, 12], v: 'bar2',     t: 'Reminders' },
      stats: null, qr: null, agegate: null,
    },
  },
]

const COMP_IDS = ['nav', 'list', 'calendar', 'payment', 'alert', 'stats', 'qr', 'agegate'] as const
type CompId = typeof COMP_IDS[number]

const CYCLE_MS = 5200
const RESUME_MS = 12000

/* ─── content generators ──────────────────────────────────────── */
function rowsHTML(data: [string, string, string, string][]) {
  return data.map(([a, b, cls, pill]) =>
    `<div class="li-row"><div><b>${a}</b><br/><span class="li-sub">${b}</span></div><span class="li-pill ${cls ? 'li-pill-' + cls : ''}">${pill}</span></div>`
  ).join('')
}
function cellsHTML(data: [string, string][], cols: number, filled: number[] = []) {
  return `<div class="li-cells" style="grid-template-columns:repeat(${cols},1fr)">` +
    data.map(([a, b], i) =>
      `<div class="li-cell ${filled.includes(i) ? 'li-cell-fill' : ''}"><b>${a}</b><small>${b}</small></div>`
    ).join('') + '</div>'
}
function payLinesHTML(data: [string, string][]) {
  return data.map(([a, b]) => `<div class="li-pay-line"><span>${a}</span><b>${b}</b></div>`).join('')
}
function navHTML(items: string[], _dir: string) {
  return items.map((x, i) =>
    `<div class="li-nav-item ${i === 0 ? 'on' : ''}"><span class="li-nd"></span>${x}</div>`
  ).join('')
}

function qrHTML() {
  let s = '<div class="li-qr-wrap"><div class="li-qr">'
  const pattern = [1,0,1,0,1,1,0,1,1, 0,1,0,1,0,1,0,1,0, 1,1,0,0,1,0,1,1,0, 0,0,1,1,0,1,0,0,1, 1,0,0,1,1,0,0,1,0, 0,1,1,0,0,1,1,0,1, 1,0,1,0,1,0,1,0,1, 0,1,0,1,0,1,0,1,0, 1,1,0,0,1,1,0,1,1]
  pattern.forEach(v => { s += `<i class="${v ? 'on' : ''}"></i>` })
  s += '</div><div class="li-qr-txt"><b>Scan to check in</b>Works offline. Syncs when the truck finds signal.</div></div>'
  return s
}

const CONTENT: Record<CompId, Record<string, () => string>> = {
  nav: {
    sidebar: () => navHTML(['Dashboard', 'Guests', 'Payments', 'Reports'], 'col'),
    topbar:  () => navHTML(['Floor', 'Reservations', 'Inventory', 'Digest'], 'row'),
    tabs:    () => navHTML(['Sell', 'Stock', 'Loyalty', 'Reports'], 'row'),
  },
  list: {
    rows:     () => rowsHTML([['Harlan family','6 guests','ok','Checked in'],['Reyes party','4 guests','','Paid'],['Bo Whitfield Jr.','2 guests','ok','Checked in'],['Cassidy group','8 guests','warn','Waiver due'],['Tran wedding block','12 guests','','Paid']]),
    timeline: () => rowsHTML([['6:30 — Okafor','table 4 · 2 top','ok','Confirmed'],['7:00 — Marchetti','table 9 · 6 top','ok','Confirmed'],['7:15 — walk-in hold','bar · 2','warn','Hold'],['8:00 — Liu anniversary','patio · 4','','Deposit paid'],['9:30 — kitchen close prep','staff','','Auto']]),
    grid:     () => cellsHTML([['Glass — Helix','$48 · 12'],['Papers — Organic','$6 · 88'],['Vape — Nimbus','$32 · 7'],['Grinder — Oak','$22 · 31'],['Tray — Slate','$18 · 19'],['Torch — Micro','$26 · 4']], 3, [2, 5]),
    rows2:    () => rowsHTML([['2:00 — Podcast A','Studio 1','ok','Paid'],['4:30 — Band rehearsal','Studio 2','warn','Deposit'],['7:00 — Video shoot','Stage','ok','Paid']]),
  },
  calendar: {
    strip: () => cellsHTML([['Gate open','9:00a'],['Check-in','10:00a'],['Lunch ride','12:30p'],['Bonfire','6:00p']], 4, [1]),
    mini:  () => cellsHTML([['Mon','64'],['Tue','71'],['Wed','58'],['Thu','92'],['Fri','128'],['Sat','141']], 3, [4, 5]),
    slots: () => cellsHTML([['S1 · 10a','booked'],['S1 · 1p','open'],['S1 · 4p','booked'],['S2 · 10a','booked'],['S2 · 1p','booked'],['S2 · 4p','open'],['Stage · 10a','open'],['Stage · 1p','hold'],['Stage · 4p','booked']], 3, [0, 2, 3, 4, 8]),
  },
  payment: {
    paycard:  () => payLinesHTML([['Collected today','$4,820'],['Pending','$1,140']]) + '<div class="li-pay-btn">Collect group payment →</div>',
    paylines: () => payLinesHTML([['Open checks','11'],['Avg check','$74'],['Tips pooled','$612']]),
    keypad:   () => '<div class="li-pad"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>0</span><span class="go">Charge $54.00</span></div>',
    paycard2: () => payLinesHTML([['Held in deposits','$2,300'],['Released this wk','$5,750']]) + '<div class="li-pay-btn">Request deposit →</div>',
  },
  alert: {
    ticker: () => rowsHTML([['86 the salmon','low stock','warn','Notify chefs'],['Walk-ins up 22%','vs last Fri','ok','Digest 7am']]),
    bar:    () => rowsHTML([['Nimbus vape','7 left','warn','Reorder']]),
    bar2:   () => rowsHTML([['3 reminders queued','SMS · 24h before','ok','Auto']]),
  },
  stats: {
    stats: () => '<div class="li-cells" style="grid-template-columns:repeat(3,1fr)"><div class="li-stat"><b>86</b><span>covers</span></div><div class="li-stat"><b>$6.1k</b><span>projected</span></div><div class="li-stat"><b>4.9★</b><span>this week</span></div></div>',
  },
  qr: {
    qr: qrHTML,
  },
  agegate: {
    gate: () => rowsHTML([['21+ verification','scanner armed','ok','ON']]),
  },
}

/* ─── component ───────────────────────────────────────────────── */
export default function LivingInterface() {
  const [current, setCurrent] = useState(-1)
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [email, setEmail] = useState('')
  const lastInteract = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)
  // refs to each morphing panel
  const compRefs = useRef<Record<CompId, HTMLDivElement | null>>(
    Object.fromEntries(COMP_IDS.map(id => [id, null])) as Record<CompId, HTMLDivElement | null>
  )
  // track "built" flag so we only create panels once
  const builtRef = useRef(false)
  // chip progress animation refs
  const progRefs = useRef<Record<number, HTMLSpanElement | null>>({})

  const reduced = useRef(false)
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  /* build panels once into the stage on mount */
  useEffect(() => {
    if (builtRef.current || !stageRef.current) return
    builtRef.current = true
    COMP_IDS.forEach((id, i) => {
      const el = document.createElement('div')
      el.className = 'li-comp li-hidden'
      el.style.transitionDelay = `${i * 55}ms`
      el.innerHTML = `<div class="li-comp-head"><span class="li-ic"></span><span class="li-t"></span></div><div class="li-comp-body"></div>`
      if (id === 'nav') el.classList.add('li-headless')
      stageRef.current!.appendChild(el)
      compRefs.current[id] = el as HTMLDivElement
    })
  }, [])

  const applyPersona = useCallback((idx: number, instant = false) => {
    setCurrent(idx)
    const p = PERSONAS[idx]
    document.documentElement.style.setProperty('--li-accent', p.accent)

    // chip progress bars
    Object.entries(progRefs.current).forEach(([i, span]) => {
      if (!span) return
      span.style.transition = 'none'
      span.style.width = '0%'
      if (+i === idx && !reduced.current) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          span.style.transition = `width ${CYCLE_MS}ms linear`
          span.style.width = '100%'
        }))
      }
    })

    // morph components
    COMP_IDS.forEach(id => {
      const el = compRefs.current[id]
      if (!el) return
      const spec = p.layout[id as keyof Layout] as CompSpec
      if (!spec) { el.classList.add('li-hidden'); return }
      const [l, t, w, h] = spec.r
      el.style.left = l + '%'
      el.style.top = t + '%'
      el.style.width = w + '%'
      el.style.height = h + '%'
      el.classList.remove('li-hidden')
      el.dataset.v = spec.v
      el.classList.add('li-swap')
      const delay = instant || reduced.current ? 0 : 260
      setTimeout(() => {
        const tEl = el.querySelector('.li-t') as HTMLElement
        const bodyEl = el.querySelector('.li-comp-body') as HTMLElement
        if (tEl) tEl.textContent = spec.t
        if (bodyEl) {
          const gen = (CONTENT[id as CompId] as Record<string, () => string>)[spec.v]
          bodyEl.innerHTML = gen ? gen() : ''
        }
        el.classList.remove('li-swap')
      }, delay)
    })
  }, [])

  /* mount: start on persona 0 */
  useEffect(() => {
    if (builtRef.current) applyPersona(0, true)
  }, [applyPersona])

  /* also fire after panels are built */
  useEffect(() => {
    const id = setTimeout(() => applyPersona(0, true), 60)
    return () => clearTimeout(id)
  }, [applyPersona])

  /* auto-cycle */
  useEffect(() => {
    if (reduced.current) return
    const timer = setInterval(() => {
      if (document.hidden) return
      if (Date.now() - lastInteract.current > RESUME_MS) {
        setCurrent(c => {
          const next = (c + 1) % PERSONAS.length
          applyPersona(next)
          return next
        })
      }
    }, CYCLE_MS)
    return () => clearInterval(timer)
  }, [applyPersona])

  function handleChip(idx: number) {
    lastInteract.current = Date.now()
    applyPersona(idx)
  }

  function handleWaitlist() {
    if (!email.includes('@')) return
    setWaitlistDone(true)
    // Could POST to /api/waitlist here in future
  }

  const p = PERSONAS[Math.max(0, current)]

  return (
    <>
      <style>{`
        :root { --li-accent: #6366f1; }
        .li-page { max-width: 1180px; margin: 0 auto; padding: 120px 24px 120px; }

        /* kicker */
        .li-kicker { font-size: 0.78rem; letter-spacing: 0.12em; color: #a78bfa; text-transform: uppercase; text-align: center; margin-bottom: 18px; }

        /* h1 */
        .li-h1 { font-family: var(--font-space, 'Space Grotesk', sans-serif); font-weight: 700; text-align: center; font-size: clamp(1.9rem, 4.2vw, 3.4rem); line-height: 1.15; max-width: 21ch; margin: 0 auto; }
        .li-h1 .old { color: #9ca3af; }
        .li-h1 .new { background: linear-gradient(135deg,#6366f1,#a78bfa,#818cf8); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .li-sub { text-align: center; color: #9ca3af; max-width: 60ch; margin: 20px auto 0; line-height: 1.65; font-size: 1.02rem; }

        /* worlds grid */
        .li-worlds { display: grid; grid-template-columns: 300px 1fr; gap: 28px; align-items: stretch; margin-top: 64px; }
        .li-world-label { font-family: var(--font-space, sans-serif); font-size: 0.72rem; letter-spacing: 0.14em; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .li-world-label .dot { width: 7px; height: 7px; border-radius: 50%; }
        .li-old-col .li-world-label { color: #6b7280; }
        .li-old-col .dot { background: #4b5563; }
        .li-new-col .li-world-label { color: #a78bfa; }
        .li-new-col .dot { background: #a78bfa; box-shadow: 0 0 10px rgba(167,139,250,0.9); }

        /* old world */
        .li-old-frame { border: 1px solid rgba(107,114,128,0.25); border-radius: 14px; background: #0b0d12; height: 100%; min-height: 380px; filter: grayscale(1); opacity: 0.75; display: flex; flex-direction: column; overflow: hidden; }
        .li-old-bar { height: 30px; border-bottom: 1px solid rgba(107,114,128,0.2); display: flex; align-items: center; gap: 5px; padding: 0 10px; }
        .li-old-bar i { width: 8px; height: 8px; border-radius: 50%; background: #374151; }
        .li-old-bar span { font-size: 0.62rem; color: #6b7280; margin-left: 6px; }
        .li-old-body { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .li-old-row { height: 22px; background: #161a22; border-radius: 5px; }
        .li-old-row.short { width: 55%; }
        .li-old-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .li-old-cell { background: #12151c; border-radius: 7px; border: 1px solid rgba(107,114,128,0.12); }
        .li-old-note { font-size: 0.74rem; color: #6b7280; text-align: center; padding: 12px 18px 16px; line-height: 1.5; }
        .li-old-note b { color: #9ca3af; font-weight: 600; }

        /* chips */
        .li-chips { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .li-chip { font-family: var(--font-space, sans-serif); font-size: 0.8rem; font-weight: 500; color: #9ca3af; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.22); border-radius: 999px; padding: 8px 16px; cursor: pointer; position: relative; overflow: hidden; transition: color .25s, border-color .25s, background .25s; }
        .li-chip:hover { color: #f8fafc; }
        .li-chip.active { color: #fff; border-color: var(--li-accent); background: rgba(99,102,241,0.16); }
        .li-chip .prog { position: absolute; left: 0; bottom: 0; height: 2px; width: 0%; background: var(--li-accent); transition: none; }

        /* frame */
        .li-frame { position: relative; border-radius: 16px; overflow: hidden; background: #070a14; border: 1px solid rgba(99,102,241,0.3); box-shadow: 0 20px 70px rgba(3,7,18,0.7), 0 0 0 1px rgba(167,139,250,0.06), 0 0 60px rgba(99,102,241,0.10); aspect-ratio: 16 / 10.4; }
        .li-titlebar { position: absolute; top: 0; left: 0; right: 0; height: 5.5%; display: flex; align-items: center; gap: 6px; padding: 0 12px; border-bottom: 1px solid rgba(99,102,241,0.16); background: rgba(8,10,20,0.85); z-index: 30; }
        .li-titlebar i { width: 9px; height: 9px; border-radius: 50%; background: #1f2435; }
        .li-titlebar i:first-child { background: rgba(99,102,241,0.55); }
        .li-app-name { font-family: var(--font-space, sans-serif); font-size: 0.72rem; color: #9ca3af; margin-left: 8px; transition: opacity .22s; }
        .li-app-name b { color: #f8fafc; font-weight: 600; }
        .li-stage { position: absolute; inset: 5.5% 0 0 0; }

        /* morphing panels */
        .li-comp { position: absolute; border: 1px solid rgba(99,102,241,0.22); border-radius: 10px; background: rgba(13,16,30,0.92); overflow: hidden; transition: left .85s cubic-bezier(.22,.8,.25,1), top .85s cubic-bezier(.22,.8,.25,1), width .85s cubic-bezier(.22,.8,.25,1), height .85s cubic-bezier(.22,.8,.25,1), opacity .45s ease, transform .85s cubic-bezier(.22,.8,.25,1), border-color .5s; }
        .li-comp.li-hidden { opacity: 0; transform: scale(0.85); pointer-events: none; }
        .li-comp-head { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-bottom: 1px solid rgba(99,102,241,0.14); }
        .li-ic { width: 8px; height: 8px; border-radius: 3px; background: var(--li-accent); flex: none; transition: background .5s; }
        .li-t { font-family: var(--font-space, sans-serif); font-size: 0.66rem; font-weight: 600; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .li-comp-body { position: absolute; inset: 30px 0 0 0; padding: 8px 10px; transition: opacity .22s ease; font-size: 0.64rem; color: #9ca3af; }
        .li-headless .li-comp-body { inset: 0; }
        .li-swap .li-comp-body, .li-swap .li-t { opacity: 0; }

        /* nav variants */
        .li-comp[data-v="sidebar"] .li-comp-body { display: flex; flex-direction: column; gap: 7px; padding-top: 10px; }
        .li-comp[data-v="topbar"] .li-comp-body, .li-comp[data-v="tabs"] .li-comp-body { display: flex; flex-direction: row; gap: 8px; align-items: center; }
        .li-nav-item { display: flex; align-items: center; gap: 7px; padding: 5px 8px; border-radius: 6px; white-space: nowrap; font-size: 0.64rem; }
        .li-nd { width: 6px; height: 6px; border-radius: 50%; background: rgba(156,163,175,0.5); flex: none; }
        .li-nav-item.on { background: rgba(99,102,241,0.18); color: #f8fafc; }
        .li-nav-item.on .li-nd { background: var(--li-accent); }

        /* list rows */
        .li-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 5px 7px; border-radius: 6px; background: rgba(99,102,241,0.05); margin-bottom: 5px; }
        .li-row b { color: #f8fafc; font-weight: 500; font-size: 0.64rem; }
        .li-sub { font-size: 0.54rem; }
        .li-pill { font-size: 0.54rem; padding: 2px 7px; border-radius: 999px; background: rgba(99,102,241,0.16); color: #c7d2fe; white-space: nowrap; }
        .li-pill-ok { background: rgba(129,140,248,0.2); }
        .li-pill-warn { background: rgba(167,139,250,0.22); color: #ddd6fe; }

        /* cells / grid */
        .li-cells { display: grid; gap: 6px; height: 100%; align-content: start; }
        .li-cell { border-radius: 6px; background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.12); padding: 5px 6px; display: flex; flex-direction: column; justify-content: space-between; min-height: 34px; }
        .li-cell b { color: #f8fafc; font-size: 0.58rem; font-weight: 500; }
        .li-cell.li-cell-fill { background: rgba(99,102,241,0.22); border-color: var(--li-accent); }
        .li-cell small { font-size: 0.5rem; color: #9ca3af; }

        /* stats */
        .li-stat { text-align: left; padding: 4px 2px; }
        .li-stat b { font-family: var(--font-space, sans-serif); font-size: 1.05rem; background: linear-gradient(135deg,#6366f1,#a78bfa,#818cf8); -webkit-background-clip: text; background-clip: text; color: transparent; display: block; }
        .li-stat span { font-size: 0.56rem; }

        /* qr */
        .li-qr-wrap { display: flex; gap: 10px; align-items: center; height: 100%; }
        .li-qr { display: grid; grid-template-columns: repeat(9,1fr); gap: 2px; width: 46%; aspect-ratio: 1; flex: none; }
        .li-qr i { background: rgba(99,102,241,0.1); border-radius: 1.5px; }
        .li-qr i.on { background: #c7d2fe; }
        .li-qr-txt b { color: #f8fafc; font-size: 0.66rem; display: block; margin-bottom: 4px; }
        .li-qr-txt { font-size: 0.6rem; color: #9ca3af; }

        /* keypad */
        .li-pad { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; height: 100%; align-content: stretch; }
        .li-pad span { display: flex; align-items: center; justify-content: center; border-radius: 7px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.14); font-family: var(--font-space, sans-serif); color: #f8fafc; font-size: 0.72rem; }
        .li-pad span.go { background: var(--li-accent); color: #fff; grid-column: span 2; }

        /* payment */
        .li-pay-btn { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#6366f1,#a78bfa,#818cf8); color: #fff; border-radius: 8px; font-family: var(--font-space, sans-serif); font-weight: 600; font-size: 0.72rem; padding: 10px; margin-top: 6px; }
        .li-pay-line { display: flex; justify-content: space-between; padding: 3px 2px; font-size: 0.64rem; }
        .li-pay-line b { color: #f8fafc; font-weight: 500; }

        /* caption */
        .li-caption { margin-top: 16px; min-height: 44px; display: flex; align-items: flex-start; gap: 10px; }
        .li-led { width: 8px; height: 8px; border-radius: 50%; background: var(--li-accent); margin-top: 5px; flex: none; box-shadow: 0 0 12px var(--li-accent); transition: background .5s; }
        .li-caption p { font-size: 0.86rem; color: #9ca3af; line-height: 1.55; }
        .li-caption p b { color: #f8fafc; font-weight: 600; }

        /* tagline */
        .li-tagline { text-align: center; font-family: var(--font-space, sans-serif); font-weight: 700; font-size: clamp(1.3rem, 2.6vw, 2rem); margin-top: 88px; }
        .li-tagline .g { background: linear-gradient(135deg,#6366f1,#a78bfa,#818cf8); -webkit-background-clip: text; background-clip: text; color: transparent; }

        /* manifesto */
        .li-manifesto { max-width: 62ch; margin: 28px auto 0; color: #9ca3af; line-height: 1.75; font-size: 0.98rem; }
        .li-manifesto p + p { margin-top: 18px; }
        .li-manifesto b { color: #f8fafc; font-weight: 600; }

        /* waitlist */
        .li-waitlist { display: flex; gap: 12px; justify-content: center; margin-top: 44px; flex-wrap: wrap; }
        .li-waitlist input { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; color: #f8fafc; padding: 13px 18px; font-size: 0.92rem; width: 290px; outline: none; font-family: var(--font-inter, sans-serif); }
        .li-waitlist input:focus { border-color: #a78bfa; }
        .li-waitlist button { background: linear-gradient(135deg,#6366f1,#a78bfa); color: #fff; border: none; border-radius: 12px; font-family: var(--font-space, sans-serif); font-weight: 600; font-size: 0.92rem; padding: 13px 24px; cursor: pointer; transition: opacity .2s; }
        .li-waitlist button:hover { opacity: 0.88; }
        .li-wl-note { text-align: center; font-size: 0.76rem; color: #6b7280; margin-top: 12px; }
        .li-wl-success { text-align: center; color: #a78bfa; font-family: var(--font-space, sans-serif); font-weight: 600; font-size: 1rem; margin-top: 44px; padding: 18px; border: 1px solid rgba(167,139,250,0.3); border-radius: 12px; max-width: 400px; margin-left: auto; margin-right: auto; }

        /* back link */
        .li-back { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.84rem; text-decoration: none; margin-bottom: 40px; transition: color .2s; }
        .li-back:hover { color: #a78bfa; }

        @media (max-width: 900px) {
          .li-worlds { grid-template-columns: 1fr; }
          .li-old-frame { min-height: 200px; }
          .li-frame { aspect-ratio: 4 / 4.6; }
          .li-comp-body { font-size: 0.58rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .li-comp, .li-comp-body, .li-caption p, .li-chip .prog { transition: none !important; }
        }
      `}</style>

      <div className="li-page">

        <a href="/" className="li-back">← Back to home</a>

        <div className="li-kicker">The New World · Dynamic Software Interfaces</div>

        <h1 className="li-h1">
          <span className="old">In the old world, your business adapted to software.</span><br />
          <span className="new">In the new world, software adapts to your business.</span>
        </h1>

        <p className="li-sub">
          Below is the same app — the same building blocks of booking, payments, lists, and alerts.
          Watch what happens when its owner changes. Nothing is swapped out; the software{' '}
          <em>reshapes itself</em>.
        </p>

        {/* ── Worlds grid ── */}
        <div className="li-worlds">

          {/* OLD WORLD */}
          <div className="li-old-col">
            <div className="li-world-label"><span className="dot"></span>OLD WORLD</div>
            <div className="li-old-frame">
              <div className="li-old-bar">
                <i></i><i></i><i></i>
                <span>GenericBiz Pro&#xa9; — same for every customer</span>
              </div>
              <div className="li-old-body">
                <div className="li-old-row"></div>
                <div className="li-old-row short"></div>
                <div className="li-old-grid">
                  <div className="li-old-cell"></div>
                  <div className="li-old-cell"></div>
                  <div className="li-olell"></div>
                  <div className="li-old-cell"></div>
                </div>
              </div>
              <div className="li-old-note">
                One interface for everyone.<br /><b>You</b> learn <b>its</b> workflow.
              </div>
            </div>
          </div>

          {/* NEW WORLD */}
          <div className="li-new-col">
            <div className="li-world-label"><span className="dot"></span>NEW WORLD</div>

            {/* chips */}
            <div className="li-chips">
              {PERSONAS.map((persona, i) => (
                <button
                  key={persona.id}
                  className={`li-chip${current === i ? ' active' : ''}`}
                  onClick={() => handleChip(i)}
                >
                  {persona.chip}
                  <span
                    className="prog"
                    ref={el => { progRefs.current[i] = el }}
                  />
                </button>
              ))}
            </div>

            {/* app frame */}
            <div className="li-frame">
              <div className="li-titlebar">
                <i></i><i></i><i></i>
                <span className="li-app-name">
                  <b>{p.app}</b>&nbsp;— {p.biz}
                </span>
              </div>
              {/* stage — morphing panels injected here via DOM */}
              <div className="li-stage" ref={stageRef}></div>
            </div>

            {/* caption */}
            <div className="li-caption">
              <span className="li-led"></span>
              <p dangerouslySetInnerHTML={{ __html: p.caption }} />
            </div>
          </div>
        </div>

        {/* tagline */}
        <div className="li-tagline">
          Same primitives. <span className="g">Different software. Yours.</span>
        </div>

        {/* manifesto */}
        <div className="li-manifesto">
          <p>
            <b>For thirty years, small businesses got the leftovers.</b> Software was expensive to
  2         build, so it was built once, for the average customer — and the ranch, the smoke shop,
            and the taqueria all squeezed into the same grey dashboard built for none of them.
          </p>
          <p>
            <b>AI collapsed the cost of building software by 10–100×.</b> The economics that
            forced one-size-fits-all are gone. What agencies quoted $50K for, we ship in days —
            which means software can finally be built around <em>how your business actually runs</em>,
            not the other way round.
          </p>
          <p>
            <b>Today, we do it for you.</b> Custom apps, your workflow, your quirks — age-gates,
            QR waivers, booking deposits — live in about ten days, priced like SaaS, and you own
            the code.
          </p>
          <p>
            <b>Tomorrow, you&rsquo;ll reshape it yourself.</b> We&rsquo;re building the platform where the
            building blocks you just watched rearrange themselves become yours to command — the
            Wix for business apps.
          </p>
        </div>

        {/* waitlist */}
        {waitlistDone ? (
          <div className="li-wl-success">✓ You&rsquo;re on the list — we&rsquo;ll reach out when self-serve opens.</div>
        ) : (
          <>
            <div className="li-waitlist">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleWaitlist()}
              />
              <button onClick={handleWaitlist}>
                Join the platform waitlist →
              </button>
            </div>
            <div className="li-wl-note">
              Be first when self-serve opens. No spam — we run on conversations, not campaigns.
            </div>
          </>
        )}

      </div>
    </>
  )
}
