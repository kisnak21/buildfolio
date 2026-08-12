import type { Metadata } from 'next'
import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Verify Email | Buildfolio',
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-bgMain' />}>
      <VerifyEmailClient />
    </Suspense>
  )
}
