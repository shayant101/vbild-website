'use client'

import dynamic from 'next/dynamic'

const Hero3DObject = dynamic(() => import('./Hero3DObject'), { ssr: false })

export default function Hero3DLoader() {
  return <Hero3DObject />
}
