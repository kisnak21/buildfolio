'use client'

import { useEffect, useState } from 'react'

interface AiRetryCountdownProps {
  seconds: number
  onFinished?: () => void
}

const AiRetryCountdown = ({ seconds, onFinished }: AiRetryCountdownProps) => {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (seconds <= 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset countdown when Retry-After changes
    setRemaining(seconds)
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        seconds - Math.floor((Date.now() - startedAt) / 1_000),
      )
      setRemaining(left)
      if (left === 0) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, [seconds])

  useEffect(() => {
    if (seconds > 0 && remaining === 0) onFinished?.()
  }, [remaining, seconds, onFinished])

  if (seconds <= 0) return null

  return (
    <p className='text-sm font-bold text-gray-700'>
      {remaining > 0
        ? `You can try again in ${remaining}s.`
        : 'You can try again now.'}
    </p>
  )
}

export default AiRetryCountdown
