import { useState } from 'react'
import realApiClient from '@/lib/api/realApiClient'
import { showToast } from '@/store/redux/toastSlice'
import { useAppDispatch } from '@/store/redux/hooks'
import { buttonClass } from '@/components/ui/buttonClass'

export type ReportTarget = { type: 'project' | 'comment'; id: string }

const REASON_OPTIONS = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'broken', label: 'Broken link or content' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'other', label: 'Other' },
]

interface ReportModalProps {
  target: ReportTarget
  onClose: () => void
  onReported: () => void
}

const ReportModal = ({ target, onClose, onReported }: ReportModalProps) => {
  const dispatch = useAppDispatch()
  const [reason, setReason] = useState(REASON_OPTIONS[0].value)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await realApiClient.post('/flags', {
        targetType: target.type,
        targetId: target.id,
        reason,
        details: details.trim() || undefined,
      })
      dispatch(
        showToast({
          message: 'Report submitted. Thanks for keeping Buildfolio safe.',
          type: 'success',
        }),
      )
      onReported()
      onClose()
    } catch (err: unknown) {
      dispatch(
        showToast({
          message:
            err instanceof Error ? err.message : 'Failed to submit report',
          type: 'error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-dark/60 p-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
    >
      <div
        className='w-full max-w-md bg-white border-4 border-dark rounded-2xl p-6 shadow-brutal'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-2xl font-black mb-1'>Report content</h2>
        <p className='text-sm font-bold text-gray-600 mb-5'>
          {target.type === 'project'
            ? 'Reporting this project'
            : 'Reporting this comment'}
        </p>

        <form onSubmit={submit}>
          <label className='block text-sm font-black mb-1.5' htmlFor='flag-reason'>
            Reason
          </label>
          <select
            id='flag-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className='input-brutal w-full bg-inputBg border-2 border-dark rounded-xl px-4 py-2.5 font-bold shadow-brutal-sm mb-4'
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label
            className='block text-sm font-black mb-1.5'
            htmlFor='flag-details'
          >
            Details{' '}
            <span className='text-xs font-bold text-gray-500'>(optional)</span>
          </label>
          <textarea
            id='flag-details'
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder='Add more context for the moderators…'
            className='input-brutal w-full bg-inputBg border-2 border-dark rounded-xl px-4 py-2.5 font-medium shadow-brutal-sm resize-none mb-5'
          />

          <div className='flex gap-3 justify-end'>
            <button
              type='button'
              onClick={onClose}
              className={`${buttonClass('secondary', 'md')}`}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={submitting}
              className={`${buttonClass('danger', 'md')} disabled:opacity-50`}
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportModal
