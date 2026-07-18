'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import AvatarDropdown from './AvatarDropdown'

const navLinks = [
  { label: 'Projects', href: '#projects' },
  { label: 'Categories', href: '#categories' },
  { label: 'Technologies', href: '#technologies' },
]

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { currentUser } = useSelector((state: any) => state.auth)

  return (
    <header className='border-b border-gray-200 sticky top-0 z-50 bg-white/80 backdrop-blur-sm'>
      <div className='max-w-6xl mx-auto px-4 py-3 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='w-7 h-7 bg-primary rounded-md flex items-center justify-center'>
            <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
              <rect x='1' y='1' width='5' height='5' rx='1' fill='white' />
              <rect x='8' y='1' width='5' height='5' rx='1' fill='white' opacity='0.6' />
              <rect x='1' y='8' width='5' height='5' rx='1' fill='white' opacity='0.6' />
              <rect x='8' y='8' width='5' height='5' rx='1' fill='white' opacity='0.3' />
            </svg>
          </div>
          <span className='text-sm font-medium text-gray-900'>Buildfolio</span>
        </Link>

        <nav className='hidden md:flex items-center gap-6'>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className='hidden md:flex items-center gap-3'>
          {currentUser ? (
            <AvatarDropdown user={currentUser} />
          ) : (
            <>
              <Link href='/login' className='text-sm text-gray-500 hover:text-gray-900 transition-colors'>
                Log in
              </Link>
              <Link
                href='/register'
                className='text-sm bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg transition-colors'
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className='md:hidden flex flex-col gap-1.5 p-1'
          aria-label='Toggle menu'
        >
          <span
            className='w-5 h-px bg-gray-600 block transition-all duration-300'
            style={menuOpen ? { transform: 'translateY(6px) rotate(45deg)' } : undefined}
          />
          <span
            className='w-5 h-px bg-gray-600 block transition-all duration-300'
            style={menuOpen ? { opacity: 0 } : undefined}
          />
          <span
            className='w-5 h-px bg-gray-600 block transition-all duration-300'
            style={menuOpen ? { transform: 'translateY(-6px) rotate(-45deg)' } : undefined}
          />
        </button>
      </div>

      {menuOpen && (
        <div className='md:hidden border-t border-gray-200 bg-white'>
          <nav className='max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4'>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
              >
                {link.label}
              </a>
            ))}
            <div className='flex flex-col gap-2 pt-2 border-t border-gray-200'>
              {currentUser ? (
                <>
                  <Link
                    href='/dashboard'
                    onClick={() => setMenuOpen(false)}
                    className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
                  >
                    Dashboard
                  </Link>
                  <Link
                    href='/bookmarks'
                    onClick={() => setMenuOpen(false)}
                    className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
                  >
                    Bookmarks
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href='/login'
                    onClick={() => setMenuOpen(false)}
                    className='text-sm text-gray-500 hover:text-gray-900 transition-colors'
                  >
                    Log in
                  </Link>
                  <Link
                    href='/register'
                    onClick={() => setMenuOpen(false)}
                    className='text-sm bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg transition-colors text-center'
                  >
                    Sign up
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
