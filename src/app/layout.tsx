import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title:       'VaarSamen — Vind jouw zeilmaatje',
  description: 'Koppel met zeilers op basis van CWO-niveau, locatie en beschikbaarheid. De slimste manier om een betrouwbaar zeilmaatje te vinden.',
  keywords:    ['zeilen', 'zeilmaatje', 'CWO', 'IJsselmeer', 'Friese Meren', 'schipper', 'bemanning'],
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'VaarSamen' },
  openGraph: {
    title:       'VaarSamen',
    description: 'Vind jouw zeilmaatje',
    type:        'website',
    locale:      'nl_NL',
  },
}

export const viewport: Viewport = {
  themeColor:           '#071325',
  width:                'device-width',
  initialScale:         1,
  maximumScale:         1,
  userScalable:         false,
  viewportFit:          'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon" />
      </head>
      <body className="min-h-full bg-surface text-on-surface">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
