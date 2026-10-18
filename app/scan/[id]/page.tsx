import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ScanReport from '@/components/scan/ScanReport'
import { getScan } from '@/lib/scan/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const s = await getScan(id)
  const name = s?.report?.businessName || 'your business'
  return { title: `Vbild Scan — ${name}`, description: s?.report?.headline || 'Free app-readiness report', robots: { index: false }, openGraph: { title: `${name} · app-readiness ${s?.score ?? ''}/100`, description: s?.report?.headline || '', url: `https://vbild.ai/scan/${id}` } }
}

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <NavBar />
      <main className="scan-report-page"><div className="container"><ScanReport id={id} /></div></main>
      <Footer />
    </>
  )
}
