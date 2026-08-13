'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '@/components/layout/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const isPasswordStrong = (pw: string): boolean => {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw)
  )
}

const ResetPasswordClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordStrong(newPassword)) {
      setStatus('error')
      setMessage('Password must be at least 8 characters with uppercase, lowercase, and a number.')
      return
    }
    if (confirmPassword !== newPassword) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }

    setStatus('submitting')
    setMessage('')
    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setStatus('error')
        setMessage(data.message || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (!token) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4 py-10 bg-bgMain'>
        <AuthCard title='Reset Password' subtitle='Set a new password for your account.'>
          <div role='alert' className='mb-6 px-4 py-3 border-2 border-red-600 bg-red-100 rounded-xl text-sm font-bold text-red-800'>
            Missing reset token. The link may be invalid or expired.
          </div>
          <p className='text-center text-sm font-bold text-dark'>
            <Link href='/forgot-password' className='text-primary hover:underline transition-colors'>
              Request a new reset link
            </Link>
          </p>
        </AuthCard>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-10 bg-bgMain'>
      <AuthCard title='Reset Password' subtitle='Set a new password for your account.'>
        {status === 'success' && (
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

        {status !== 'success' && (
          <form onSubmit={handleSubmit} noValidate>
            <Input
              label='New password'
              type='password'
              id='new-password'
              placeholder='••••••••'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label='Confirm new password'
              type='password'
              id='confirm-password'
              placeholder='••••••••'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className='mb-3'>
              <Button type='submit' fullWidth disabled={status === 'submitting'} variant='primary'>
                {status === 'submitting' ? 'Resetting...' : 'Reset password'}
              </Button>
            </div>
          </form>
        )}

        <p className='text-center text-sm font-bold text-dark'>
          <Link
            href='/login'
            className='text-primary hover:underline transition-colors'
          >
            Back to login
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}

export default ResetPasswordClient