import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Create an account',
  description:
    'Join Buildfolio and start showcasing your developer projects to the world.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
