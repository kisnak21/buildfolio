'use client'

import { ArrowPathIcon, StopIcon } from '@heroicons/react/24/solid'
import Button from '@/components/ui/Button'

interface AiGenerationProgressProps {
  label: string
  onCancel: () => void
}

const AiGenerationProgress = ({
  label,
  onCancel,
}: AiGenerationProgressProps) => (
  <div className='flex flex-col gap-4 rounded-xl border-2 border-dark bg-accentSoft p-4 sm:flex-row sm:items-center sm:justify-between'>
    <p
      role='status'
      aria-live='polite'
      className='flex min-w-0 items-center gap-3 font-bold'
    >
      <ArrowPathIcon className='h-5 w-5 shrink-0 animate-spin' aria-hidden />
      <span>{label}</span>
    </p>
    <Button
      type='button'
      variant='danger'
      size='sm'
      onClick={onCancel}
      className='min-h-11 shrink-0'
    >
      <StopIcon className='h-4 w-4' aria-hidden />
      Cancel
    </Button>
  </div>
)

export default AiGenerationProgress
