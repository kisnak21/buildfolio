import type { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Reset Password | Buildfolio',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-bgMain' />}>
      <ResetPasswordClient />
    </Suspense>
  )
}