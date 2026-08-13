import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Verify Email | Buildfolio',
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-bgMain' />}>
      <VerifyEmailClient />
    </Suspense>
  )
}
