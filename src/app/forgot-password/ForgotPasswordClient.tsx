'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthCard from '@/components/layout/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ForgotPasswordClient = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRegex.test(email.trim())) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('sending')
    setMessage('')
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        setStatus('error')
        setMessage(data.message || 'Something went wrong. Please try again.')
        return
      }
      setStatus('sent')
      setMessage('If an account exists for this email, a reset link has been sent.')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-10 bg-bgMain'>
      <AuthCard title='Forgot Password' subtitle='We will email you a link to reset your password.'>
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

        {status !== 'sent' && (
          <form onSubmit={handleSubmit} noValidate>
            <Input
              label='Email'
              type='email'
              id='email'
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className='mb-3'>
              <Button type='submit' fullWidth disabled={status === 'sending'} variant='primary'>
                {status === 'sending' ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </form>
        )}

        <p className='text-center text-sm font-bold text-dark'>
          Remembered your password?{' '}
          <Link
            href='/login'
            className='text-primaryDark hover:underline transition-colors'
          >
            Log in
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}

export default ForgotPasswordClient
