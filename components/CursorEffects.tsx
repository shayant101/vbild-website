'use client'

import { useEffect, useRef } from 'react'

/**
 * Vbild cursor v2 — precise core, adaptive halo.
 *  • The core (dot + 1px halo) sits exactly under the OS pointer with zero lag. Precision is never in doubt.
 *  • The ring is small and tight when roaming; over anything clickable it morphs into a rounded highlight that
 *    snaps around the element itself, so the target is unmistakable. Over text inputs it becomes a thin I-beam.
 *  • Clicks fire a ripple from the core. Fast movement leaves a short comet trail that fades.
 *  • Off on touch devices and with prefers-reduced-motion; the OS cursor returns when the pointer leaves the window.
 */
const INTERACTIVE = 'a, button, [role="button"], input[type="submit"], select, summary, label[for], .ld-card, .cat-card, .proj-card, .port-card, .price-card, .ma-prod, .ma-pill, .ma-slot, .ld-step, .chip'
const TEXTY = 'input:not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]'
const TRAIL_N = 7

export default function CursorEffects() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = rootRef.current!
    const spot = root.querySelector<HTMLDivElement>('.cur-spot')!
    const ring = root.querySelector<HTMLDivElement>('.cur-ring')!
    const core = root.querySelector<HTMLDivElement>('.cur-core')!
    const trail = Array.from(root.querySelectorAll<HTMLDivElement>('.cur-trail'))
    document.documentElement.classList.add('cur-on')

    let mx = -100, my = -100, px = -100, py = -100
    let rx = -100, ry = -100, rw = 22, rh = 22, rr = 11      // ring current
    let tx = -100, ty = -100, tw = 22, th = 22, tr = 11      // ring target
    let target: Element | null = null
    let mode: 'roam' | 'snap' | 'text' | 'hidden' = 'roam'
    let speed = 0, raf = 0, down = false, frame = 0, lw = -1, lh = -1, lr = -1
    const hist: { x: number; y: number }[] = []

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    function setTarget(el: Element | null) {
      if (el === target) return
      target = el
      if (!el) { mode = 'roam'; ring.className = 'cur-ring'; return }
      if (el.matches(TEXTY)) { mode = 'text'; ring.className = 'cur-ring cur-ring--text'; return }
      mode = 'snap'; ring.className = 'cur-ring cur-ring--snap'
    }

    function measure() {
      if (mode === 'snap' && target) {
        const b = target.getBoundingClientRect()
        if (b.width === 0 || b.width > 640 || b.height > 420) { // too big to wrap — fall back to a loose ring
          tx = mx; ty = my; tw = th = 36; tr = 18; return
        }
        const pad = 6
        tx = b.left - pad + (b.width + pad * 2) / 2; ty = b.top - pad + (b.height + pad * 2) / 2
        tw = b.width + pad * 2; th = b.height + pad * 2
        const cs = getComputedStyle(target as HTMLElement).borderTopLeftRadius
        const r = parseFloat(cs) || 8; tr = Math.min(Math.max(r + pad, 8), th / 2)
      } else if (mode === 'text') {
        tx = mx; ty = my; tw = 2; th = 26; tr = 1
      } else {
        tx = mx; ty = my; tw = th = 22; tr = 11
      }
    }

    function tick() {
      frame++
      if (mode !== 'snap' || frame % 3 === 0) measure()
      const k = mode === 'snap' ? 0.28 : 0.45
      rx = lerp(rx, tx, k); ry = lerp(ry, ty, k); rw = lerp(rw, tw, 0.3); rh = lerp(rh, th, 0.3); rr = lerp(rr, tr, 0.3)
      ring.style.transform = `translate3d(${rx - rw / 2}px, ${ry - rh / 2}px, 0)`
      if (Math.abs(rw - lw) > 0.4 || Math.abs(rh - lh) > 0.4) { ring.style.width = `${rw}px`; ring.style.height = `${rh}px`; lw = rw; lh = rh }
      if (Math.abs(rr - lr) > 0.4) { ring.style.borderRadius = `${rr}px`; lr = rr }
      core.style.transform = `translate3d(${mx}px, ${my}px, 0)`
      spot.style.transform = `translate3d(${mx - 650}px, ${my - 650}px, 0)`
      // comet trail — only when moving fast
      speed = lerp(speed, Math.hypot(mx - px, my - py), 0.4); px = mx; py = my
      hist.unshift({ x: mx, y: my }); if (hist.length > TRAIL_N * 3) hist.pop()
      const show = !reduced && speed > 9 && mode === 'roam'
      trail.forEach((t, i) => { const h = hist[(i + 1) * 3]; if (!h || !show) { if (t.style.opacity !== '0') t.style.opacity = '0'; return } const f = 1 - i / TRAIL_N; t.style.opacity = String(0.55 * f); t.style.transform = `translate3d(${h.x}px, ${h.y}px, 0) scale(${0.3 + 0.7 * f})` })
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; if (mode === 'hidden') { mode = 'roam'; root.classList.remove('cur-hidden') } }
    const onOver = (e: MouseEvent) => { const el = (e.target as Element).closest(INTERACTIVE) || (e.target as Element).closest(TEXTY); setTarget(el) }
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget) { mode = 'hidden'; root.classList.add('cur-hidden'); target = null } }
    const onDown = () => { down = true; core.classList.add('cur-core--down') }
    const onUp = (e: MouseEvent) => {
      down = false; core.classList.remove('cur-core--down')
      if (reduced) return
      const r = document.createElement('div'); r.className = 'cur-ripple'; r.style.left = `${e.clientX}px`; r.style.top = `${e.clientY}px`; root.appendChild(r); setTimeout(() => r.remove(), 650)
    }
    const onScroll = () => { if (mode === 'snap' && target) { const el = document.elementFromPoint(mx, my); if (!el || !target.contains(el)) setTarget(null) } }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    window.addEventListener('mousedown', onDown); window.addEventListener('mouseup', onUp)
    window.addEventListener('scroll', onScroll, { passive: true })
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick) }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver); document.removeEventListener('mouseout', onOut)
      window.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf); document.documentElement.classList.remove('cur-on')
    }
  }, [])

  return (
    <div ref={rootRef} className="cur" aria-hidden>
      <div className="cur-spot" />
      {Array.from({ length: TRAIL_N }).map((_, i) => <div key={i} className="cur-trail" />)}
      <div className="cur-ring" />
      <div className="cur-core" />
    </div>
  )
}
