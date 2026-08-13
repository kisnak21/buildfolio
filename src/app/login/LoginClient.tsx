'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/store/redux/authSlice'
import { showToast } from '@/store/redux/toastSlice'
import { loginUserApi } from '@/lib/api/authApi'
import AuthCard from '@/components/layout/AuthCard'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import GoogleButton from '@/components/ui/GoogleButton'
import Divider from '@/components/ui/Divider'
import { signIn } from 'next-auth/react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getSafeRedirect = (raw: string | null): string => {
  if (!raw) return '/'
  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) {
    return raw
  }
  return '/'
}

const LoginClient = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [needsVerification, setNeedsVerification] = useState<string | null>(null)

  const handleGoogle = async () => {
    setGoogleSubmitting(true)
    await signIn('google', { callbackUrl: '/auth/google-callback' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Enter a valid email address.'
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required.'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    try {
      const result = await loginUserApi({ email: email.trim(), password })
      dispatch(
        loginUser({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          bio: result.user.bio,
        }),
      )
      const redirectTo = getSafeRedirect(searchParams.get('redirect'))
      dispatch(showToast({ message: 'Welcome back!', type: 'success' }))
      router.push(redirectTo)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrors({ password: 'Invalid email or password.' })
      } else if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        setNeedsVerification(err.response?.data?.email || null)
        setErrors({})
      } else {
        setErrors({ password: 'Something went wrong. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-bgMain'>
      <AuthCard
        title='Welcome Back'
        subtitle='Log in to manage your projects.'
      >
        <form onSubmit={handleSubmit} noValidate>
          {needsVerification && (
            <div
              role='alert'
              className='mb-4 px-4 py-3 border-2 border-primary bg-primary/10 rounded-xl text-sm font-bold text-dark'
            >
              Please verify your email address before logging in.{' '}
              <Link
                href={`/verify-email?email=${encodeURIComponent(needsVerification)}`}
                className='text-primaryDark hover:underline underline-offset-2'
              >
                Resend verification email
              </Link>
            </div>
          )}
          <Input
            label='Email'
            type='email'
            id='email'
            placeholder='you@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label='Password'
            type='password'
            id='password'
            placeholder='••••••••'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            rightElement={
              <Link
                href='/forgot-password'
                className='text-xs text-primaryDark hover:text-primary transition-colors'
              >
                Forgot password?
              </Link>
            }
          />
          <div className='mb-6'>
            <Checkbox
              id='remember'
              label='Remember me'
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
          </div>
          <div className='mb-3'>
            <Button type='submit' fullWidth disabled={submitting} variant='primary'>
              {submitting ? 'Logging in...' : 'Log In'}
            </Button>
          </div>
        </form>

        <Divider text="or" />

        <div className='mb-6'>
          <GoogleButton onClick={handleGoogle} disabled={googleSubmitting}>
            {googleSubmitting ? 'Connecting...' : 'Google'}
          </GoogleButton>
        </div>

        <p className='text-center text-sm font-bold text-dark'>
          Don&apos;t have an account?{' '}
          <Link
            href='/register'
            className='text-primaryDark hover:underline transition-colors'
          >
            Register
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}

export default LoginClient
