'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-bgMain'>
      <div className='max-w-md w-full text-center'>
        <h1 className='text-4xl font-black text-dark mb-4'>Something went wrong</h1>
        <p className='font-bold text-gray-600 mb-6'>
          An unexpected error occurred. Please try again.
        </p>
        <div className='flex flex-col gap-3'>
          <Button onClick={reset} fullWidth>
            Try again
          </Button>
          <Link href='/' className={buttonClass('secondary')}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
