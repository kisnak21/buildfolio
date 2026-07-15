import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Log in',
  description:
    'Log in to your Buildfolio account to manage your projects and portfolio.',
}

export default function LoginPage() {
  return <LoginClient />
}
