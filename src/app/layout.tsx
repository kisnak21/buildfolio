import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ReduxProvider from '@/store/redux/provider'
import AuthSessionProvider from '@/components/auth/AuthSessionProvider'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <ReduxProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
