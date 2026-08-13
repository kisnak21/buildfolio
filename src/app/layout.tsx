import type { Metadata } from 'next'
import { Public_Sans } from 'next/font/google'
import './globals.css'
import ReduxProvider from '@/store/redux/provider'
import Toast from '@/components/ui/Toast'

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Buildfolio',
    template: '%s — Buildfolio',
  },
  description:
    'Discover projects, share ideas, and build your portfolio. The platform for developers to showcase their work.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Buildfolio',
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className={`${publicSans.className} antialiased min-h-screen flex flex-col`}>
        <ReduxProvider>
          {children}
          <Toast />
        </ReduxProvider>
      </body>
    </html>
  )
}