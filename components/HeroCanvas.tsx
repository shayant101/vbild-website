'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hue: number
  alpha: number      // final target alpha
  birthTime: number  // ms timestamp when this dot should start appearing
}

// How long each dot fades in once born (ms)
const FADE_IN_MS = 350
// Total duration to stagger all dots across (ms)
const STAGGER_TOTAL_MS = 1400

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let particles: Particle[] = []
    let animId = 0
    let startTime = 0
    const mouse = { x: -9999, y: -9999, active: false }

    function init() {
      W = canvas!.width = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
      startTime = performance.now()
      const n = Math.min(140, Math.floor((W * H) / 6500))
      // Shuffle indices so dots don't appear in a top-left → bottom-right sweep
      const indices = Array.from({ length: n }, (_, i) => i)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
      }
      particles = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rnd(-0.35, 0.35),
        vy: rnd(-0.35, 0.35),
        r: rnd(1.2, 3),
        hue: Math.random() > 0.55 ? 246 : 280,
        alpha: rnd(0.4, 0.9),
        // Stagger birth time based on shuffled order so dots appear scattered
        birthTime: startTime + (indices[i] / n) * STAGGER_TOTAL_MS,
      }))
    }

    function draw() {
      const now = performance.now()
      ctx!.clearRect(0, 0, W, H)

      // Helper: current visible alpha for a particle (0 → targetAlpha as it fades in)
      function liveAlpha(p: Particle): number {
        const age = now - p.birthTime
        if (age <= 0) return 0
        const t = Math.min(1, age / FADE_IN_MS)
        return t * p.alpha
      }

      // Spider-web lines from cursor to nearby particles
      if (mouse.active) {
        for (const p of particles) {
          const a = liveAlpha(p)
          if (a <= 0) continue
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 220) {
            const alpha = (1 - d / 220) * 0.55 * (a / p.alpha)
            ctx!.beginPath()
            ctx!.strokeStyle = `hsla(246,85%,70%,${alpha})`
            ctx!.lineWidth = 0.9
            ctx!.moveTo(mouse.x, mouse.y)
            ctx!.lineTo(p.x, p.y)
            ctx!.stroke()
          }
        }

        // Glowing orb at cursor
        const grd = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 60)
        grd.addColorStop(0, 'rgba(99,102,241,0.28)')
        grd.addColorStop(0.5, 'rgba(168,85,247,0.12)')
        grd.addColorStop(1, 'transparent')
        ctx!.beginPath()
        ctx!.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2)
        ctx!.fillStyle = grd
        ctx!.fill()
      }

      // Particle-to-particle connection lines (only between visible dots)
      for (let i = 0; i < particles.length; i++) {
        const ai = liveAlpha(particles[i])
        if (ai <= 0) continue
        for (let j = i + 1; j < particles.length; j++) {
          const aj = liveAlpha(particles[j])
          if (aj <= 0) continue
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            // Line alpha also gated by how visible both endpoints are
            const visibility = Math.min(ai / particles[i].alpha, aj / particles[j].alpha)
            ctx!.beginPath()
            ctx!.strokeStyle = `hsla(246,85%,70%,${(1 - dist / 120) * 0.18 * visibility})`
            ctx!.lineWidth = 0.6
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }

      // Particles — with cursor repulsion
      for (const p of particles) {
        const a = liveAlpha(p)

        // Only move & repel once born
        if (a > 0) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (mouse.active && d < 160 && d > 0) {
            const f = ((160 - d) / 160) * 1.1
            p.x += (dx / d) * f
            p.y += (dy / d) * f
          }

          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > W) p.vx *= -1
          if (p.y < 0 || p.y > H) p.vy *= -1
        }

        if (a <= 0) continue
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `hsla(${p.hue},85%,70%,${a})`
        ctx!.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    init()
    draw()

    const onResize = () => { init() }

    // Fix: listen on WINDOW (not canvas), since canvas has pointer-events:none
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top
      // Only activate if cursor is within (or near) the hero canvas
      if (relX >= -40 && relX <= rect.width + 40 && relY >= -40 && relY <= rect.height + 40) {
        mouse.x = relX
        mouse.y = relY
        mouse.active = true
      } else {
        mouse.active = false
        mouse.x = -9999
        mouse.y = -9999
      }
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.6,
        pointerEvents: 'none',
      }}
    />
  )
}
