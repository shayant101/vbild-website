import type { Metadata } from 'next'
import Link from 'next/link'
import LiveDemo from '@/components/demo/LiveDemo'

export const metadata: Metadata = {
  title: 'Live demo — Vbild builds a business app in about a minute',
  description: 'Pick a restaurant, smoke shop, VR arena or ranch. Watch Vbild interview the owner, write the spec, build and deploy a working app — live in your browser.',
  openGraph: { title: 'Vbild live demo', description: 'Watch a small-business app get built in about a minute.', url: 'https://vbild.ai/demo', siteName: 'Vbild', type: 'website' },
}

export default function DemoPage() {
  return (
    <div className="demo-page">
      <header className="demo-head">
        <Link href="/" className="demo-logo">Vbild</Link>
        <span className="demo-head-mid">Live build demo</span>
        <Link href="/" className="demo-back">← vbild.ai</Link>
      </header>
      <LiveDemo />
    </div>
  )
}
