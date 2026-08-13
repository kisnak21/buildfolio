'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/redux/hooks'
import { hideToast, type ToastType } from '@/store/redux/toastSlice'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid'

const toastStyles: Record<ToastType, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'bg-[#bbf7d0] border-dark',
    icon: <CheckCircleIcon className='w-6 h-6 text-dark shrink-0' />,
  },
  error: {
    box: 'bg-[#fecaca] border-dark',
    icon: <XCircleIcon className='w-6 h-6 text-dark shrink-0' />,
  },
  info: {
    box: 'bg-[#c4f0ff] border-dark',
    icon: <InformationCircleIcon className='w-6 h-6 text-dark shrink-0' />,
  },
}

const Toast = () => {
  const dispatch = useAppDispatch()
  const { message, type, visible } = useAppSelector((state) => state.toast)
  const toastType = type as ToastType
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    const leaveTimer = setTimeout(() => setLeaving(true), 3200)
    const hideTimer = setTimeout(() => dispatch(hideToast()), 3500)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(hideTimer)
    }
  }, [visible, dispatch])

  if (!visible) return null

  const style = toastStyles[toastType]

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] ${
        leaving
          ? 'animate-[fadeOutDown_0.3s_ease-in_forwards]'
          : 'animate-[fadeInUp_0.2s_ease-out]'
      }`}
    >
      <div
        className={`flex items-center gap-4 border-4 border-dark rounded-2xl px-5 py-4 shadow-brutal max-w-sm ${style.box}`}
      >
        {style.icon}
        <p className='font-bold text-dark text-sm leading-snug flex-1'>{message}</p>
        <button
          onClick={() => dispatch(hideToast())}
          className='btn-brutal w-7 h-7 flex items-center justify-center border-2 border-dark rounded-md bg-white shadow-brutal-sm hover:bg-gray-100 shrink-0'
          aria-label='Close notification'
        >
          <XMarkIcon className='w-4 h-4 text-dark' />
        </button>
      </div>
    </div>
  )
}

export default Toast
