/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useRef } from 'react'

// ── Physics ──────────────────────────────────────────────────────────────────
const REPEL_R  = 0.50   // small cursor parting zone
const REPEL_F  = 0.14
const SPRING_K = 0.045
const DAMPING  = 0.88

// Deep-space indigo / violet — monochromatic
const PALETTE = [
  '#1e1b4b','#312e81','#3730a3','#4338ca',
  '#4f46e5','#6366f1','#818cf8','#a5b4fc',
  '#7c3aed','#8b5cf6','#a78bfa','#c4b5fd',
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

      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
      camera.position.z = 7

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Counts — 3× previous (1 500 + 540 + 360 = 2 400 total) ──
      const NS = 1500, NB = 540, NR = 360
      const N  = NS + NB + NR

      interface Particle {
        bp: any; pos: any; vel: any
        sc: number; tp: 0|1|2; ix: number
      }

      const pts: Particle[] = []
      const col = PALETTE.map(h => new THREE.Color(h))
      let si = 0, bi = 0, ri = 0

      // Flattened ellipsoid → galaxy-disk distribution
      function sample(): any {
        for (;;) {
          const x = (Math.random() * 2 - 1) * 2.4
          const y = (Math.random() * 2 - 1) * 3.1
          const z = (Math.random() * 2 - 1) * 0.45
          if (x*x/5.76 + y*y/9.61 + z*z/0.20 <= 1)
            return new THREE.Vector3(x, y, z)
        }
      }

      for (let i = 0; i < N; i++) {
        const tp: 0|1|2 = i < NS ? 0 : i < NS+NB ? 1 : 2
        const bp = sample()
        pts.push({
          bp: bp.clone(), pos: bp.clone(), vel: new THREE.Vector3(),
          sc: 0.4 + Math.random() * 1.8,   // wide scale = size variety
          tp, ix: tp === 0 ? si++ : tp === 1 ? bi++ : ri++,
        })
      }

      // ── InstancedMesh for ALL three shape types ───────────────────
      // (user wants the actual 3-D shapes, just smaller and more of them)
      function mkIM(geo: any, n: number) {
        const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.80 })
        const im: any = new THREE.InstancedMesh(geo, mat, n)
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)
        scene.add(im)
        return im
      }

      // ~5× smaller than the "party popper" sizes — tiny but still visibly shaped
      // sphere r=0.007 → ~2 px at scale 1; box 0.009 → ~2.7 px; ring 0.004–0.009 → ~2 px
      const sIM = mkIM(new THREE.SphereGeometry(0.007, 5, 4), NS)
      const bIM = mkIM(new THREE.BoxGeometry(0.009, 0.009, 0.009), NB)
      const rIM = mkIM(new THREE.RingGeometry(0.004, 0.009, 5), NR)

      pts.forEach(p => {
        const c  = col[Math.floor(Math.random() * col.length)]
        const im = p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM
        im.setColorAt(p.ix, c)
      })
      ;[sIM, bIM, rIM].forEach((m: any) => { m.instanceColor.needsUpdate = true })

      // ── Mouse — global listener, lerp-smoothed ────────────────────
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
      }
      window.addEventListener('mousemove', onMouseMove)

      // ── Animation loop ────────────────────────────────────────────
      let raf: number
      const clk = new THREE.Clock()
      const dum = new THREE.Object3D()

      const animate = () => {
        raf = requestAnimationFrame(animate)
        const t = clk.getElapsedTime()

        rc.setFromCamera(m2d, camera)
        rc.ray.intersectPlane(zpl, m3dRaw)
        m3d.lerp(m3dRaw, 0.08)

        // ── Particle physics ───────────────────────────────────────
        pts.forEach(p => {
          const dx   = p.pos.x - m3d.x
          const dy   = p.pos.y - m3d.y
          const dz   = p.pos.z - m3d.z
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

        scene.rotation.y = Math.sin(t * 0.09) * 0.05
        scene.rotation.x = Math.sin(t * 0.07) * 0.020

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
