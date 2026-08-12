'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/layout/AuthCard'
import Button from '@/components/ui/Button'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const VerifyEmailClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const token = searchParams.get('token')

  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false
    ;(async () => {
      setStatus('verifying')
      try {
        const response = await fetch(`/api/users/verify-email?token=${encodeURIComponent(token)}`)
        const data = await response.json()
        if (cancelled) return
        if (response.ok) {
          setStatus('verified')
          setMessage('Your email has been verified successfully!')
          setTimeout(() => router.push('/login'), 2500)
        } else {
          setStatus('error')
          setMessage(data.message || 'Invalid or expired verification link.')
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage('Something went wrong. Please try again.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, router])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRegex.test(email.trim())) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('sending')
    setMessage('')
    try {
      const response = await fetch('/api/users/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setStatus('error')
        setMessage(data.message || 'Failed to send verification email.')
        return
      }
      setStatus('sent')
      setMessage('Verification email sent! Check your inbox.')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-10 bg-bgMain'>
      <AuthCard title='Verify Your Email' subtitle='Confirm your email to activate your account.'>
        {status === 'verifying' && (
          <div role='status' className='mb-6 text-sm font-bold text-dark'>
            Verifying your email...
          </div>
        )}

        {status === 'verified' && (
          <div
            role='status'
            className='mb-6 px-4 py-3 border-2 border-green-600 bg-green-100 rounded-xl text-sm font-bold text-green-800'
          >
            {message} Redirecting to login...
          </div>
        )}

        {status !== 'verified' && status !== 'verifying' && (
          <>
            <div className='mb-6 text-sm font-bold text-dark leading-relaxed'>
              We sent a verification link to your inbox. Click the link in the email
              to verify your account, then log in to start building your portfolio.
            </div>

            {status === 'sent' && (
              <div
                role='status'
                className='mb-6 px-4 py-3 border-2 border-green-600 bg-green-100 rounded-xl text-sm font-bold text-green-800'
              >
                {message}
              </div>
            )}
            {status === 'error' && (
              <div
                role='alert'
                className='mb-6 px-4 py-3 border-2 border-red-600 bg-red-100 rounded-xl text-sm font-bold text-red-800'
              >
                {message}
              </div>
            )}

            <form onSubmit={handleResend} noValidate className='mb-6'>
              <label htmlFor='email' className='block text-sm font-bold text-dark mb-2'>
                Email address
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                className='w-full px-4 py-3 mb-4 bg-white border-2 border-dark rounded-xl font-bold shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-primary'
              />
              <Button type='submit' fullWidth disabled={status === 'sending'} variant='primary'>
                {status === 'sending' ? 'Sending...' : 'Resend verification email'}
              </Button>
            </form>
          </>
        )}

        <p className='text-center text-sm font-bold text-dark mb-2'>
          Already verified?{' '}
          <Link
            href='/login'
            className='text-primary hover:underline transition-colors'
          >
            Log in
          </Link>
        </p>
        <p className='text-center text-sm font-bold text-dark'>
          <Link
            href='/'
            className='text-dark hover:text-primary transition-colors'
          >
            Back to home
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}

export default VerifyEmailClient
