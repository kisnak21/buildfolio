'use client'

import { useEffect, useState } from 'react'
import { buttonClass } from '@/components/ui/buttonClass'

interface ModerationDialogProps {
  title: string
  message: string
  confirmLabel: string
  showUntil?: boolean
  onConfirm: (data: { reason: string; until?: string }) => Promise<void>
  onCancel: () => void
}

const ModerationDialog = ({
  title,
  message,
  confirmLabel,
  showUntil = false,
  onConfirm,
  onCancel,
}: ModerationDialogProps) => {
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const [minimumUntil] = useState(() =>
    new Date(Date.now() + 60_000).toISOString().slice(0, 16),
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, submitting])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await onConfirm({
        reason: reason.trim(),
        ...(showUntil && { until: new Date(until).toISOString() }),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-dark/60 p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='moderation-title'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onCancel()
      }}
    >
      <form
        onSubmit={submit}
        className='w-full max-w-md bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal-lg'
      >
        <h2 id='moderation-title' className='text-2xl font-black mb-2'>
          {title}
        </h2>
        <p className='text-sm font-bold text-gray-600 mb-5'>{message}</p>

        {showUntil && (
          <div className='mb-4'>
            <label htmlFor='moderation-until' className='block text-sm font-black mb-1.5'>
              Suspended until
            </label>
            <input
              id='moderation-until'
              type='datetime-local'
              required
              min={minimumUntil}
              value={until}
              onChange={(event) => setUntil(event.target.value)}
              className='w-full min-h-11 bg-inputBg border-2 border-dark rounded-xl px-4 py-2 font-bold shadow-brutal-sm'
            />
          </div>
        )}

        <label htmlFor='moderation-reason' className='block text-sm font-black mb-1.5'>
          Reason
        </label>
        <textarea
          id='moderation-reason'
          required
          maxLength={500}
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder='Visible to administrators only'
          className='w-full bg-inputBg border-2 border-dark rounded-xl px-4 py-3 font-medium shadow-brutal-sm resize-none mb-5'
        />

        <div className='flex flex-col-reverse sm:flex-row justify-end gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={submitting}
            className={`${buttonClass('secondary', 'md')} min-h-11`}
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={submitting}
            className={`${buttonClass('danger', 'md')} min-h-11 disabled:opacity-50`}
          >
            {submitting ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ModerationDialog
