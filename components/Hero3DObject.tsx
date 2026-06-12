/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useRef } from 'react'

// ── Physics ──────────────────────────────────────────────────────────────────
const REPEL_R  = 0.50
const REPEL_F  = 0.14
const SPRING_K = 0.045
const DAMPING  = 0.88

// Deep-space indigo / violet — monochromatic
const PALETTE = [
  '#1e1b4b','#312e81','#3730a3','#4338ca',
  '#4f46e5','#6366f1','#818cf8','#a5b4fc',
  '#7c3aed','#8b5cf6','#a78bfa','#c4b5fd',
]

// ── Six app-vertical nodes (Phase 1 — idle only) ─────────────────────────────
// Positions spread across the Gaussian cloud (σx=0.65, σy=0.85) so each node
// sits inside the dense region but isn't hidden by other nodes.
// Geometries chosen for visual distinctiveness at ~0.09 world-unit radius.
const NODE_DATA = [
  { label: 'restaurant',    x: -0.48, y:  0.42, z:  0.05, color: '#818cf8', geo: 'icosa'  },
  { label: 'smoke shop',    x:  0.54, y:  0.50, z: -0.05, color: '#a78bfa', geo: 'octa'   },
  { label: 'gaming venue',  x: -0.62, y: -0.08, z:  0.05, color: '#c4b5fd', geo: 'box'    },
  { label: 'ranch event',   x:  0.57, y: -0.28, z: -0.05, color: '#6366f1', geo: 'tetra'  },
  { label: 'booking venue', x: -0.26, y: -0.58, z:  0.00, color: '#8b5cf6', geo: 'sphere' },
  { label: 'business',      x:  0.32, y: -0.62, z:  0.00, color: '#4338ca', geo: 'dodeca' },
] as const

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

      // More even split so shape diversity is visible (1100 + 800 + 500 = 2400)
      const NS = 1100, NB = 800, NR = 500
      const N  = NS + NB + NR

      interface Particle {
        bp: any; pos: any; vel: any
        sc: number; tp: 0|1|2; ix: number
      }

      const pts: Particle[] = []
      const col = PALETTE.map(h => new THREE.Color(h))
      let si = 0, bi = 0, ri = 0

      // Gaussian distribution — dense core, sparse outliers (true galaxy concentration)
      function gauss() {
        const u1 = 1 - Math.random()   // avoid log(0)
        const u2 = Math.random()
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      }

      function sample(): any {
        // Tight σ = 0.65/0.85/0.13 → 68% within a small core, true outliers rare
        // This creates clear density gradient: bright dense centre, sparse edges
        const x = gauss() * 0.65
        const y = gauss() * 0.85
        const z = gauss() * 0.13
        return new THREE.Vector3(x, y, z)
      }

      for (let i = 0; i < N; i++) {
        const tp: 0|1|2 = i < NS ? 0 : i < NS+NB ? 1 : 2
        const bp = sample()
        pts.push({
          bp: bp.clone(), pos: bp.clone(), vel: new THREE.Vector3(),
          sc: 0.3 + Math.random() * 1.1,   // 0.3–1.4 — tighter range, no giant shapes
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

      // Small enough to feel like particles, large enough to read shape:
      // sphere r=0.010 → ~2px at scale 1, ~3px at scale 1.4
      // box 0.013³   → corners visible at scale 1.0+
      // ring 0.007–0.013 → ring silhouette at scale 1.2+
      const sIM = mkIM(new THREE.SphereGeometry(0.010, 5, 4), NS)
      const bIM = mkIM(new THREE.BoxGeometry(0.013, 0.013, 0.013), NB)
      const rIM = mkIM(new THREE.RingGeometry(0.007, 0.013, 6), NR)

      pts.forEach(p => {
        const c  = col[Math.floor(Math.random() * col.length)]
        const im = p.tp === 0 ? sIM : p.tp === 1 ? bIM : rIM
        im.setColorAt(p.ix, c)
      })
      ;[sIM, bIM, rIM].forEach((m: any) => { m.instanceColor.needsUpdate = true })

      // ── Nodes: solid mesh + edge wireframe + additive glow sprite ────
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
        gr.addColorStop(0,    `rgba(${rr},${gg},${bb},1)`)
        gr.addColorStop(0.25, `rgba(${rr},${gg},${bb},0.4)`)
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

      interface NodeObj { bx: number; by: number; bz: number; solid: any; wire: any; glow: any }
      const nodeObjs: NodeObj[] = NODE_DATA.map(nd => {
        const geo = nodeGeoMap[nd.geo]

        const solid: any = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: new THREE.Color(nd.color), transparent: true, opacity: 0.90 })
        )
        solid.position.set(nd.x, nd.y, nd.z)
        scene.add(solid)

        const wire: any = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: new THREE.Color(nd.color), transparent: true, opacity: 0.40 })
        )
        wire.position.copy(solid.position)
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
        glow.scale.setScalar(0.52)
        scene.add(glow)

        return { bx: nd.x, by: nd.y, bz: nd.z, solid, wire, glow }
      })

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

        // ── Node idle animation (bob + rotate + pulse) ─────────────────
        nodeObjs.forEach((nd, i) => {
          const ph    = i * 1.05
          const bob   = Math.sin(t * 0.38 + ph) * 0.035
          const pulse = 1 + Math.sin(t * 0.72 + ph) * 0.07
          const py    = nd.by + bob
          nd.solid.position.set(nd.bx, py, nd.bz)
          nd.solid.rotation.y = t * 0.28 + ph
          nd.solid.rotation.x = t * 0.17 + ph * 0.6
          nd.solid.scale.setScalar(pulse)
          nd.wire.position.copy(nd.solid.position)
          nd.wire.rotation.copy(nd.solid.rotation)
          nd.wire.scale.copy(nd.solid.scale)
          nd.glow.position.copy(nd.solid.position)
          nd.glow.scale.setScalar(0.52 * pulse)
        })

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
