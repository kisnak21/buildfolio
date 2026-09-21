import type { Metadata } from 'next'

const noIndex: Metadata = {
  robots: { index: false, follow: false },
}
import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'
import AuthPageSkeleton from '@/components/ui/AuthPageSkeleton'

export const metadata: Metadata = {
  ...noIndex,
  title: 'Verify Email | Buildfolio',
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton fieldCount={1} />}>
      <VerifyEmailClient />
    </Suspense>
  )
}
