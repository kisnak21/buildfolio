'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function GoogleCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing Google sign-in...')

  useEffect(() => {
    const finish = async () => {
      try {
        const res = await fetch('/api/auth/exchange', { method: 'POST' })
        if (!res.ok) throw new Error('Exchange failed')
        setStatus('Signed in. Redirecting...')
        router.replace('/dashboard')
      } catch {
        setStatus('Google sign-in failed. Try again.')
        router.replace('/login?error=google')
      }
    }
    finish()
  }, [router])

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-2xl mx-auto px-4 py-20 w-full flex items-center justify-center'>
        <p className='text-sm text-gray-500'>{status}</p>
      </main>
      <Footer />
    </div>
  )
}
