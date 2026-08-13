'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import realApiClient from '@/lib/api/realApiClient'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

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
    <div className='bg-bgMain text-dark min-h-screen flex flex-col'>
      <Header />
      <main className='flex-1 max-w-2xl mx-auto px-4 py-12 w-full'>
        <div className='mb-10 border-b-4 border-dark pb-6'>
          <h1 className='text-4xl font-black mb-2'>
            Contact us
          </h1>
          <p className='text-lg font-bold text-gray-600'>
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </div>
        {submitted ? (
          <div className='bg-white border-4 border-dark rounded-2xl p-12 text-center shadow-brutal'>
            <CheckCircleIcon className='w-20 h-20 text-green-500 mx-auto mb-4' />
            <h2 className='text-2xl font-black text-dark mb-2'>
              Message sent!
            </h2>
            <p className='font-medium text-gray-600'>
              Thanks for reaching out. We&apos;ll get back to you shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className='mt-8 btn-brutal inline-block bg-primary text-dark border-2 border-dark px-6 py-3 rounded-xl font-bold shadow-brutal-sm hover:bg-primaryDark hover:text-white'
            >
              Send another message
            </button>
          </div>
        ) : (
          <div className='bg-white border-4 border-dark rounded-2xl p-8 shadow-brutal'>
            {serverError && (
              <p className='text-sm font-bold text-red-600 mb-6'>{serverError}</p>
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
              <div className='mb-8'>
                <Textarea
                  id='message'
                  label='Message'
                  rows={5}
                  placeholder='Write your message here...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  error={errors.message}
                />
              </div>
              <Button type='submit' fullWidth disabled={submitting} variant='primary'>
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
