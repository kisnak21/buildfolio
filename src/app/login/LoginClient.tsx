'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/store/redux/authSlice'
import { loginUserApi } from '@/lib/api/authApi'
import AuthCard from '@/components/layout/AuthCard'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import GoogleButton from '@/components/ui/GoogleButton'
import Divider from '@/components/ui/Divider'
import { signIn } from 'next-auth/react'


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  const handleGoogleSignIn = async () => {
    if (googleSubmitting || submitting) return
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
          token: result.token,
        }),
      )
      const redirectTo = searchParams.get('redirect') || '/'
      router.push(redirectTo)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrors({ password: 'Invalid email or password.' })
      } else {
        setErrors({ password: 'Something went wrong. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-gray-50'>
      <AuthCard
        title='Welcome back'
        subtitle='Log in to your Buildfolio account'
      >
        <form onSubmit={handleSubmit} noValidate>
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
              <a
                href='#'
                className='text-xs text-primary hover:text-primary-hover transition-colors'
              >
                Forgot password?
              </a>
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
            <Button type='submit' fullWidth disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log in'}
            </Button>
          </div>
          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={submitting || googleSubmitting}
          >
            {googleSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
          </GoogleButton>
        </form>

        <Divider />

        <p className='text-center text-sm text-gray-500'>
          Don&apos;t have an account?{' '}
          <Link
            href='/register'
            className='text-primary hover:text-primary-hover transition-colors font-medium'
          >
            Register
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}

export default LoginClient
