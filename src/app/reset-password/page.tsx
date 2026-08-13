import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Reset Password | Buildfolio',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-bgMain' />}>
      <ResetPasswordClient />
    </Suspense>
  )
}