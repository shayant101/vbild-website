'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hue: number
  alpha: number
}

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
    const mouse = { x: -9999, y: -9999, active: false }

    function init() {
      W = canvas!.width = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
      const n = Math.min(140, Math.floor((W * H) / 6500))
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rnd(-0.35, 0.35),
        vy: rnd(-0.35, 0.35),
        r: rnd(1.2, 3),
        hue: Math.random() > 0.55 ? 246 : 280,
        alpha: rnd(0.4, 0.9),
      }))
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      // Spider-web lines from cursor to nearby particles
      if (mouse.active) {
        for (const p of particles) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 220) {
            const alpha = (1 - d / 220) * 0.55
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

      // Particle-to-particle connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx!.beginPath()
            ctx!.strokeStyle = `hsla(246,85%,70%,${(1 - dist / 120) * 0.18})`
            ctx!.lineWidth = 0.6
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }

      // Particles — with cursor repulsion
      for (const p of particles) {
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

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `hsla(${p.hue},85%,70%,${p.alpha})`
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
