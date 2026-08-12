'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAppSelector } from '@/store/redux/hooks'
import AvatarDropdown from './AvatarDropdown'
import { Bars3Icon, XMarkIcon, CodeBracketIcon } from '@heroicons/react/24/solid'

const navLinks = [
  { label: 'Explore', href: '/projects' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Trending', href: '/#technologies' },
]

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { currentUser } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <header className='border-b-4 border-dark bg-bgMain sticky top-0 z-50'>
      <div className='max-w-6xl mx-auto px-4 py-4 flex items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='text-2xl font-black tracking-tight text-dark flex items-center gap-2'>
          <div className='w-8 h-8 bg-secondary border-2 border-dark rounded-md flex items-center justify-center shadow-brutal-sm'>
            <CodeBracketIcon className='w-5 h-5 text-dark' />
          </div>
          buildfolio
        </Link>

        {/* Desktop Nav */}
        <nav className='hidden md:flex items-center gap-8 font-semibold'>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className='text-dark hover:underline decoration-2 underline-offset-4 transition-all'
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth Actions Desktop */}
        <div className='hidden md:flex items-center gap-4 font-bold'>
          {currentUser && currentUser.id ? (
            <AvatarDropdown user={currentUser as any} />
          ) : (
            <>
              <Link href='/login' className='text-dark hover:underline decoration-2 underline-offset-4'>
                Log in
              </Link>
              <Link
                href='/register'
                className='btn-brutal bg-primary text-dark border-2 border-dark px-5 py-2.5 rounded-xl shadow-brutal hover:bg-pink-400'
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Hamburger Mobile */}
        <button
          ref={menuButtonRef}
          onClick={() => setMenuOpen(!menuOpen)}
          className='md:hidden btn-brutal p-2 border-2 border-dark rounded-lg shadow-brutal-sm bg-white'
          aria-label='Toggle menu'
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <XMarkIcon className='w-5 h-5 text-dark' />
          ) : (
            <Bars3Icon className='w-5 h-5 text-dark' />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className='md:hidden border-t-4 border-dark bg-white'>
          <nav className='max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5 font-bold'>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className='text-dark hover:underline decoration-2 underline-offset-4'
              >
                {link.label}
              </a>
            ))}
            <div className='flex flex-col gap-3 pt-4 border-t-2 border-dark border-dashed'>
              {currentUser ? (
                <>
                  <Link href='/dashboard' onClick={() => setMenuOpen(false)} className='text-dark hover:underline decoration-2 underline-offset-4'>Dashboard</Link>
                  <Link href='/bookmarks' onClick={() => setMenuOpen(false)} className='text-dark hover:underline decoration-2 underline-offset-4'>Bookmarks</Link>
                  <Link href='/liked' onClick={() => setMenuOpen(false)} className='text-dark hover:underline decoration-2 underline-offset-4'>Liked Projects</Link>
                  <Link href='/settings' onClick={() => setMenuOpen(false)} className='text-dark hover:underline decoration-2 underline-offset-4'>Settings</Link>
                </>
              ) : (
                <>
                  <Link href='/login' onClick={() => setMenuOpen(false)} className='text-dark hover:underline decoration-2 underline-offset-4'>Log in</Link>
                  <Link
                    href='/register'
                    onClick={() => setMenuOpen(false)}
                    className='btn-brutal bg-primary text-dark border-2 border-dark px-5 py-3 rounded-xl shadow-brutal text-center'
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
