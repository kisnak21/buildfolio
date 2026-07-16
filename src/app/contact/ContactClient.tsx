'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import realApiClient from '@/lib/api/realApiClient'

const ContactClient = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = 'Name is required.'
    if (!emailRegex.test(email.trim()))
      newErrors.email = 'Enter a valid email address.'
    if (!message.trim()) newErrors.message = 'Message is required.'

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    setServerError('')
    try {
      await realApiClient.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='bg-gray-50 min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-2xl mx-auto px-4 py-12 w-full'>
        <div className='mb-10'>
          <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
            Contact us
          </h1>
          <p className='text-sm text-gray-500'>
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </div>
        {submitted ? (
          <div className='bg-white border border-gray-200 rounded-xl p-8 text-center'>
            <p className='text-2xl mb-3'>✅</p>
            <h2 className='text-base font-semibold text-gray-900 mb-1'>
              Message sent!
            </h2>
            <p className='text-sm text-gray-500'>
              Thanks for reaching out. We&apos;ll get back to you shortly.
            </p>
          </div>
        ) : (
          <div className='bg-white border border-gray-200 rounded-xl p-6'>
            {serverError && (
              <p className='text-sm text-red-500 mb-4'>{serverError}</p>
            )}
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
              <div className='mb-6'>
                <label
                  htmlFor='message'
                  className='block text-xs text-gray-600 mb-1.5'
                >
                  Message
                </label>
                <textarea
                  id='message'
                  rows={5}
                  placeholder='Write your message here...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none ${
                    errors.message
                      ? 'border-red-500'
                      : 'border-gray-200 focus:border-primary'
                  }`}
                />
                {errors.message && (
                  <p className='text-xs text-red-500 mt-1.5'>
                    {errors.message}
                  </p>
                )}
              </div>
              <Button type='submit' fullWidth disabled={submitting}>
                {submitting ? 'Sending...' : 'Send message'}
              </Button>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default ContactClient
