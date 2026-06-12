import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import CursorLoader from '@/components/CursorLoader'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300','400','500','600','700','800','900'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['300','400','500','600','700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vbild — The App Platform for Small Businesses',
  description: 'Vbild builds AI-powered apps for small businesses — restaurants, smoke shops, gaming venues, and more. Custom apps in days, not months.',
  metadataBase: new URL('https://vbild.ai'),
  openGraph: {
    title: 'Vbild — The App Platform for Small Businesses',
    description: 'Custom AI-powered apps for SMBs. Built in days, not months.',
    url: 'https://vbild.ai',
    siteName: 'Vbild',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vbild — The App Platform for Small Businesses',
    description: 'Custom AI-powered apps for SMBs. Built in days, not months.',
  },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        {/* Cursor dot + ring + spotlight — client-only via CursorLoader wrapper */}
        <CursorLoader />

        {/* Page content — z:2 ensures it stacks above the spotlight (z:1) */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {children}
        </div>

        {/* Vercel Analytics */}
        <Analytics />

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        {/* Meta Pixel */}
        {PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  )
}
