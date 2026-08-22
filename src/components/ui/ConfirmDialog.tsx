'use client'

import { useEffect } from 'react'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}

const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-50 px-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirm-dialog-title'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className='bg-white border-4 border-dark rounded-2xl p-6 w-full max-w-sm shadow-brutal-lg'>
        <h3 id='confirm-dialog-title' className='text-xl font-black text-dark mb-2'>{title}</h3>
        <p className='text-sm font-medium text-gray-700 mb-8'>{message}</p>
        <div className='flex items-center justify-end gap-3'>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
