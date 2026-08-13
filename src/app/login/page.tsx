import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Log in',
  description:
    'Log in to your Buildfolio account to manage your projects and portfolio.',
}

export default function LoginPage() {
  return <LoginClient />
}
