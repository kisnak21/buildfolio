import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Forgot Password | Buildfolio',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
