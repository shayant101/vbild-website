import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import BildrInterview from '@/components/BildrInterview'

export const metadata: Metadata = {
  title: 'Start Building — Bildr by vbild.ai',
  description:
    'Describe your app idea in 5 minutes. Bildr, our AI product strategist, will conduct a structured interview and generate a full prototype and PRD — instantly.',
  openGraph: {
    title: 'Start Building — Bildr by vbild.ai',
    description:
      'Describe your app idea in 5 minutes. Bildr generates a full prototype and PRD — instantly.',
    url: 'https://vbild.ai/start',
    siteName: 'vbild.ai',
    type: 'website',
  },
}

export default function StartPage() {
  return (
    <div className="bildr-page">
      <NavBar />
      <main>
        <BildrInterview />
      </main>
      <Footer />
    </div>
  )
}
