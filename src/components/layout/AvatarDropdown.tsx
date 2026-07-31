'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { logoutUser } from '@/store/redux/authSlice'
import { useRouter } from 'next/navigation'

interface AvatarDropdownProps {
  user: {
    id: string
    name: string
    email: string
  }
}

const AvatarDropdown = ({ user }: AvatarDropdownProps) => {
  const [open, setOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const router = useRouter()

  useEffect(() => {
    setImgSrc(
      `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.email}`,
    )
  }, [user.email])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
    document.cookie = 'buildfolio_user=; path=/; max-age=0; SameSite=Lax'
    setOpen(false)
    router.push('/')
  }

  return (
    <div className='relative' ref={ref}>
      <button onClick={() => setOpen(!open)} className='block btn-brutal rounded-full shadow-brutal-sm border-2 border-dark'>
        <img
          src={imgSrc || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23f3f4f6" rx="16"/></svg>`}
          alt={user.name}
          className='w-10 h-10 rounded-full bg-blue-100 object-cover'
        />
      </button>

      {open && (
        <div className='absolute right-0 mt-3 w-56 bg-white border-4 border-dark rounded-xl shadow-brutal py-2 z-50 overflow-hidden'>
          <div className='px-4 py-3 border-b-2 border-dark border-dashed'>
            <p className='font-black text-dark truncate'>
              {user.name}
            </p>
            <p className='text-xs font-bold text-gray-500 truncate'>{user.email}</p>
          </div>
          <Link
            href='/dashboard'
            onClick={() => setOpen(false)}
            className='block px-4 py-3 font-bold text-dark hover:bg-yellow-100 transition-colors'
          >
            Dashboard
          </Link>
          <Link
            href='/bookmarks'
            onClick={() => setOpen(false)}
            className='block px-4 py-3 font-bold text-dark hover:bg-yellow-100 transition-colors'
          >
            Bookmarks
          </Link>
          <Link
            href='/settings'
            onClick={() => setOpen(false)}
            className='block px-4 py-3 font-bold text-dark hover:bg-yellow-100 transition-colors border-b-2 border-dark border-dashed'
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className='block w-full text-left px-4 py-3 font-bold text-red-500 hover:bg-red-50 transition-colors'
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default AvatarDropdown
