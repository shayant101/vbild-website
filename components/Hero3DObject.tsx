'use client'

import { useEffect, useRef } from 'react'

export default function Hero3DObject() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cleanup: (() => void) | undefined

    import('three').then((THREE) => {
      const container = containerRef.current!
      const W = container.offsetWidth || 700
      const H = container.offsetHeight || 700

      // ── Scene / Camera / Renderer ──────────────────────────────────
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200)
      camera.position.z = 7.5

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      // ── Central AI Core (Octahedron — sharp, angular, tech) ───────
      const coreGeo = new THREE.OctahedronGeometry(0.68, 2)
      const coreMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#050514'),
        emissive: new THREE.Color('#4f46e5'),
        emissiveIntensity: 1.6,
        roughness: 0.04,
        metalness: 1.0,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      scene.add(core)

      // Core edge outline
      const coreEdges = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.69, 2))
      const coreEdgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#a5b4fc'),
        transparent: true,
        opacity: 1.0,
      })
      const coreEdgeLines = new THREE.LineSegments(coreEdges, coreEdgeMat)
      scene.add(coreEdgeLines)

      // Layered glow halos around core
      const haloData: [number, string, number][] = [
        [0.88, '#6366f1', 0.14],
        [1.10, '#818cf8', 0.07],
        [1.45, '#a78bfa', 0.03],
      ]
      haloData.forEach(([r, col, op]) => {
        const m = new THREE.MeshBasicMaterial({
          color: new THREE.Color(col),
          transparent: true,
          opacity: op,
          side: THREE.BackSide,
        })
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), m))
      })

      // ── Inner atomic rings orbiting the core ─────────────────────
      const ringDefs: [number, number, string, number, number][] = [
        [1.15, 0.012, '#22d3ee', Math.PI / 2,  0],
        [1.05, 0.010, '#818cf8', Math.PI / 3.5, Math.PI / 4],
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const innerRings: any[] = ringDefs.map(([r, tube, col, rx, ry]) => {
        const m = new THREE.MeshBasicMaterial({
          color: new THREE.Color(col),
          transparent: true,
          opacity: 0.7,
        })
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 120), m)
        ring.rotation.set(rx, ry, 0)
        scene.add(ring)
        return ring
      })

      // ── Orbiting App Panels ───────────────────────────────────────
      type PanelDef = {
        orbitR: number
        tiltX: number
        tiltY: number
        speed: number
        phase: number
        col: string
      }
      const panelDefs: PanelDef[] = [
        { orbitR: 2.3, tiltX: 0.45, tiltY:  0.15, speed:  0.38, phase: 0,               col: '#22d3ee' },
        { orbitR: 2.8, tiltX:-0.55, tiltY:  0.60, speed: -0.26, phase: Math.PI * 0.5,   col: '#818cf8' },
        { orbitR: 2.1, tiltX: 0.70, tiltY: -0.35, speed:  0.52, phase: Math.PI,         col: '#06b6d4' },
        { orbitR: 3.0, tiltX:-0.25, tiltY: -0.55, speed: -0.32, phase: Math.PI * 1.5,   col: '#a78bfa' },
      ]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const panels: any[] = panelDefs.map((def) => {
        const group = new THREE.Group()

        // Panel body (phone/app screen shape)
        const bodyGeo = new THREE.BoxGeometry(0.60, 1.0, 0.040)
        const bodyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#060618'),
          emissive: new THREE.Color(def.col),
          emissiveIntensity: 0.12,
          transparent: true,
          opacity: 0.88,
          roughness: 0.08,
          metalness: 0.95,
        })
        group.add(new THREE.Mesh(bodyGeo, bodyMat))

        // Glowing edge outline
        const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.615, 1.015, 0.042))
        const edgeMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(def.col),
          transparent: true,
          opacity: 0.95,
        })
        group.add(new THREE.LineSegments(edgeGeo, edgeMat))

        // UI content lines (app screen wireframe)
        const uiGroup = new THREE.Group()
        uiGroup.position.z = 0.024
        const uiMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(def.col),
          transparent: true,
          opacity: 0.28,
        })

        // Header bar
        const hdrGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.22, 0.38, 0), new THREE.Vector3(0.22, 0.38, 0),
        ])
        uiGroup.add(new THREE.Line(hdrGeo, uiMat))

        // Filled header block
        const hdrFillMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(def.col),
          transparent: true,
          opacity: 0.20,
        })
        const hdrFill = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.10), hdrFillMat)
        hdrFill.position.set(0, 0.38, 0)
        uiGroup.add(hdrFill)

        // Horizontal content lines (different widths = UI rows)
        const rowWidths = [0.36, 0.28, 0.40, 0.22, 0.34, 0.26, 0.38]
        rowWidths.forEach((w, i) => {
          const y = 0.22 - i * 0.10
          const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-w / 2, y, 0),
            new THREE.Vector3(w / 2, y, 0),
          ])
          uiGroup.add(new THREE.Line(geo, uiMat))
        })

        // Two small "button" blocks at bottom
        const btnMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(def.col),
          transparent: true,
          opacity: 0.22,
        })
        ;[-0.10, 0.10].forEach((x) => {
          const btn = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.05), btnMat)
          btn.position.set(x, -0.38, 0)
          uiGroup.add(btn)
        })

        group.add(uiGroup)
        scene.add(group)

        return { group, def }
      })

      // ── Data stream beams (core → panels) ────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const beams: any[] = panels.map((p) => {
        const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(p.def.col),
          transparent: true,
          opacity: 0.30,
        })
        const line = new THREE.Line(geo, mat)
        scene.add(line)
        return { line, panel: p }
      })

      // ── Traveling data particles along each beam ──────────────────
      const BEAM_PTS = 10
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const beamStreams: any[] = panels.map((p, i) => {
        const arr = new Float32Array(BEAM_PTS * 3)
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
        const mat = new THREE.PointsMaterial({
          color: new THREE.Color(p.def.col),
          size: 0.06,
          transparent: true,
          opacity: 0.85,
        })
        const pts = new THREE.Points(geo, mat)
        scene.add(pts)
        return { pts, arr, panel: p, offset: i * (Math.PI / 2) }
      })

      // ── Outer particle field ──────────────────────────────────────
      const COUNT = 650
      const ppos = new Float32Array(COUNT * 3)
      for (let i = 0; i < COUNT; i++) {
        const r = 1.8 + Math.random() * 3.0
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        ppos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
        ppos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        ppos[i * 3 + 2] = r * Math.cos(phi)
      }
      const ptGeo = new THREE.BufferGeometry()
      ptGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3))
      const ptMat = new THREE.PointsMaterial({
        color: new THREE.Color('#c7d2fe'),
        size: 0.020,
        transparent: true,
        opacity: 0.50,
      })
      const particles = new THREE.Points(ptGeo, ptMat)
      scene.add(particles)

      // ── Lights ───────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 0.18))
      const lightDefs: [string, number, number, [number, number, number]][] = [
        ['#4f46e5', 7, 20, [ 0,  0, 3.5]],
        ['#06b6d4', 3, 16, [ 4,  2, 2  ]],
        ['#8b5cf6', 3, 14, [-3, -3, 1.5]],
        ['#ffffff', 1, 10, [ 0,  5, 4  ]],
      ]
      lightDefs.forEach(([col, intensity, dist, [x, y, z]]) => {
        const l = new THREE.PointLight(new THREE.Color(col), intensity, dist)
        l.position.set(x, y, z)
        scene.add(l)
      })

      // ── Mouse tracking ────────────────────────────────────────────
      let mx = 0, my = 0
      const onMouse = (e: MouseEvent) => {
        mx = (e.clientX / window.innerWidth  - 0.5) * 2
        my = -(e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouse)

      // ── Animate ───────────────────────────────────────────────────
      let raf: number
      const clock = new THREE.Clock()

      const animate = () => {
        raf = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()

        // Core pulse + spin
        const pulse = 1 + Math.sin(t * 2.2) * 0.05
        core.scale.setScalar(pulse)
        coreEdgeLines.scale.setScalar(pulse)
        coreMat.emissiveIntensity = 1.3 + Math.sin(t * 2.2) * 0.5

        core.rotation.y = t * 0.55
        core.rotation.x = t * 0.30
        coreEdgeLines.rotation.copy(core.rotation)

        // Inner rings spin
        innerRings[0].rotation.z = t * 0.9
        innerRings[1].rotation.z = -t * 0.7

        // Orbit panels in tilted planes
        panels.forEach((p) => {
          const angle = t * p.def.speed + p.def.phase
          const r = p.def.orbitR

          // Circle in XZ, then tilt
          const x0 = r * Math.cos(angle)
          const z0 = r * Math.sin(angle)

          // Tilt around X
          const cosTx = Math.cos(p.def.tiltX)
          const sinTx = Math.sin(p.def.tiltX)
          const y1 = z0 * sinTx
          const z1 = z0 * cosTx

          // Tilt around Y
          const cosTy = Math.cos(p.def.tiltY)
          const sinTy = Math.sin(p.def.tiltY)
          const x2 = x0 * cosTy + z1 * sinTy
          const z2 = -x0 * sinTy + z1 * cosTy

          p.group.position.set(x2, y1, z2)

          // Face camera + gentle float
          p.group.lookAt(camera.position)
          p.group.position.y += Math.sin(t * 0.9 + p.def.phase) * 0.06
        })

        // Update beam lines
        beams.forEach((b) => {
          const pp = b.panel.group.position
          const arr = b.line.geometry.attributes.position.array as Float32Array
          arr[0] = 0; arr[1] = 0; arr[2] = 0
          arr[3] = pp.x; arr[4] = pp.y; arr[5] = pp.z
          b.line.geometry.attributes.position.needsUpdate = true
        })

        // Animate traveling particles along beams
        beamStreams.forEach((bs) => {
          const pp = bs.panel.group.position
          for (let i = 0; i < BEAM_PTS; i++) {
            const frac = ((i / BEAM_PTS + t * 0.65 + bs.offset) % 1.0)
            // Slight arc via sine offset
            const arc = Math.sin(frac * Math.PI) * 0.25
            bs.arr[i * 3]     = pp.x * frac
            bs.arr[i * 3 + 1] = pp.y * frac + arc
            bs.arr[i * 3 + 2] = pp.z * frac
          }
          bs.pts.geometry.attributes.position.needsUpdate = true
        })

        // Particle field slow drift
        particles.rotation.y = t * 0.025
        particles.rotation.x = t * 0.012

        // Mouse parallax
        scene.rotation.y += (mx * 0.42 - scene.rotation.y) * 0.045
        scene.rotation.x += (my * 0.25 - scene.rotation.x) * 0.045

        renderer.render(scene, camera)
      }
      animate()

      // ── Resize ───────────────────────────────────────────────────
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
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement)
        }
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
