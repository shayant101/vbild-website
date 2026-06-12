'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const xSpring = useSpring(x, { stiffness: 150, damping: 22 })
  const ySpring = useSpring(y, { stiffness: 150, damping: 22 })

  // 3D rotation from normalized [-0.5, 0.5] cursor offset
  const rotateX = useTransform(ySpring, [-0.5, 0.5], [9, -9])
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-9, 9])

  // Moving shimmer that tracks cursor position across the card
  const shine = useTransform([xSpring, ySpring], ([lx, ly]: number[]) => {
    const px = ((lx as number) + 0.5) * 100
    const py = ((ly as number) + 0.5) * 100
    return `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.09), rgba(99,102,241,0.04) 40%, transparent 65%)`
  })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2))
    y.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2))
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      className={className}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        position: 'relative',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ translateY: -7 }}
      transition={{ translateY: { duration: 0.3, ease: 'easeOut' } }}
    >
      {children}
      {/* Moving shimmer overlay */}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: shine,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </motion.div>
  )
}
