'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { loginUser } from '@/store/redux/authSlice'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function GoogleCallback() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const exchange = async () => {
      try {
        const res = await fetch('/api/auth/exchange', { method: 'POST' })
        if (!res.ok) throw new Error('Exchange failed')
        const data = await res.json()
        // Persist user to localStorage + Redux so header detects login
        localStorage.setItem('buildfolio_user', JSON.stringify(data.user))
        dispatch(loginUser(data.user))
        router.push('/dashboard')
      } catch (err) {
        setStatus('error')
      }
    }
    exchange()
  }, [router, dispatch])

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-4xl mx-auto px-4 py-12 w-full'>
        {status === 'loading' ? (
          <p className='text-sm text-gray-500'>Signing you in with Google...</p>
        ) : (
          <p className='text-sm text-red-500'>
            Something went wrong. <a href='/login' className='underline'>Back to login</a>
          </p>
        )}
      </main>
      <Footer />
    </div>
  )
}
