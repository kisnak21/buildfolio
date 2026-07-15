import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Create an account',
  description:
    'Join Buildfolio and start showcasing your developer projects to the world.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
