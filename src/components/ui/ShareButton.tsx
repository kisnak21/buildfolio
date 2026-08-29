'use client'

import { useState } from 'react'
import {
  CheckIcon,
  ExclamationTriangleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { copyText } from '@/lib/utils'

interface ShareButtonProps {
  url: string
  title: string
  text?: string
  compact?: boolean
  className?: string
}

type ShareState = 'idle' | 'shared' | 'copied' | 'error'

const ShareButton = ({
  url,
  title,
  text,
  compact = false,
  className = '',
}: ShareButtonProps) => {
  const [state, setState] = useState<ShareState>('idle')
  const nativeShareAvailable =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    try {
      const absoluteUrl = new URL(url, window.location.origin).toString()
      if (nativeShareAvailable) {
        try {
          await navigator.share({ title, text, url: absoluteUrl })
          setState('shared')
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return
        }
      }

      await copyText(absoluteUrl)
      setState('copied')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setState('error')
    }
  }

  const label = state === 'shared'
    ? 'Shared'
    : state === 'copied'
      ? 'Link copied'
      : state === 'error'
        ? 'Share failed'
        : 'Share project'

  return (
    <button
      type='button'
      onClick={handleShare}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border-2 border-dark bg-white font-bold text-dark shadow-brutal-sm transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark ${className}`}
    >
      {state === 'shared' || state === 'copied' ? (
        <CheckIcon className='h-5 w-5' aria-hidden />
      ) : state === 'error' ? (
        <ExclamationTriangleIcon className='h-5 w-5' aria-hidden />
      ) : (
        <ShareIcon className='h-5 w-5' aria-hidden />
      )}
      {!compact && <span>{label}</span>}
      <span className='sr-only' aria-live='polite'>{state === 'idle' ? '' : label}</span>
    </button>
  )
}

export default ShareButton
