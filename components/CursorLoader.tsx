'use client'

import dynamic from 'next/dynamic'

// Loaded client-side only — needs window, requestAnimationFrame
const CursorEffects = dynamic(() => import('./CursorEffects'), { ssr: false })

export default function CursorLoader() {
  return <CursorEffects />
}
