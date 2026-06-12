import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import LivingInterface from '@/components/LivingInterface'

export const metadata: Metadata = {
  title: 'The New World — Vbild',
  description:
    'In the old world, your business adapted to software. In the new world, software adapts to your business. Watch the same app reshape itself for a ranch, a restaurant, a smoke shop, and a venue.',
  metadataBase: new URL('https://vbild.ai'),
  openGraph: {
    title: 'The New World — Vbild',
    description:
      'Same primitives. Different software. Yours. Watch the Living Interface morph for every business type.',
    url: 'https://vbild.ai/new-world',
    siteName: 'Vbild',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The New World — Vbild',
    description: 'Same primitives. Different software. Yours.',
  },
}

export default function NewWorldPage() {
  return (
    <>
      <NavBar />
      <main>
        <LivingInterface />
      </main>
      <Footer />
    </>
  )
}
