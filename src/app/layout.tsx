import type { Metadata } from 'next'
import { Public_Sans } from 'next/font/google'
import './globals.css'
import ReduxProvider from '@/store/redux/provider'
import AuthSessionProvider from '@/components/auth/AuthSessionProvider'

const publicSans = Public_Sans({ subsets: ['latin'], weight: ['400', '600', '800', '900'] })

export const metadata: Metadata = {
  title: {
    default:
      'Buildfolio — Discover Projects. Share Ideas. Build Your Portfolio.',
    template: '%s — Buildfolio',
  },
  description:
    'Discover projects, share ideas, and build your portfolio. The platform for developers to showcase their work.',
  openGraph: {
    siteName: 'Buildfolio',
    type: 'website',
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
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
