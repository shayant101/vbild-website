'use client'

import { useEffect, useRef } from 'react'

export default function CursorEffects() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only run on pointer:fine devices (mouse, not touch)
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot = dotRef.current!
    const ring = ringRef.current!
    const spot = spotRef.current!

    let mx = -300, my = -300   // mouse position
    let rx = -300, ry = -300   // ring position (lags)
    let rafId: number
    let hovering = false

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t
    }

    function tick() {
      rx = lerp(rx, mx, 0.1)
      ry = lerp(ry, my, 0.1)

      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`
      ring.style.transform = `translate(${rx - 22}px, ${ry - 22}px)`
      spot.style.background = `radial-gradient(650px circle at ${mx}px ${my}px, rgba(99,102,241,0.08), rgba(168,85,247,0.03) 40%, transparent 70%)`

      rafId = requestAnimationFrame(tick)
    }

    function onMove(e: MouseEvent) {
      mx = e.clientX
      my = e.clientY
    }

    // Delegate hover detection to interactive elements
    function onOver(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest('a, button, [role="button"]')
      if (el && !hovering) {
        hovering = true
        ring.classList.add('cursor-ring--hover')
        dot.classList.add('cursor-dot--hover')
      } else if (!el && hovering) {
        hovering = false
        ring.classList.remove('cursor-ring--hover')
        dot.classList.remove('cursor-dot--hover')
      }
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* Full-page spotlight that follows cursor */}
      <div ref={spotRef} className="cursor-spotlight" />
      {/* Lagging ring */}
      <div ref={ringRef} className="cursor-ring" />
      {/* Precise dot */}
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}
