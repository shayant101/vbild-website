/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useRef } from 'react'

// ── Physics (locked — do not change) ─────────────────────────────────────────
const REPEL_R  = 0.50
const REPEL_F  = 0.14
const SPRING_K = 0.045
const DAMPING  = 0.88

// ── Phase 2 — focus / hover constants ────────────────────────────────────────
const FOCUS_SCALE  = 1.80   // node scale multiplier when focused
const FOCUS_Z_ABS  = 0.95   // absolute z target when focused
const FOCUS_CENTER = 0.55   // xy pull toward canvas center on focus
const FOCUS_R      = 0.42   // parting-cloud repulsion radius around focused node
const FOCUS_F      = 0.10   // parting-cloud repulsion force (scaled by focusAmt)
const STICKY_R     = 0.45   // hold-focus world-unit radius — prevents flicker

// Deep-space indigo / violet — monochromatic
const PALETTE = [
  '#1e1b4b','#312e81','#3730a3','#4338ca',
  '#4f46e5','#6366f1','#818cf8','#a5b4fc',
  '#7c3aed','#8b5cf6','#a78bfa','#c4b5fd',
]

// ── Six app-vertical nodes ────────────────────────────────────────────────────
const NODE_DATA = [
  { label: 'restaurant',    x: -0.48, y:  0.42, z:  0.05, color: '#818cf8', geo: 'icosa'  },
  { label: 'smoke shop',    x:  0.54, y:  0.50, z: -0.05, color: '#a78bfa', geo: 'octa'   },
  { label: 'gaming venue',  x: -0.62, y: -0.08, z:  0.05, color: '#c4b5fd', geo: 'box'    },
  { label: 'ranch event',   x:  0.57, y: -0.28, z: -0.05, color: '#6366f1', geo: 'tetra'  },
  { label: 'booking venue', x: -0.26, y: -0.58, z:  0.00, color: '#8b5cf6', geo: 'sphere' },
  { label: 'business',      x:  0.32, y: -0.62, z:  0.00, color: '#4338ca', geo: 'dodeca' },
] as const

// ── Phase 3 — card content per vertical ──────────────────────────────────────
interface CardData { name: string; blurb: string; tags: string[]; color: string }
const NODE_CARDS: CardData[] = [
  { name: 'Restaurant',     blurb: 'AI-powered ordering, reservations & loyalty built for your concept',    tags: ['POS',        'Reservations', 'Loyalty'],      color: '#818cf8' },
  { name: 'Smoke Shop',     blurb: 'Compliant age-check, inventory automation & customer rewards',          tags: ['Compliance', 'Inventory',    'Rewards'],      color: '#a78bfa' },
  { name: 'Gaming Venue',   blurb: 'Bookings, tournaments & leaderboards — all in one custom app',          tags: ['Bookings',   'Tournaments',  'Leaderboards'], color: '#c4b5fd' },
  { name: 'Ranch & Events', blurb: 'Ticketing, waivers & guest management for outdoor venues',              tags: ['Ticketing',  'Waivers',      'Capacity'],     color: '#6366f1' },
  { name: 'Booking Venue',  blurb: 'Real-time scheduling, automated reminders & seamless payments',         tags: ['Scheduling', 'Payments',     'Reminders'],    color: '#8b5cf6' },
  { name: 'Business',       blurb: 'Custom AI tools, dashboards & ops automation for your team',            tags: ['Automation', 'Dashboards',   'AI Tools'],     color: '#4338ca' },
]

export default function Hero3DObject() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Card refs — updated imperatively inside rAF (zero React re-renders)
  const cardRef      = useRef<HTMLDivElement>(null)
  const cardDotRef   = useRef<HTMLDivElement>(null)
  const cardNameRef  = useRef<HTMLDivElement>(null)
  const cardBlurbRef = useRef<HTMLDivElement>(null)
  const cardTagsRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    // Capture refs before async import so cleanup can reference them
    const cardEl    = cardRef.current
    const dotEl     = cardDotRef.current
    const nameEl    = cardNameRef.current
    const blurbEl   = cardBlurbRef.current
    const tagsEl    = cardTagsRef.current
    let cleanup: (() => void) | undefined

    import('three').then((THREE) => {
      const container = containerRef.current!
      const W = container.offsetWidth  || 560
      const H = container.offsetHeight || 640
      const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches

      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
      camera.position.z = 7

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Scene lights ──────────────────────────────────────────────────
      const ambientLight = new THREE.AmbientLight(0xa5b4fc, 0.75)
      scene.add(ambientLight)
      const dirLight = new THREE.DirectionalLight(0xc4b5fd, 1.1)
      dirLight.position.set(2, 3, 4)
      scene.add(dirLight)
      const ptLight = new THREE.PointLight(0x6366f1, 14, 12)
      ptLight.position.set(-2, -1, 2.5)
      scene.add(ptLight)

      // ── Particles ─────────────────────────────────────────────────────
      const NS = isMobile ? 600 : 1100, NB = isMobile ? 450 : 800, NR = isMobile ? 250 : 500
      const N  = NS + NB + NR

      interface Particle {
        bp: any; pos: any; vel: any
        sc: number; tp: 0|1|2; ix: number
      }

      const pts: Particle[] = []
      const col = PALETTE.map(h => new THREE.Color(h))
      let si = 0, bi = 0, ri = 0

      function gauss() {
        const u1 = 1 - Math.random()
        const u2 = Math.random()
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      }
      function sample(): any {
        return new THREE.Vector3(gauss() * 0.65, gauss() * 0.85, gauss() * 0.13)
      }

      for (let i = 0; i < N; i++) {
        const tp: 0|1|2 = i < NS ? 0 : i < NS+NB ? 1 : 2
        const bp = sample()
        pts.push({
          bp: bp.clone(), pos: bp.clone(), vel: new THREE.Vector3(),
          sc: 0.3 + Math.random() * 1.1,
          tp, ix: tp === 0 ? si++ : tp === 1 ? bi++ : ri++,
        })
      }

      function mkIM(geo: any, n: number) {
        const mat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.80, roughness: 0.45, metalness: 0.35 })
        const im: any = new THREE.InstancedMesh(geo, mat, n)
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)
        scene.add(im)
        return im
      }

      const sIM = mkIM(new THREE.SphereGeometry(0.010, 5, 4), NS)
      const bIM = mkIM(new THREE.BoxGeometry(0.013, 0.013, 0.013), NB)
      const rIM = mkIM(new THREE.RingGeometry(0.007, 0.013, 6), NR)
      rIM.material.side = THREE.DoubleSide

      pts.forEach(p => {
        const c  = col[Math.floor(Math.random() * col.length)]
        const im = p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM
        im.setColorAt(p.ix, c)
      })
      ;[sIM, bIM, rIM].forEach((m: any) => { m.instanceColor.needsUpdate = true })

      // ── Glow texture ───────────────────────────────────────────────────
      function makeGlowTex(hex: string): any {
        const sz = 128
        const cv = document.createElement('canvas')
        cv.width = cv.height = sz
        const cx = cv.getContext('2d')!
        const c3 = new THREE.Color(hex)
        const rr = Math.round(c3.r * 255)
        const gg = Math.round(c3.g * 255)
        const bb = Math.round(c3.b * 255)
        const gr = cx.createRadialGradient(sz/2, sz/2, 0, sz/2, sz/2, sz/2)
        gr.addColorStop(0,    `rgba(${rr},${gg},${bb},0.55)`)
        gr.addColorStop(0.40, `rgba(${rr},${gg},${bb},0.18)`)
        gr.addColorStop(1,    `rgba(${rr},${gg},${bb},0)`)
        cx.fillStyle = gr
        cx.fillRect(0, 0, sz, sz)
        return new THREE.CanvasTexture(cv)
      }

      const nodeGeoMap: Record<string, any> = {
        icosa:  new THREE.IcosahedronGeometry(0.088, 0),
        octa:   new THREE.OctahedronGeometry(0.088, 0),
        box:    new THREE.BoxGeometry(0.11, 0.11, 0.11),
        tetra:  new THREE.TetrahedronGeometry(0.096, 0),
        sphere: new THREE.SphereGeometry(0.078, 8, 6),
        dodeca: new THREE.DodecahedronGeometry(0.082, 0),
      }

      const hitGeo = new THREE.SphereGeometry(isMobile ? 0.30 : 0.20, 4, 3)
      const hitMat = new THREE.MeshBasicMaterial({ visible: false })

      interface NodeObj {
        bx: number; by: number; bz: number
        solid: any; wire: any; glow: any; hit: any
        fl: number
      }

      const nodeObjs: NodeObj[] = NODE_DATA.map(nd => {
        const geo = nodeGeoMap[nd.geo]

        const solid: any = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(nd.color),
            emissive: new THREE.Color(0x4338ca),
            emissiveIntensity: 0.4,
            roughness: 0.3,
            metalness: 0.55,
            transparent: true,
            opacity: 0.90,
          })
        )
        solid.position.set(nd.x, nd.y, nd.z)
        scene.add(solid)

        const wire: any = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.30 })
        )
        wire.position.copy(solid.position)
        wire.scale.setScalar(1.28)
        scene.add(wire)

        const glow: any = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: makeGlowTex(nd.color),
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
          })
        )
        glow.position.copy(solid.position)
        glow.scale.setScalar(0.55)
        scene.add(glow)

        const hit: any = new THREE.Mesh(hitGeo, hitMat)
        hit.position.set(nd.x, nd.y, nd.z)
        scene.add(hit)

        return { bx: nd.x, by: nd.y, bz: nd.z, solid, wire, glow, hit, fl: 0 }
      })

      const hitMeshes = nodeObjs.map(n => n.hit)

      // ── Mouse ─────────────────────────────────────────────────────────
      const m2d    = new THREE.Vector2(-99, -99)
      const m3d    = new THREE.Vector3()
      const m3dRaw = new THREE.Vector3()
      const rc     = new THREE.Raycaster()
      const zpl    = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

      const onMouseMove = (e: MouseEvent) => {
        const r = container.getBoundingClientRect()
        m2d.set(
          ((e.clientX - r.left) / r.width)  *  2 - 1,
          -((e.clientY - r.top) / r.height) *  2 + 1,
        )
        if (!mouseOverCard) {
          lastPointerActivity = performance.now()
          attractMode = false
        }
      }
      window.addEventListener('mousemove', onMouseMove)

      // ── Phase 3: pointer-over-card guard ──────────────────────────────
      let mouseOverCard = false
      const onCardEnter = () => { mouseOverCard = true }
      const onCardLeave = () => { mouseOverCard = false; lastPointerActivity = performance.now() }
      cardEl?.addEventListener('mouseenter', onCardEnter)
      cardEl?.addEventListener('mouseleave', onCardLeave)

      // ── Phase 5: touch / tap handler ──────────────────────────────────
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) return
        const touch = e.touches[0]
        const r = container.getBoundingClientRect()
        const tx = ((touch.clientX - r.left) / r.width)  *  2 - 1
        const ty = -((touch.clientY - r.top)  / r.height) *  2 + 1
        rc.setFromCamera(new THREE.Vector2(tx, ty), camera)
        const hits = rc.intersectObjects(hitMeshes, false)
        if (hits.length > 0) {
          e.preventDefault()                          // prevent scroll when tapping a node
          const idx = hitMeshes.indexOf(hits[0].object)
          if (idx === focusedNode) {
            // Second tap on same node → scroll to portfolio
            document.querySelector('#portfolio')?.scrollIntoView({ behavior: 'smooth' })
          } else {
            focusedNode = idx
            lastPointerActivity = performance.now()
            attractMode = false
          }
        } else {
          focusedNode = -1
          lastPointerActivity = performance.now()
          attractMode = false
        }
      }
      if (isMobile) container.addEventListener('touchstart', onTouchStart, { passive: false })

      // ── Phase 4: attract mode state ───────────────────────────────────
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let lastPointerActivity = performance.now()
      let attractMode  = false
      let attractIndex = 0
      let attractTimer = 0

      // ── Focus state ───────────────────────────────────────────────────
      let focusedNode = -1
      let prevFocused = -1

      // Scratch vector for world-position projection
      const projPos = new THREE.Vector3()

      // ── Animation loop ────────────────────────────────────────────────
      let raf: number
      const clk = new THREE.Clock()
      const dum = new THREE.Object3D()

      const animate = () => {
        raf = requestAnimationFrame(animate)
        const t = clk.getElapsedTime()

        rc.setFromCamera(m2d, camera)
        rc.ray.intersectPlane(zpl, m3dRaw)
        m3d.lerp(m3dRaw, 0.08)

        // ── Phase 4: attract mode ─────────────────────────────────────────
        const now = performance.now()
        if (!prefersReducedMotion && !mouseOverCard && !attractMode) {
          if (now - lastPointerActivity > 6000) {
            attractMode  = true
            attractIndex = 0
            attractTimer = now
          }
        }
        if (attractMode) {
          focusedNode = attractIndex
          if (now - attractTimer > 3500) {
            attractIndex = (attractIndex + 1) % NODE_DATA.length
            attractTimer = now
          }
        } else if (!mouseOverCard) {
          // ── Node hover detection ─────────────────────────────────────
          const hits = rc.intersectObjects(hitMeshes, false)
          if (hits.length > 0) {
            focusedNode = hitMeshes.indexOf(hits[0].object)
          } else if (focusedNode >= 0) {
            const fn = nodeObjs[focusedNode]
            const dx = fn.bx - m3d.x
            const dy = fn.by - m3d.y
            if (Math.sqrt(dx*dx + dy*dy) > STICKY_R) focusedNode = -1
          }
          renderer.domElement.style.cursor = focusedNode >= 0 ? 'pointer' : ''
        }

        // ── Particle physics ───────────────────────────────────────────
        pts.forEach(p => {
          const dx   = p.pos.x - m3d.x
          const dy   = p.pos.y - m3d.y
          const dz   = p.pos.z - m3d.z
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
          if (dist < REPEL_R && dist > 0.001) {
            const f = ((1 - dist / REPEL_R) * REPEL_F) / dist
            p.vel.x += dx * f; p.vel.y += dy * f; p.vel.z += dz * f
          }

          if (focusedNode >= 0) {
            const fn   = nodeObjs[focusedNode]
            const fdx  = p.pos.x - fn.solid.position.x
            const fdy  = p.pos.y - fn.solid.position.y
            const fdz  = p.pos.z - fn.solid.position.z
            const fdst = Math.sqrt(fdx*fdx + fdy*fdy + fdz*fdz)
            if (fdst < FOCUS_R && fdst > 0.001) {
              const ff = ((1 - fdst / FOCUS_R) * FOCUS_F * fn.fl) / fdst
              p.vel.x += fdx * ff; p.vel.y += fdy * ff; p.vel.z += fdz * ff
            }
          }

          p.vel.x += (p.bp.x - p.pos.x) * SPRING_K
          p.vel.y += (p.bp.y - p.pos.y) * SPRING_K
          p.vel.z += (p.bp.z - p.pos.z) * SPRING_K
          p.vel.x += Math.sin(t * 0.22 + p.bp.y * 3.1) * 0.00018
          p.vel.y += Math.cos(t * 0.18 + p.bp.x * 2.7) * 0.00018
          p.vel.x *= DAMPING; p.vel.y *= DAMPING; p.vel.z *= DAMPING
          p.pos.x += p.vel.x; p.pos.y += p.vel.y; p.pos.z += p.vel.z

          dum.position.set(p.pos.x, p.pos.y, p.pos.z)
          dum.scale.setScalar(p.sc)
          if (p.tp === 1) {
            dum.rotation.x = t * 0.22 + p.bp.x * 1.4
            dum.rotation.y = t * 0.30 + p.bp.y * 1.2
            dum.rotation.z = 0
          } else if (p.tp === 2) {
            dum.rotation.x = Math.PI / 2
            dum.rotation.y = 0
            dum.rotation.z = t * 0.45 + p.bp.x * 1.6
          } else {
            dum.rotation.set(0, 0, 0)
          }
          dum.updateMatrix()
          ;(p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM).setMatrixAt(p.ix, dum.matrix)
        })

        sIM.instanceMatrix.needsUpdate = true
        bIM.instanceMatrix.needsUpdate = true
        rIM.instanceMatrix.needsUpdate = true

        // ── Node idle + focus animation ────────────────────────────────
        const anyFocused = focusedNode >= 0
        nodeObjs.forEach((nd, i) => {
          const ph        = i * 1.05
          const bob       = Math.sin(t * 0.38 + ph) * 0.035
          const idlePulse = 1 + Math.sin(t * 0.72 + ph) * 0.07
          const isFocused = i === focusedNode

          // Single focusAmt scalar — asymmetric lerp rates (prototype values)
          nd.fl += ((isFocused ? 1 : 0) - nd.fl) * (isFocused ? 0.07 : 0.05)

          // Derive all focus positions from nd.fl
          const fx = nd.bx * (1 - nd.fl * FOCUS_CENTER)
          const fy = nd.by * (1 - nd.fl * FOCUS_CENTER)
          const fz = nd.bz + nd.fl * (FOCUS_Z_ABS - nd.bz)

          const scaleMult = 1 + nd.fl * (FOCUS_SCALE - 1)
          const py = fy + bob

          nd.solid.position.set(fx, py, fz)
          nd.solid.rotation.y = t * 0.28 + ph
          nd.solid.rotation.x = t * 0.17 + ph * 0.6
          nd.solid.scale.setScalar(idlePulse * scaleMult)
          nd.solid.material.emissiveIntensity = 0.4 + nd.fl * 0.5

          nd.wire.position.copy(nd.solid.position)
          nd.wire.rotation.copy(nd.solid.rotation)
          nd.wire.scale.setScalar(1.28 * idlePulse * scaleMult)

          nd.hit.position.copy(nd.solid.position)

          nd.glow.position.copy(nd.solid.position)
          nd.glow.scale.setScalar(0.55 * idlePulse * scaleMult * (1 + nd.fl * 0.5))

          const tSolid  = !anyFocused ? 0.90 : isFocused ? 0.96 : 0.18
          const tWire   = !anyFocused ? 0.30 : isFocused ? 0.80 : 0.05
          const baseGlow = 0.4 + 0.15 * Math.sin(t * 1.4 + ph) + nd.fl * 0.25
          const tGlow   = anyFocused && !isFocused ? 0.04 : baseGlow

          nd.solid.material.opacity += (tSolid - nd.solid.material.opacity) * 0.06
          nd.wire.material.opacity  += (tWire  - nd.wire.material.opacity)  * 0.06
          nd.glow.material.opacity  += (tGlow  - nd.glow.material.opacity)  * 0.06
        })

        scene.rotation.y = Math.sin(t * 0.09) * 0.05
        scene.rotation.x = Math.sin(t * 0.07) * 0.020

        // ── Phase 3: card content (update on focus change only) ────────
        if (focusedNode !== prevFocused) {
          prevFocused = focusedNode
          if (focusedNode >= 0) {
            const cd = NODE_CARDS[focusedNode]
            if (dotEl)   dotEl.style.background = cd.color
            if (nameEl)  nameEl.textContent = cd.name
            if (blurbEl) blurbEl.textContent = cd.blurb
            if (tagsEl)  tagsEl.innerHTML = cd.tags.map(tag =>
              `<span style="background:${cd.color}1a;color:${cd.color};border:1px solid ${cd.color}55;` +
              `padding:2px 8px;border-radius:20px;font-size:10px;white-space:nowrap;line-height:1.5">${tag}</span>`
            ).join('')
          }
        }

        // ── Phase 3: card position + visibility (every frame) ─────────
        if (cardEl) {
          if (focusedNode >= 0) {
            const cw = container.offsetWidth
            const ch = container.offsetHeight
            const CARD_W = 218, CARD_H = 172
            let cx: number, cy: number
            if (isMobile) {
              // On touch: center card horizontally, dock near bottom
              cx = Math.max(8, (cw - CARD_W) / 2)
              cy = ch - CARD_H - 24
            } else {
              // Desktop: track node world position, flip left if near right edge
              const nd = nodeObjs[focusedNode]
              nd.solid.getWorldPosition(projPos)
              projPos.project(camera)
              const px = ( projPos.x * 0.5 + 0.5) * cw
              const py = (-projPos.y * 0.5 + 0.5) * ch
              cx = px + 32
              cy = py - CARD_H / 2
              if (cx + CARD_W > cw - 8) cx = px - CARD_W - 12
              cy = Math.max(8, Math.min(cy, ch - CARD_H - 8))
            }
            cardEl.style.transform    = `translate(${Math.round(cx)}px,${Math.round(cy)}px)`
            cardEl.style.opacity      = '1'
            cardEl.style.pointerEvents = 'auto'
          } else {
            cardEl.style.opacity      = '0'
            cardEl.style.pointerEvents = 'none'
          }
        }

        renderer.render(scene, camera)
      }

      animate()

      const onResize = () => {
        if (!containerRef.current) return
        const w = containerRef.current.offsetWidth
        const h = containerRef.current.offsetHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', onResize)
        cardEl?.removeEventListener('mouseenter', onCardEnter)
        cardEl?.removeEventListener('mouseleave', onCardLeave)
        if (isMobile) container.removeEventListener('touchstart', onTouchStart)
        renderer.domElement.style.cursor = ''
        renderer.dispose()
        if (containerRef.current?.contains(renderer.domElement))
          containerRef.current.removeChild(renderer.domElement)
      }
    })

    return () => { cleanup?.() }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Three.js canvas mount point */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-hidden />

      {/* Phase 3 — glass card overlay, positioned imperatively by rAF */}
      <div
        ref={cardRef}
        style={{
          position:        'absolute',
          top:             0,
          left:            0,
          width:           '218px',
          background:      'rgba(8, 5, 28, 0.90)',
          backdropFilter:  'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border:          '1px solid rgba(129, 140, 248, 0.20)',
          borderRadius:    '14px',
          padding:         '16px',
          opacity:         0,
          pointerEvents:   'none',
          transition:      'opacity 0.18s ease',
          willChange:      'transform, opacity',
          userSelect:      'none',
          zIndex:          10,
          boxShadow:       '0 8px 40px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Header row: colored dot + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div
            ref={cardDotRef}
            style={{
              width: '10px', height: '10px',
              borderRadius: '50%',
              flexShrink: 0,
              background: '#818cf8',
              boxShadow: '0 0 8px currentColor',
            }}
          />
          <div
            ref={cardNameRef}
            style={{
              fontWeight: 700,
              color: '#fff',
              fontSize: '13.5px',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          />
        </div>

        {/* Blurb */}
        <div
          ref={cardBlurbRef}
          style={{
            color: 'rgba(196,181,253,0.70)',
            fontSize: '11.5px',
            lineHeight: 1.6,
            marginBottom: '10px',
          }}
        />

        {/* Tags */}
        <div
          ref={cardTagsRef}
          style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            marginBottom: '13px',
          }}
        />

        {/* CTA */}
        <button
          onClick={() => document.querySelector('#portfolio')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            display:        'block',
            width:          '100%',
            padding:        '8px 0',
            background:     'linear-gradient(135deg, rgba(79,70,229,0.88), rgba(124,58,237,0.88))',
            border:         '1px solid rgba(99,102,241,0.45)',
            borderRadius:   '8px',
            color:          '#fff',
            fontSize:       '11.5px',
            fontWeight:     600,
            cursor:         'pointer',
            letterSpacing:  '0.03em',
          }}
        >
          See this work →
        </button>
      </div>
    </div>
  )
}
