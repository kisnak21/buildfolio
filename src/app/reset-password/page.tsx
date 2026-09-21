import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'
import AuthPageSkeleton from '@/components/ui/AuthPageSkeleton'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Reset Password | Buildfolio',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton fieldCount={2} />}>
      <ResetPasswordClient />
    </Suspense>
  )
}
