'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/store/redux/authSlice'
import { registerUser, loginUserApi } from '@/lib/api/authApi'
import AuthCard from '@/components/layout/AuthCard'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import GoogleButton from '@/components/ui/GoogleButton'
import Divider from '@/components/ui/Divider'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isPasswordStrong = (pw: string): boolean => {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw)
  )
}

const RegisterClient = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Name is required.'
    if (!emailRegex.test(email.trim()))
      newErrors.email = 'Enter a valid email address.'
    if (!isPasswordStrong(password)) {
      const pwErrors: string[] = []
      if (password.length < 8) pwErrors.push('at least 8 characters')
      if (!/[A-Z]/.test(password)) pwErrors.push('one uppercase letter')
      if (!/[a-z]/.test(password)) pwErrors.push('one lowercase letter')
      if (!/[0-9]/.test(password)) pwErrors.push('one number')
      newErrors.password = `Password requires: ${pwErrors.join(', ')}.`
    }
    if (confirmPassword !== password)
      newErrors.confirmPassword = 'Passwords do not match.'
    if (!agreed) newErrors.agreed = 'You must agree to the privacy policy.'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password })
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
      router.push('/')
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ email: 'An account with this email already exists.' })
      } else {
        setErrors({
          confirmPassword: 'Something went wrong. Please try again.',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50'>
      <AuthCard
        title='Create an account'
        subtitle='Start building your portfolio today'
      >
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label='Full name'
            id='name'
            placeholder='John Doe'
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
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
          />
          <Input
            label='Confirm password'
            type='password'
            id='confirm-password'
            placeholder='••••••••'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
          <div className='mb-6'>
            <Checkbox
              id='privacy'
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              error={errors.agreed}
              label={
                <>
                  I agree to the{' '}
                  <Link
                    href='/privacy'
                    className='text-primary hover:text-primary-hover transition-colors'
                  >
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link
                    href='/terms'
                    className='text-primary hover:text-primary-hover transition-colors'
                  >
                    Terms of Service
                  </Link>
                </>
              }
            />
          </div>
          <div className='mb-3'>
            <Button type='submit' fullWidth disabled={submitting}>
              {submitting ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>
          <GoogleButton>Continue with Google</GoogleButton>
        </form>

        <Divider />

        <p className='text-center text-sm text-gray-500'>
          Already have an account?{' '}
          <Link
            href='/login'
            className='text-primary hover:text-primary-hover transition-colors font-medium'
          >
            Log in
          </Link>
        </p>
      </AuthCard>
    </div>
  )
}

export default RegisterClient
