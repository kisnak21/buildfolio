'use client'

import { useEffect } from 'react'
import Link from 'next/link'

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
          <button
            onClick={reset}
            className='btn-brutal bg-primary text-dark border-2 border-dark px-6 py-3 rounded-xl shadow-brutal font-bold hover:bg-pink-400'
          >
            Try again
          </button>
          <Link
            href='/'
            className='btn-brutal bg-white text-dark border-2 border-dark px-6 py-3 rounded-xl shadow-brutal font-bold hover:bg-yellow-100'
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
