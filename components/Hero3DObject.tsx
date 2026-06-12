'use client'
import { useEffect, useRef } from 'react'

// ── Physics / visual constants ───────────────────────────────────────────────
const REPEL_R  = 1.55   // world-unit repulsion radius from cursor
const REPEL_F  = 0.22   // repulsion force multiplier
const SPRING_K = 0.050  // spring-back constant
const DAMPING  = 0.87   // per-frame velocity damping
const PALETTE  = ['#6366f1','#818cf8','#22d3ee','#a78bfa','#06b6d4','#c7d2fe','#4f46e5']

export default function Hero3DObject() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cleanup: (() => void) | undefined

    import('three').then((THREE) => {
      const container = containerRef.current!
      const W = container.offsetWidth  || 560
      const H = container.offsetHeight || 640

      // ── Scene / Camera / Renderer ────────────────────────────────
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
      camera.position.z = 7

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Particle data structures ──────────────────────────────────
      const NS = 350, NB = 120, NR = 80
      const N  = NS + NB + NR

      interface Particle {
        bp:  any   // base (rest) position – THREE.Vector3
        pos: any   // current position
        vel: any   // velocity
        sc:  number          // size scale multiplier
        tp:  0|1|2           // type: 0=sphere 1=box 2=ring
        ix:  number          // index within its InstancedMesh
      }

      const pts: Particle[] = []
      const col = PALETTE.map(h => new THREE.Color(h))
      let si = 0, bi = 0, ri = 0

      // Uniform distribution inside ellipsoid rx=2.0, ry=2.8, rz=0.9
      function sample(): any {
        for (;;) {
          const x = (Math.random() * 2 - 1) * 2.0
          const y = (Math.random() * 2 - 1) * 2.8
          const z = (Math.random() * 2 - 1) * 0.9
          if (x*x/4 + y*y/7.84 + z*z/0.81 <= 1) return new THREE.Vector3(x, y, z)
        }
      }

      for (let i = 0; i < N; i++) {
        const tp: 0|1|2 = i < NS ? 0 : i < NS+NB ? 1 : 2
        const bp = sample()
        pts.push({
          bp: bp.clone(), pos: bp.clone(), vel: new THREE.Vector3(),
          sc: 0.50 + Math.random() * 1.75,
          tp, ix: tp === 0 ? si++ : tp === 1 ? bi++ : ri++,
        })
      }

      // ── InstancedMesh factory ─────────────────────────────────────
      function mkIM(geo: any, n: number) {
        const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.82 })
        const im: any  = new THREE.InstancedMesh(geo, mat, n)
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)
        scene.add(im)
        return im
      }

      const sIM = mkIM(new THREE.SphereGeometry(0.054, 7, 7), NS)
      const bIM = mkIM(new THREE.BoxGeometry(0.082, 0.082, 0.082), NB)
      const rIM = mkIM(new THREE.RingGeometry(0.032, 0.064, 6), NR)

      // Assign initial per-instance colors (static – no need to update each frame)
      pts.forEach(p => {
        const c  = col[Math.floor(Math.random() * col.length)]
        const im = p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM
        im.setColorAt(p.ix, c)
      })
      ;[sIM, bIM, rIM].forEach((m: any) => { m.instanceColor.needsUpdate = true })

      // ── Bloom app-card builder ────────────────────────────────────
      // Each card is a Three.js Group that blooms from a particle.
      function mkCard(accent: string, layout: 'dash'|'form'): any {
        const g  = new THREE.Group()
        g.scale.setScalar(0)
        const ac = new THREE.Color(accent)
        const CW = 0.80, CH = 1.28  // card width/height in world units

        // Glass body
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(CW, CH, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x040410, transparent: true, opacity: 0.94 })
        )
        g.add(body)

        // Glowing edge frame
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(CW+0.01, CH+0.01, 0.052)),
          new THREE.LineBasicMaterial({ color: ac, transparent: true, opacity: 0.90 })
        )
        g.add(edge)

        // Header strip
        const hdr = new THREE.Mesh(
          new THREE.PlaneGeometry(CW - 0.18, 0.11),
          new THREE.MeshBasicMaterial({ color: ac, transparent: true, opacity: 0.22 })
        )
        hdr.position.set(0, CH/2 - 0.12, 0.027)
        g.add(hdr)

        const lm = new THREE.LineBasicMaterial({ color: ac, transparent: true, opacity: 0.28 })

        if (layout === 'dash') {
          // Dashboard: metric tiles + data rows + bar chart
          const tileMat = new THREE.MeshBasicMaterial({ color: ac, transparent: true, opacity: 0.10 })

          for (let i = 0; i < 2; i++) {
            const tile = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.01), tileMat)
            tile.position.set(-0.18 + i * 0.37, CH/2 - 0.35, 0.027)
            g.add(tile)
            const tileEdge = new THREE.LineSegments(
              new THREE.EdgesGeometry(new THREE.BoxGeometry(0.29, 0.19, 0.01)),
              new THREE.LineBasicMaterial({ color: ac, transparent: true, opacity: 0.30 })
            )
            tileEdge.position.copy(tile.position)
            g.add(tileEdge)
          }

          ;[0.52, 0.40, 0.48, 0.30, 0.45, 0.25, 0.42].forEach((w, i) => {
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-w/2, 0.14 - i * 0.105, 0.027),
              new THREE.Vector3( w/2, 0.14 - i * 0.105, 0.027),
            ])
            g.add(new THREE.Line(lineGeo, lm))
          })

          const bm = new THREE.MeshBasicMaterial({ color: ac, transparent: true, opacity: 0.22 })
          ;[0.35, 0.60, 0.50, 0.78, 0.62, 0.88].forEach((h, i) => {
            const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.056, h * 0.24), bm)
            bar.position.set(-0.28 + i * 0.112, -CH/2 + 0.14 + h * 0.12, 0.027)
            g.add(bar)
          })

        } else {
          // Form layout: labeled field rows + submit button
          const fieldMat  = new THREE.MeshBasicMaterial({ color: ac, transparent: true, opacity: 0.08 })
          const fieldEdge = new THREE.LineBasicMaterial({ color: ac, transparent: true, opacity: 0.22 })

          ;[0.40, 0.26, 0.40, 0.26, 0.36, 0.18].forEach((w, i) => {
            const y = 0.44 - i * 0.155

            // Label stub
            const labelGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-CW/2 + 0.06, y + 0.04, 0.027),
              new THREE.Vector3(-CW/2 + 0.06 + w * 0.52, y + 0.04, 0.027),
            ])
            g.add(new THREE.Line(labelGeo, lm))

            if (i % 2 === 0) {
              const field = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.14, 0.075), fieldMat)
              field.position.set(0, y - 0.02, 0.027)
              g.add(field)
              const fe = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(CW - 0.13, 0.076, 0.001)),
                fieldEdge
              )
              fe.position.copy(field.position)
              g.add(fe)
            }
          })

          // Submit button
          const btn = new THREE.Mesh(
            new THREE.PlaneGeometry(0.45, 0.075),
            new THREE.MeshBasicMaterial({ color: ac, transparent: true, opacity: 0.28 })
          )
          btn.position.set(0, -CH/2 + 0.14, 0.027)
          g.add(btn)
        }

        scene.add(g)
        return g
      }

      // Three cards cycling through 2 layouts × 3 accent colors
      const cards: any[] = [
        mkCard('#22d3ee', 'dash'),
        mkCard('#818cf8', 'form'),
        mkCard('#a78bfa', 'dash'),
      ]
      let cardI = 0, focusScale = 0, focusTarget = 0
      const focusPos = new THREE.Vector3()
      let cardCycleT = 0

      // ── Mouse tracking ─────────────────────────────────────────────
      // Global listener: canvas stays pointer-events:none, no click interception
      const m2d = new THREE.Vector2(-99, -99)
      const m3d = new THREE.Vector3()
      const rc  = new THREE.Raycaster()
      const zpl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

      const onMouseMove = (e: MouseEvent) => {
        const r = container.getBoundingClientRect()
        m2d.set(
          ((e.clientX - r.left) / W) * 2 - 1,
          -((e.clientY - r.top)  / H) * 2 + 1
        )
      }
      window.addEventListener('mousemove', onMouseMove)

      // ── Animation loop ────────────────────────────────────────────
      let raf: number
      const clk = new THREE.Clock()
      const dum = new THREE.Object3D()

      const animate = () => {
        raf = requestAnimationFrame(animate)
        const t = clk.getElapsedTime()

        // Unproject mouse to z=0 world plane
        rc.setFromCamera(m2d, camera)
        rc.ray.intersectPlane(zpl, m3d)

        // ── Focus particle ─────────────────────────────────────────
        // The particle in focus is the one closest to the cursor
        // that sits JUST OUTSIDE the repulsion ring — it hasn't
        // scattered yet, about to be "picked up" by the cursor.
        let focI = -1, focD = Infinity
        const inCloud = m3d.length() < 3.8

        pts.forEach((p, i) => {
          const d = p.pos.distanceTo(m3d)
          if (inCloud && d > REPEL_R * 0.80 && d < REPEL_R * 2.10 && d < focD) {
            focD = d; focI = i
          }
        })

        if (focI >= 0) {
          focusTarget = 1
          focusPos.lerp(pts[focI].pos, 0.12)
          if (t - cardCycleT > 2.8) { cardI = (cardI + 1) % 3; cardCycleT = t }
        } else {
          focusTarget = 0
        }
        focusScale += (focusTarget - focusScale) * 0.09

        cards.forEach((c: any, i: number) => {
          if (i === cardI) {
            c.position.lerp(focusPos, 0.10)
            c.scale.setScalar(focusScale * 1.55)
          } else {
            c.scale.multiplyScalar(0.88)
          }
          c.rotation.y = Math.sin(t * 0.40 + i) * 0.12
        })

        // ── Particle physics ───────────────────────────────────────
        pts.forEach(p => {
          const dx = p.pos.x - m3d.x
          const dy = p.pos.y - m3d.y
          const dz = p.pos.z - m3d.z
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)

          if (dist < REPEL_R && dist > 0.001) {
            const f = ((1 - dist / REPEL_R) * REPEL_F) / dist
            p.vel.x += dx * f
            p.vel.y += dy * f
            p.vel.z += dz * f
          }

          p.vel.x += (p.bp.x - p.pos.x) * SPRING_K
          p.vel.y += (p.bp.y - p.pos.y) * SPRING_K
          p.vel.z += (p.bp.z - p.pos.z) * SPRING_K

          // Organic micro-drift
          p.vel.x += Math.sin(t * 0.28 + p.bp.y * 3.1) * 0.00045
          p.vel.y += Math.cos(t * 0.22 + p.bp.x * 2.7) * 0.00045

          p.vel.x *= DAMPING; p.vel.y *= DAMPING; p.vel.z *= DAMPING
          p.pos.x += p.vel.x; p.pos.y += p.vel.y; p.pos.z += p.vel.z

          dum.position.set(p.pos.x, p.pos.y, p.pos.z)
          dum.scale.setScalar(p.sc)
          if (p.tp === 1) {
            dum.rotation.x = t * 0.25 + p.bp.x * 1.4
            dum.rotation.y = t * 0.34 + p.bp.y * 1.2
            dum.rotation.z = 0
          } else if (p.tp === 2) {
            dum.rotation.x = Math.PI / 2
            dum.rotation.y = 0
            dum.rotation.z = t * 0.50 + p.bp.x * 1.6
          } else {
            dum.rotation.set(0, 0, 0)
          }
          dum.updateMatrix()
          ;(p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM).setMatrixAt(p.ix, dum.matrix)
        })

        sIM.instanceMatrix.needsUpdate = true
        bIM.instanceMatrix.needsUpdate = true
        rIM.instanceMatrix.needsUpdate = true

        // Idle scene drift
        scene.rotation.y = Math.sin(t * 0.13) * 0.07
        scene.rotation.x = Math.sin(t * 0.10) * 0.03

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
        renderer.dispose()
        if (containerRef.current?.contains(renderer.domElement))
          containerRef.current.removeChild(renderer.domElement)
      }
    })

    return () => { cleanup?.() }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    />
  )
}
