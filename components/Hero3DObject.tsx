/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useRef } from 'react'

// ── Physics constants ────────────────────────────────────────────────────────
const REPEL_R  = 1.10   // cursor repulsion radius (world units)
const REPEL_F  = 0.16   // repulsion strength
const SPRING_K = 0.055  // spring-back constant
const DAMPING  = 0.88   // per-frame velocity damping

// Monochromatic indigo / violet only — no cyan, no party colours
const PALETTE = [
  '#312e81','#3730a3','#4338ca',
  '#4f46e5','#6366f1','#818cf8',
  '#a5b4fc','#7c3aed','#8b5cf6',
]

export default function Hero3DObject() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cleanup: (() => void) | undefined

    import('three').then((THREE) => {
      const container = containerRef.current!
      const W = container.offsetWidth  || 560
      const H = container.offsetHeight || 640

      // ── Scene / Camera / Renderer ─────────────────────────────────
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
      camera.position.z = 7

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Particle data ─────────────────────────────────────────────
      const NS = 500, NB = 180, NR = 120   // sphere, box, ring counts = 800 total
      const N  = NS + NB + NR

      interface Particle {
        bp:  any   // base (rest) position
        pos: any   // current position
        vel: any   // velocity
        sc:  number
        tp:  0|1|2
        ix:  number
      }

      const pts: Particle[] = []
      const col = PALETTE.map(h => new THREE.Color(h))
      let si = 0, bi = 0, ri = 0

      // Uniform sampling inside ellipsoid rx=2.0, ry=2.8, rz=0.7
      function sample(): any {
        for (;;) {
          const x = (Math.random() * 2 - 1) * 2.0
          const y = (Math.random() * 2 - 1) * 2.8
          const z = (Math.random() * 2 - 1) * 0.7
          if (x*x/4 + y*y/7.84 + z*z/0.49 <= 1)
            return new THREE.Vector3(x, y, z)
        }
      }

      for (let i = 0; i < N; i++) {
        const tp: 0|1|2 = i < NS ? 0 : i < NS+NB ? 1 : 2
        const bp = sample()
        pts.push({
          bp: bp.clone(), pos: bp.clone(), vel: new THREE.Vector3(),
          sc: 0.5 + Math.random() * 1.5,
          tp, ix: tp === 0 ? si++ : tp === 1 ? bi++ : ri++,
        })
      }

      // ── InstancedMesh factory ─────────────────────────────────────
      function mkIM(geo: any, n: number) {
        const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.80 })
        const im: any = new THREE.InstancedMesh(geo, mat, n)
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)
        scene.add(im)
        return im
      }

      // KEY: very small geometries so particles appear as micro-dots
      const sIM = mkIM(new THREE.SphereGeometry(0.022, 6, 6), NS)    // ~2–4 px at 720p
      const bIM = mkIM(new THREE.BoxGeometry(0.032, 0.032, 0.032), NB)
      const rIM = mkIM(new THREE.RingGeometry(0.010, 0.022, 6), NR)

      // Assign per-instance colours once — never updated per frame
      pts.forEach(p => {
        const c  = col[Math.floor(Math.random() * col.length)]
        const im = p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM
        im.setColorAt(p.ix, c)
      })
      ;[sIM, bIM, rIM].forEach((m: any) => { m.instanceColor.needsUpdate = true })

      // ── Mouse tracking — smoothed via lerp ───────────────────────
      const m2d    = new THREE.Vector2(-99, -99)
      const m3d    = new THREE.Vector3()   // smoothed position (used for physics)
      const m3dRaw = new THREE.Vector3()   // raw unproject result
      const rc     = new THREE.Raycaster()
      const zpl    = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

      const onMouseMove = (e: MouseEvent) => {
        const r = container.getBoundingClientRect()
        // Use LIVE r.width / r.height — not stale W/H from mount time
        m2d.set(
          ((e.clientX - r.left) / r.width)  *  2 - 1,
          -((e.clientY - r.top) / r.height) *  2 + 1,
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

        // Unproject 2-D mouse → 3-D world plane, then lerp for silky smoothing
        rc.setFromCamera(m2d, camera)
        rc.ray.intersectPlane(zpl, m3dRaw)
        m3d.lerp(m3dRaw, 0.08)   // 8 % per frame → smooth, no jitter

        // ── Particle physics ───────────────────────────────────────
        pts.forEach(p => {
          const dx   = p.pos.x - m3d.x
          const dy   = p.pos.y - m3d.y
          const dz   = p.pos.z - m3d.z
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)

          // Repulsion from cursor
          if (dist < REPEL_R && dist > 0.001) {
            const f = ((1 - dist / REPEL_R) * REPEL_F) / dist
            p.vel.x += dx * f
            p.vel.y += dy * f
            p.vel.z += dz * f
          }

          // Spring back to rest position
          p.vel.x += (p.bp.x - p.pos.x) * SPRING_K
          p.vel.y += (p.bp.y - p.pos.y) * SPRING_K
          p.vel.z += (p.bp.z - p.pos.z) * SPRING_K

          // Subtle organic drift
          p.vel.x += Math.sin(t * 0.28 + p.bp.y * 3.1) * 0.00030
          p.vel.y += Math.cos(t * 0.22 + p.bp.x * 2.7) * 0.00030

          p.vel.x *= DAMPING; p.vel.y *= DAMPING; p.vel.z *= DAMPING
          p.pos.x += p.vel.x; p.pos.y += p.vel.y; p.pos.z += p.vel.z

          // Write instanced matrix
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

        // Gentle idle sway
        scene.rotation.y = Math.sin(t * 0.12) * 0.06
        scene.rotation.x = Math.sin(t * 0.09) * 0.025

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
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-hidden />
  )
}
